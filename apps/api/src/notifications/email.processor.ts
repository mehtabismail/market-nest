import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NotificationsService, EmailJobType } from './notifications.service';
import { QUEUE_EMAIL } from './notifications.constants';

@Processor(QUEUE_EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<{ orderId?: string; sellerId?: string }>) {
    await this.notifications.processEmailJob(
      job.name as EmailJobType,
      job.data as Record<string, string>,
    );
  }
}
