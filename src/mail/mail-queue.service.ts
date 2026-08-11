import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SendBulkTemplateEmailDto } from './dto/send-bulk-template-email.dto';

export interface MailJobData {
  templateId: string;
  to: string;
  subject?: string;
  variables?: Record<string, string>;
}

@Injectable()
export class MailQueueService {
  constructor(@InjectQueue('mail-queue') private readonly mailQueue: Queue<MailJobData>) {}

  /**
   * Đẩy nhiều job gửi mail vào queue, mỗi recipient là 1 job riêng
   */
  async enqueueBulkTemplateEmail(dto: SendBulkTemplateEmailDto): Promise<{ jobCount: number; batchId: string }> {
    const batchId = `batch_${Date.now()}`;

    const jobs = dto.recipients.map((recipient) => ({
      name: 'send-template-email',
      data: {
        templateId: dto.templateId,
        to: recipient.email,
        subject: dto.subject,
        variables: recipient.variables,
      },
      opts: {
        attempts: 3, // tự động retry tối đa 3 lần nếu fail
        backoff: {
          type: 'exponential' as const,
          delay: 2000, // lần retry đầu chờ 2s, sau đó tăng dần
        },
        removeOnComplete: 1000, // giữ lại tối đa 1000 job đã complete để tra cứu, tránh phình Redis
        removeOnFail: 5000,
      },
    }));

    await this.mailQueue.addBulk(jobs);

    return { jobCount: jobs.length, batchId };
  }

  /**
   * Lấy trạng thái tổng quan của queue (để FE hiển thị tiến độ)
   */
  async getQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.mailQueue.getWaitingCount(),
      this.mailQueue.getActiveCount(),
      this.mailQueue.getCompletedCount(),
      this.mailQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}