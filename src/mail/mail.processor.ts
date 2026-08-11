import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailJobData } from './mail-queue.service';

@Processor('mail-queue', {
  concurrency: 5, // xử lý tối đa 5 mail cùng lúc, tránh vượt rate limit Resend (2-10 req/s tuỳ plan)
  limiter: {
    max: 8,        // tối đa 8 job
    duration: 1000, // trong mỗi 1000ms (1 giây)
  },
})
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<MailJobData>): Promise<any> {
    const { templateId, to, subject, variables } = job.data;

    this.logger.log(`Processing job ${job.id} - sending to ${to}`);

    try {
      const result = await this.mailService.sendTemplateEmail({
        templateId,
        to,
        subject,
        variables,
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed for ${to}: ${error.message}`);
      throw error; // throw lại để BullMQ tự retry theo opts.attempts đã cấu hình
    }
  }
}