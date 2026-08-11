import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { SegmentService } from './segment.service';

@Controller('shopify')
export class SegmentController {
  constructor(private readonly segmentService: SegmentService) {}

  @Get('segments')
  async getSegments() {
    try {
      const segments = await this.segmentService.getSegments();
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
      const members = await this.segmentService.getSegmentMembers(gid);
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
