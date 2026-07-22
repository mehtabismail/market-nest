import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationFeedService } from '../notifications/notification-feed.service';

/** Wizard steps, in the order the mobile flow presents them. */
export const KYC_STEPS = ['personal', 'business', 'documents', 'bank', 'review'] as const;
export type KycStep = (typeof KYC_STEPS)[number];

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: NotificationFeedService,
  ) {}

  private async sellerFor(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!seller) throw new NotFoundException('No seller account for this user');
    return seller;
  }

  /**
   * The seller's application, created lazily on first read.
   *
   * Creating on read rather than at seller-invite time keeps the table free of
   * empty rows for sellers who never start verification, and means the mobile
   * wizard has something to resume from without a separate "begin" call.
   */
  async getOwn(userId: string) {
    const seller = await this.sellerFor(userId);

    const existing = await this.prisma.sellerKyc.findUnique({ where: { sellerId: seller.id } });
    if (existing) return this.present(existing);

    const created = await this.prisma.sellerKyc.create({ data: { sellerId: seller.id } });
    return this.present(created);
  }

  /**
   * Saves one wizard step.
   *
   * `completedStep` only ever moves forward. A seller revisiting step 1 to fix
   * a typo must not reset the progress bar and lose steps 2–4.
   */
  async saveStep(userId: string, step: KycStep, payload: Record<string, unknown>) {
    const seller = await this.sellerFor(userId);
    const record = await this.prisma.sellerKyc.findUnique({ where: { sellerId: seller.id } });

    if (record && record.status === 'approved') {
      throw new ForbiddenException('Approved verification cannot be edited.');
    }

    const stepIndex = KYC_STEPS.indexOf(step);
    if (stepIndex < 0) throw new BadRequestException('Unknown verification step');

    // `review` is a confirmation screen, not a data step — it has no column.
    const data: Record<string, unknown> = {
      completedStep: Math.max(record?.completedStep ?? 0, stepIndex + 1),
      // A rejected application that is being edited returns to draft, so the
      // seller is not stuck looking at a rejection banner while fixing it.
      status: record?.status === 'rejected' ? KycStatus.draft : (record?.status ?? KycStatus.draft),
      rejectionReason: record?.status === 'rejected' ? null : (record?.rejectionReason ?? null),
    };
    if (step !== 'review') data[step] = payload;

    const updated = await this.prisma.sellerKyc.upsert({
      where: { sellerId: seller.id },
      create: { sellerId: seller.id, ...data },
      update: data,
    });

    return this.present(updated);
  }

  async submit(userId: string) {
    const seller = await this.sellerFor(userId);
    const record = await this.prisma.sellerKyc.findUnique({ where: { sellerId: seller.id } });

    if (!record) throw new NotFoundException('Start your verification first');
    if (record.status === 'submitted') throw new BadRequestException('Already submitted');
    if (record.status === 'approved') throw new BadRequestException('Already approved');

    // Every data step must be present. Checking here rather than trusting
    // `completedStep` means a client that skips ahead cannot submit a blank
    // application.
    const missing = (['personal', 'business', 'documents', 'bank'] as const).filter((key) => {
      const value = record[key] as Record<string, unknown> | null;
      return !value || Object.keys(value).length === 0;
    });
    if (missing.length > 0) {
      throw new BadRequestException(`Incomplete verification: ${missing.join(', ')}`);
    }

    const updated = await this.prisma.sellerKyc.update({
      where: { sellerId: seller.id },
      data: { status: KycStatus.submitted, submittedAt: new Date(), completedStep: KYC_STEPS.length },
    });

    await this.feed.create({
      userId,
      type: 'kyc',
      title: 'Verification submitted',
      body: 'We review applications within 24–48 hours.',
    });

    return this.present(updated);
  }

  /** Admin review queue. Defaults to what actually needs a decision. */
  listForReview(status: KycStatus = KycStatus.submitted) {
    return this.prisma.sellerKyc.findMany({
      where: { status },
      orderBy: { submittedAt: 'asc' },
      include: {
        seller: { select: { id: true, storeName: true, storeSlug: true, inviteEmail: true } },
      },
    });
  }

  async decide(
    kycId: string,
    reviewerId: string,
    decision: 'approve' | 'reject',
    reason?: string,
  ) {
    const record = await this.prisma.sellerKyc.findUnique({
      where: { id: kycId },
      include: { seller: { select: { id: true, userId: true } } },
    });
    if (!record) throw new NotFoundException('Application not found');
    if (record.status !== KycStatus.submitted) {
      throw new BadRequestException('Only submitted applications can be reviewed');
    }
    if (decision === 'reject' && !reason?.trim()) {
      // A rejection the seller cannot act on generates a support ticket, so the
      // reason is required rather than optional.
      throw new BadRequestException('A rejection reason is required');
    }

    const approved = decision === 'approve';

    // Approving KYC is what marks the seller verified — the trust badge on the
    // product page and the verification record must never disagree, so both
    // writes land in one transaction.
    const [updated] = await this.prisma.$transaction([
      this.prisma.sellerKyc.update({
        where: { id: kycId },
        data: {
          status: approved ? KycStatus.approved : KycStatus.rejected,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          rejectionReason: approved ? null : reason!.trim(),
        },
      }),
      this.prisma.seller.update({
        where: { id: record.seller.id },
        data: { isVerified: approved, ...(approved ? { status: 'active' } : {}) },
      }),
    ]);

    if (record.seller.userId) {
      await this.feed.create({
        userId: record.seller.userId,
        type: 'kyc',
        title: approved ? 'You are verified' : 'Verification needs attention',
        body: approved
          ? 'Your store is live. You can start listing products.'
          : reason!.trim(),
      });
    }

    return this.present(updated);
  }

  /**
   * Strips the bank block down to a masked tail.
   *
   * Account numbers are write-only from the client's perspective: the wizard
   * needs to show *which* account is on file, never the number itself, so no
   * read path returns it.
   */
  private present<T extends { bank: unknown }>(record: T) {
    const bank = (record.bank ?? {}) as Record<string, string>;
    const account = bank.accountNumber ?? '';

    return {
      ...record,
      bank: {
        ...bank,
        accountNumber: undefined,
        accountLast4: account ? account.slice(-4) : null,
      },
    };
  }
}
