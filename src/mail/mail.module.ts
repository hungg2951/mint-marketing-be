import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  controllers: [MailController],
  providers: [MailService, MailQueueService, MailProcessor],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
