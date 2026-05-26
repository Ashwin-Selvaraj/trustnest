import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentEvent } from './payment-event.entity';
import { Agreement } from '../agreements/agreement.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { PaymentDetails } from '../users/payment-details.entity';
import { RequiresPaymentDetailsGuard } from '../common/guards/requires-payment-details.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEvent, Agreement, Wallet, PaymentDetails]),
    BlockchainModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, RequiresPaymentDetailsGuard],
})
export class PaymentsModule {}
