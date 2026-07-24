import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { KycStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileCacheService } from '../auth/profile-cache.service';
import { NotificationFeedService } from '../notifications/notification-feed.service';

/** Wizard steps, in the order the mobile flow presents them. */
export const KYC_STEPS = ['personal', 'business', 'documents', 'bank', 'review'] as const;
export type KycStep = (typeof KYC_STEPS)[number];

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileCache: ProfileCacheService,
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
   * Self-serve buyer → seller onboarding.
   *
   * The product decision (see PRD/Phases) is that a buyer can start selling
   * without an admin invite: this creates their store, upgrades the account to
   * the `seller` role, and opens a blank KYC application the wizard resumes
   * from. The `seller` role is a *superset* — the buyer endpoints (orders,
   * wishlist, reviews) accept sellers too, so becoming a seller never costs
   * someone their ability to shop. Verification (KYC approval) is what later
   * flips `isVerified`/`status:active`; onboarding alone does not.
   *
   * Idempotent: a user who already has a store just gets their existing
   * application back, so a double-tap on "Start Selling" cannot create a second
   * seller row (which the unique `userId` would reject anyway).
   */
  async startOnboarding(userId: string, storeName?: string) {
    const existing = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) return this.getOwn(userId);

    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    const name = (storeName?.trim() || profile.fullName?.trim() || 'My Store').slice(0, 60);

    const seller = await this.prisma.seller.create({
      data: {
        userId,
        storeName: name,
        storeSlug: await this.uniqueStoreSlug(name),
        // Not `invited` (that path is admin-created) and not yet `active`:
        // onboarding sellers can sign in and complete KYC, but listing waits
        // on verification (`isVerified`).
        status: 'onboarding',
        isActive: true,
        isVerified: false,
      },
      select: { id: true },
    });

    await this.prisma.profile.update({ where: { id: userId }, data: { role: 'seller' } });
    // The role lives in the profile cache the JWT guard reads; without this the
    // next request would still see the stale `buyer` role and 403 the wizard.
    await this.profileCache.invalidate(userId);

    const kyc = await this.prisma.sellerKyc.create({ data: { sellerId: seller.id } });

    await this.feed.create({
      userId,
      type: 'system',
      title: 'Welcome to Seller Central',
      body: 'Complete verification to start listing your products.',
      link: '/kyc',
    });

    return this.present(kyc);
  }

  /** Slugifies the store name and appends entropy so two "My Store"s never collide. */
  private async uniqueStoreSlug(name: string) {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'store';
    // The unique constraint is the real guard; a short random suffix makes a
    // collision vanishingly unlikely without a read-then-write race.
    return `${base}-${randomBytes(3).toString('hex')}`;
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
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true, createdBy: true, storeName: true },
    });
    if (!seller) throw new NotFoundException('No seller account for this user');

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

    // Admin-invited sellers (`createdBy` set) already passed an admin gate, so
    // completing KYC auto-verifies — no second review in the queue. Self-serve
    // applicants go to `submitted` for admin approve/reject.
    const invitedByAdmin = Boolean(seller.createdBy);

    if (invitedByAdmin) {
      const [updated] = await this.prisma.$transaction([
        this.prisma.sellerKyc.update({
          where: { sellerId: seller.id },
          data: {
            status: KycStatus.approved,
            submittedAt: new Date(),
            reviewedAt: new Date(),
            completedStep: KYC_STEPS.length,
            rejectionReason: null,
          },
        }),
        this.prisma.seller.update({
          where: { id: seller.id },
          data: { isVerified: true, status: 'active', isActive: true },
        }),
      ]);

      await this.feed.create({
        userId,
        type: 'kyc',
        title: 'You are verified',
        body: 'Your invite is complete. You can start listing products.',
        link: '/kyc',
      });

      return this.present(updated);
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
      link: '/kyc',
    });

    // Fan-out to every superadmin so the request shows in their in-app feed
    // (the /admin/kyc queue is still the place they act on it).
    const admins = await this.prisma.profile.findMany({
      where: { role: 'superadmin' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        this.feed.create({
          userId: admin.id,
          type: 'kyc',
          title: 'New seller verification',
          body: `${seller.storeName} submitted KYC for review.`,
          link: '/admin/kyc',
        }),
      ),
    );

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
        link: '/kyc',
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
