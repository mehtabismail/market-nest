import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module';
import { SearchModule } from '../search/search.module';
import { ProductsController, SellerProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [ReviewsModule, SearchModule],
  controllers: [ProductsController, SellerProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
