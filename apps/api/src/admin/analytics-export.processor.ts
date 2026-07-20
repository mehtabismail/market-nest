import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AnalyticsService } from './analytics.service';
import { QUEUE_EXPORT } from '../notifications/notifications.constants';

@Processor(QUEUE_EXPORT)
export class AnalyticsExportProcessor extends WorkerHost {
  constructor(private readonly analytics: AnalyticsService) {
    super();
  }

  async process(job: Job<{ days?: number }>) {
    const days = Number(job.data.days ?? 30);
    const csv = await this.analytics.exportCsv(days);
    return {
      csv,
      filename: `marketnest-analytics-${Date.now()}.csv`,
    };
  }
}
