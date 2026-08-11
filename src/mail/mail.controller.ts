import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { MailService } from './mail.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendTemplateEmailDto } from './dto/send-template-email.dto';
import { MailQueueService } from './mail-queue.service';
import { SendBulkTemplateEmailDto } from './dto/send-bulk-template-email.dto';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly mailQueueService: MailQueueService,
  ) {}

  @Post('send')
  async send(@Body() dto: SendEmailDto) {
    try {
      const result = await this.mailService.sendEmail(dto);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(
        { success: false, error: error.message || 'Failed to send email' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates')
  async getTemplates() {
    try {
      const templates = await this.mailService.listTemplates();
      return { success: true, data: templates };
    } catch (error: any) {
      throw new HttpException(
        { success: false, error: error.message || 'Failed to fetch templates' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('templates/:id')
  async getTemplateDetail(@Param('id') id: string) {
    try {
      const template = await this.mailService.getTemplateDetail(id);
      return { success: true, data: template };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to fetch template detail',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-template')
  async sendTemplate(@Body() dto: SendTemplateEmailDto) {
    try {
      const result = await this.mailService.sendTemplateEmail(dto);
      return { success: true, data: result };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to send template email',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-bulk-template')
  async sendBulkTemplate(@Body() dto: SendBulkTemplateEmailDto) {
    try {
      const result = await this.mailQueueService.enqueueBulkTemplateEmail(dto);
      return {
        success: true,
        message: `${result.jobCount} emails queued successfully`,
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          error: error.message || 'Failed to queue bulk emails',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queue-status')
  async getQueueStatus() {
    try {
      const status = await this.mailQueueService.getQueueStatus();
      return { success: true, data: status };
    } catch (error: any) {
      throw new HttpException(
        { success: false, error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
