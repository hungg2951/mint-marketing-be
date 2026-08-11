import { Module } from '@nestjs/common';
import { ShopifyAuthService } from './shopify-auth.service';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { SegmentService } from './segment.service';
import { SegmentController } from './segment.controller';

@Module({
  controllers: [CustomerController, SegmentController],
  providers: [ShopifyAuthService, CustomerService, SegmentService],
  exports: [ShopifyAuthService, CustomerService, SegmentService],
})
export class ShopifyModule {}

