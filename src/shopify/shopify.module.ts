import { Module } from '@nestjs/common';
import { ShopifyAuthService } from './shopify-auth.service';
import { CustomerService } from './customer/customer.service';
import { CustomerController } from './customer/customer.controller';
import { SegmentService } from './segment/segment.service';
import { SegmentController } from './segment/segment.controller';

@Module({
  controllers: [CustomerController, SegmentController],
  providers: [ShopifyAuthService, CustomerService, SegmentService],
  exports: [ShopifyAuthService, CustomerService, SegmentService],
})
export class ShopifyModule {}


