import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BlockchainService } from './blockchain.service';

@Injectable()
export class BlockchainJobWorker {
  private readonly logger = new Logger(BlockchainJobWorker.name);
  private isRunning = false;

  constructor(private readonly blockchainService: BlockchainService) {}

  @Cron('*/30 * * * * *')
  async handleCron(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const jobs = await this.blockchainService.getPendingJobs();
      if (jobs.length === 0) return;
      this.logger.log(`Processing ${jobs.length} blockchain job(s)`);
      await Promise.allSettled(jobs.map((job) => this.blockchainService.processJob(job)));
    } finally {
      this.isRunning = false;
    }
  }
}
