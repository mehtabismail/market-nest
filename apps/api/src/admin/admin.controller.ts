import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { AuditService } from '../audit/audit.service';
import { InviteSellerDto } from './dto/invite-seller.dto';
import { SuspendSellerDto } from './dto/suspend-seller.dto';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { ListProductsQuery } from '../products/dto/list-products.query';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ProductsService } from '../products/products.service';
import { ListUsersQuery } from './dto/list-users.query';

@ApiTags('admin')
@ApiBearerAuth()
@Roles('superadmin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly admin: AdminService,
    private readonly orders: OrdersService,
    private readonly analytics: AnalyticsService,
    private readonly audit: AuditService,
    private readonly products: ProductsService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    const [sellers, buyers, ordersToday] = await Promise.all([
      this.prisma.seller.count({ where: { isSystem: false, isActive: true } }),
      this.prisma.profile.count({ where: { role: 'buyer' } }),
      this.prisma.order.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);

    const gmvToday = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { notIn: ['cancelled', 'refunded'] },
      },
      _sum: { total: true },
    });

    return {
      totalSellers: sellers,
      totalBuyers: buyers,
      ordersToday,
      gmvToday: Number(gmvToday._sum.total ?? 0),
    };
  }

  @Get('sellers')
  listSellers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.admin.listSellers(Number(page) || 1, Number(limit) || 20);
  }

  @Get('users')
  listUsers(@Query() query: ListUsersQuery) {
    return this.admin.listUsers(query.page, query.limit, query.role);
  }

  @Post('sellers')
  inviteSeller(@CurrentUser() user: RequestUser, @Body() dto: InviteSellerDto) {
    return this.admin.inviteSeller(dto, user.id);
  }

  @Post('sellers/:id/resend-invite')
  resendInvite(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.admin.resendInvite(id, user.id);
  }

  @Patch('sellers/:id/suspend')
  suspend(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SuspendSellerDto,
  ) {
    return this.admin.suspendSeller(id, dto.reason, user.id);
  }

  @Patch('sellers/:id/reactivate')
  reactivate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.admin.reactivateSeller(id, user.id);
  }

  @Delete('sellers/:id')
  deleteSeller(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.admin.deleteSeller(id, user.id);
  }

  @Get('analytics')
  getAnalytics(@Query('days') days?: number) {
    return this.analytics.getPlatformAnalytics(Number(days) || 30);
  }

  @Get('analytics/export')
  async exportAnalytics(@Query('days') days?: number) {
    const csv = await this.analytics.exportCsv(Number(days) || 30);
    return { csv, filename: `marketnest-analytics-${Date.now()}.csv` };
  }

  @Post('analytics/export')
  queueExport(@Query('days') days?: number) {
    return this.analytics.enqueueExport(Number(days) || 30);
  }

  @Get('analytics/export/:jobId')
  exportStatus(@Param('jobId') jobId: string) {
    return this.analytics.getExportStatus(jobId);
  }

  @Get('revenue')
  revenue(@Query('days') days?: number) {
    return this.analytics.getRevenueSummary(Number(days) || 30);
  }

  @Get('audit-logs')
  auditLogs(@Query('page') page?: number) {
    return this.audit.list(Number(page) || 1);
  }

  @Get('products')
  listProducts(@Query() query: ListProductsQuery) {
    return this.admin.listProducts(query);
  }

  @Post('products')
  createProduct(@CurrentUser() user: RequestUser, @Body() dto: CreateProductDto) {
    return this.admin.createProduct(dto, user.id);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.updateForAdmin(id, dto);
  }

  @Get('products/:id/buyer-preview')
  buyerPreview(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.admin.previewBuyerProduct(id, user.id);
  }

  @Get('orders')
  listOrders() {
    return this.orders.listAllAdmin();
  }

  @Get('fulfilment')
  platformFulfilment() {
    return this.orders.listPlatformFulfilment();
  }
}
