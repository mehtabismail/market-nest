import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KycStatus } from '@prisma/client';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { KYC_STEPS, KycService } from './kyc.service';

class SaveStepDto {
  @IsObject()
  payload!: Record<string, unknown>;
}

class StartOnboardingDto {
  @IsOptional()
  @IsString()
  storeName?: string;
}

class DecisionDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  reason?: string;
}

@ApiTags('kyc')
@ApiBearerAuth()
@Controller()
export class KycController {
  constructor(private readonly kyc: KycService) {}

  // A buyer starts here — this is the one seller route reachable without the
  // seller role, because it is what grants that role. Superadmins are excluded:
  // they operate the platform, they do not open storefronts.
  @Roles('buyer', 'seller')
  @Post('seller/onboarding')
  startOnboarding(@CurrentUser() user: RequestUser, @Body() dto: StartOnboardingDto) {
    return this.kyc.startOnboarding(user.id, dto.storeName);
  }

  @Roles('seller')
  @Get('seller/kyc')
  getOwn(@CurrentUser() user: RequestUser) {
    return this.kyc.getOwn(user.id);
  }

  @Roles('seller')
  @Put('seller/kyc/:step')
  saveStep(
    @CurrentUser() user: RequestUser,
    @Param('step') step: string,
    @Body() dto: SaveStepDto,
  ) {
    // Validated against the literal list rather than trusting the path segment,
    // so an unknown step cannot become a JSON column write.
    const match = KYC_STEPS.find((s) => s === step);
    if (!match) throw new BadRequestException(`Unknown step: expected one of ${KYC_STEPS.join(', ')}`);
    return this.kyc.saveStep(user.id, match, dto.payload);
  }

  @Roles('seller')
  @Post('seller/kyc/submit')
  submit(@CurrentUser() user: RequestUser) {
    return this.kyc.submit(user.id);
  }

  @Roles('superadmin')
  @Get('admin/kyc')
  listForReview(@Query('status') status?: KycStatus) {
    return this.kyc.listForReview(status ?? KycStatus.submitted);
  }

  @Roles('superadmin')
  @Post('admin/kyc/:id/decision')
  decide(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.kyc.decide(id, user.id, dto.decision, dto.reason);
  }
}
