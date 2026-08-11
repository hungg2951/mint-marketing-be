import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  constructor(private readonly shopifyService: ShopifyService) {}

  @Get('test-customers')
  async getTestCustomers() {
    try {
      const result = await this.shopifyService.getCustomers();
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch customers from Shopify',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('segments')
  async getSegments() {
    try {
      const segments = await this.shopifyService.getSegments();
      return {
        success: true,
        total: segments.length,
        data: segments,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch segments from Shopify',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('segments/:id/members')
  async getSegmentMembers(@Param('id') id: string) {
    try {
      const gid = `gid://shopify/Segment/${id}`;
      const members = await this.shopifyService.getSegmentMembers(gid);
      return {
        success: true,
        total: members.length,
        data: members,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch segment members from Shopify',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
