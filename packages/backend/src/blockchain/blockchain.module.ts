import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './blockchain.service';
import { BlockchainJobWorker } from './blockchain-job.worker';
import { BlockchainJob } from './blockchain-job.entity';
import { Wallet } from './wallet.entity';
import { Agreement } from '../agreements/agreement.entity';
import { PaymentEvent } from '../payments/payment-event.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlockchainJob, Wallet, Agreement, PaymentEvent, ReputationToken]),
  ],
  providers: [BlockchainService, BlockchainJobWorker],
  exports: [BlockchainService],
})
export class BlockchainModule {}
