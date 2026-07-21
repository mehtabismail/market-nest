import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { slugify } from '@marketnest/utils';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { ProfileCacheService } from '../auth/profile-cache.service';
import { AuditService } from '../audit/audit.service';
import { ProductsService } from '../products/products.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ListProductsQuery } from '../products/dto/list-products.query';
import { InviteSellerDto } from './dto/invite-seller.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { isAuthEmailBypassEnabled, isSupabaseEmailRateLimitError } from '../auth/auth-env';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly products: ProductsService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly profileCache: ProfileCacheService,
  ) {}

  async listSellers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.SellerWhereInput = { isSystem: false };

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true } },
          _count: { select: { products: true } },
        },
      }),
      this.prisma.seller.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async listUsers(page = 1, limit = 20, role?: UserRole) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProfileWhereInput = role ? { role } : {};
    const [items, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          role: true,
          fullName: true,
          phone: true,
          createdAt: true,
          seller: {
            select: {
              id: true,
              storeName: true,
              isActive: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async inviteSeller(dto: InviteSellerDto, adminId: string) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.seller.findFirst({
      where: { inviteEmail: email },
    });
    if (existing && existing.status !== 'deleted') {
      throw new BadRequestException('Seller with this email already invited');
    }

    const storeSlug = await this.resolveUniqueStoreSlug(dto.storeName);

    let seller;
    try {
      seller = await this.prisma.seller.create({
        data: {
          storeName: dto.storeName,
          storeSlug,
          inviteEmail: email,
          commissionRate: dto.commissionRate,
          status: 'invited',
          createdBy: adminId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(', ')
          : String(err.meta?.target ?? 'field');
        throw new ConflictException(`A seller with this ${target} already exists`);
      }
      throw err;
    }

    const redirectTo =
      process.env.SELLER_INVITE_REDIRECT_URL ?? 'http://localhost:3000/seller/set-password';

    try {
      const { actionLink } = await this.sendSellerInviteEmail(email, redirectTo);
      await this.audit.log({
        actorId: adminId,
        action: 'seller.invite',
        entityType: 'seller',
        entityId: seller.id,
        metadata: { email, storeName: dto.storeName, emailBypass: Boolean(actionLink) },
      });

      return { ...seller, actionLink: actionLink ?? null, emailBypass: isAuthEmailBypassEnabled() };
    } catch (err) {
      await this.prisma.seller.delete({ where: { id: seller.id } });
      throw err;
    }
  }

  async resendInvite(id: string, adminId: string) {
    const seller = await this.getSeller(id);
    if (!seller.inviteEmail) {
      throw new BadRequestException('Seller invite email is missing');
    }
    if (seller.status === 'deleted') {
      throw new BadRequestException('Cannot resend invite for deleted sellers');
    }

    const redirectTo =
      process.env.SELLER_INVITE_REDIRECT_URL ?? 'http://localhost:3000/seller/set-password';

    const normalizedStatus = seller.status.trim().toLowerCase();
    const pendingActivation = normalizedStatus === 'invited' || !seller.userId;

    let actionLink: string | undefined;
    if (pendingActivation) {
      ({ actionLink } = await this.sendSellerInviteEmail(seller.inviteEmail, redirectTo));
    } else {
      ({ actionLink } = await this.sendSellerPasswordResetEmail(seller.inviteEmail, redirectTo));
    }

    await this.audit.log({
      actorId: adminId,
      action: pendingActivation ? 'seller.resend_invite' : 'seller.send_reset_link',
      entityType: 'seller',
      entityId: seller.id,
      metadata: { email: seller.inviteEmail, emailBypass: Boolean(actionLink) },
    });

    return {
      ok: true,
      kind: pendingActivation ? 'invite' : 'reset',
      actionLink: actionLink ?? null,
      emailBypass: isAuthEmailBypassEnabled(),
    };
  }

  async suspendSeller(id: string, reason: string, actorId?: string) {
    const seller = await this.getSeller(id);
    await this.prisma.seller.update({
      where: { id },
      data: { isActive: false, status: 'suspended' },
    });
    await this.prisma.product.updateMany({
      where: { sellerId: id },
      data: { status: 'archived' },
    });
    // JwtAuthGuard checks suspension against the cached profile, so without
    // this the seller keeps trading until the TTL expires.
    await this.profileCache.invalidate(seller.userId);
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'seller.suspend',
      entityType: 'seller',
      entityId: id,
      metadata: { reason },
    });
    if (process.env.SENDGRID_API_KEY) {
      void this.notifications.enqueueEmail('seller_suspended', {
        sellerId: seller.id,
        reason,
      });
    }
    return { ok: true, reason };
  }

  async reactivateSeller(id: string, actorId?: string) {
    const seller = await this.getSeller(id);
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'seller.reactivate',
      entityType: 'seller',
      entityId: id,
    });
    const updated = await this.prisma.seller.update({
      where: { id },
      data: { isActive: true, status: 'active' },
    });
    // Without this the cached profile still says suspended, so a reinstated
    // seller stays locked out until the TTL expires.
    await this.profileCache.invalidate(seller.userId);
    return updated;
  }

  listProducts(query: ListProductsQuery) {
    return this.products.listForAdmin(query);
  }

  createProduct(dto: CreateProductDto, adminId: string) {
    return this.products.createForAdmin(dto, adminId);
  }

  updateProduct(id: string, dto: UpdateProductDto) {
    return this.products.updateForAdmin(id, dto);
  }

  async previewBuyerProduct(id: string, actorId: string) {
    const product = await this.products.getBuyerPreviewForAdmin(id);
    await this.audit.log({
      actorId,
      action: 'product.buyer_preview',
      entityType: 'product',
      entityId: id,
    });
    return product;
  }

  async deleteSeller(id: string, actorId?: string) {
    const seller = await this.getSeller(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.seller.update({
        where: { id },
        data: { isActive: false, status: 'deleted' },
      });
      await tx.product.updateMany({
        where: { sellerId: id },
        data: { status: 'archived' },
      });
    });
    await this.profileCache.invalidate(seller.userId);
    await this.audit.log({
      actorId: actorId ?? null,
      action: 'seller.delete',
      entityType: 'seller',
      entityId: id,
    });
    return { ok: true };
  }

  private async sendSellerPasswordResetEmail(
    email: string,
    redirectTo: string,
  ): Promise<{ actionLink?: string }> {
    if (isAuthEmailBypassEnabled()) {
      return { actionLink: await this.generateAuthLink(email, redirectTo, 'recovery') };
    }

    const client = this.supabase.getClient();
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (!error) return {};

    if (isSupabaseEmailRateLimitError(error.message)) {
      return { actionLink: await this.generateAuthLink(email, redirectTo, 'recovery') };
    }

    throw new BadRequestException(error.message);
  }

  private async sendSellerInviteEmail(
    email: string,
    redirectTo: string,
  ): Promise<{ actionLink?: string }> {
    if (isAuthEmailBypassEnabled()) {
      return { actionLink: await this.generateAuthLink(email, redirectTo, 'invite') };
    }

    const client = this.supabase.getClient();

    let { error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (!error) return {};

    const msg = error.message.toLowerCase();
    if (isSupabaseEmailRateLimitError(error.message)) {
      return { actionLink: await this.generateAuthLink(email, redirectTo, 'invite') };
    }

    const alreadyRegistered =
      msg.includes('already been registered') || msg.includes('already registered');

    if (!alreadyRegistered) {
      throw new BadRequestException(error.message);
    }

    const authUser = await this.findAuthUserByEmail(email);
    if (!authUser) {
      throw new BadRequestException(error.message);
    }

    if (!(await this.canReuseAuthUserForSellerInvite(authUser.id))) {
      throw new ConflictException(
        'This email is already registered to another account. Delete it in Supabase Auth or use a different email.',
      );
    }

    const { error: deleteError } = await client.auth.admin.deleteUser(authUser.id);
    if (deleteError) {
      throw new BadRequestException(deleteError.message);
    }

    ({ error } = await client.auth.admin.inviteUserByEmail(email, { redirectTo }));
    if (!error) return {};

    if (isSupabaseEmailRateLimitError(error.message)) {
      return { actionLink: await this.generateAuthLink(email, redirectTo, 'invite') };
    }

    throw new BadRequestException(error.message);
  }

  private async generateAuthLink(
    email: string,
    redirectTo: string,
    type: 'invite' | 'recovery',
  ): Promise<string> {
    const client = this.supabase.getClient();
    let linkType = type;

    if (linkType === 'invite') {
      const authUser = await this.findAuthUserByEmail(email);
      if (authUser) {
        if (await this.canReuseAuthUserForSellerInvite(authUser.id)) {
          const { error: deleteError } = await client.auth.admin.deleteUser(authUser.id);
          if (deleteError) {
            throw new BadRequestException(deleteError.message);
          }
        } else {
          linkType = 'recovery';
        }
      }
    }

    const { data, error } = await client.auth.admin.generateLink({
      type: linkType,
      email,
      options: { redirectTo },
    });

    if (error) {
      if (linkType === 'invite') {
        return this.generateAuthLink(email, redirectTo, 'recovery');
      }
      throw new BadRequestException(error.message);
    }

    const link = data.properties?.action_link;
    if (!link) {
      throw new BadRequestException('Could not generate auth link');
    }

    if (isAuthEmailBypassEnabled()) {
      console.log(`[AUTH_EMAIL_BYPASS] ${linkType} link for ${email}: ${link}`);
    }

    return link;
  }

  private async findAuthUserByEmail(email: string) {
    const client = this.supabase.getClient();
    const normalized = email.toLowerCase();
    let page = 1;

    while (true) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
      if (error) {
        throw new BadRequestException(error.message);
      }

      const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
      if (match) return match;

      if (data.users.length < 200) return null;
      page += 1;
    }
  }

  /** True when Auth user is leftover from a deleted/uncompleted seller invite. */
  private async canReuseAuthUserForSellerInvite(userId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (profile?.role === 'superadmin' || profile?.role === 'buyer') {
      return false;
    }

    const activeSeller = await this.prisma.seller.findFirst({
      where: {
        userId,
        isSystem: false,
        status: { not: 'deleted' },
      },
      select: { id: true },
    });

    return !activeSeller;
  }

  private async resolveUniqueStoreSlug(storeName: string): Promise<string> {
    const base = slugify(storeName) || 'store';
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.seller.findUnique({
        where: { storeSlug: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async getSeller(id: string) {
    const seller = await this.prisma.seller.findFirst({
      where: { id, isSystem: false },
    });
    if (!seller) throw new NotFoundException('Seller not found');
    return seller;
  }
}
