import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  listForProduct(@Param('productId') productId: string) {
    return this.reviews.listForProduct(productId);
  }

  @ApiBearerAuth()
  @Roles('buyer')
  @Get('reviewable')
  reviewable(@CurrentUser() user: RequestUser) {
    return this.reviews.reviewableProducts(user.id);
  }

  @ApiBearerAuth()
  @Roles('buyer')
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.id, dto.productId, dto.rating, dto.body);
  }
}
