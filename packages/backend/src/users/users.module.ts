import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { PaymentDetails } from './payment-details.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';
import { PropertyInterest } from '../interests/property-interest.entity';
import { Property } from '../properties/property.entity';
import { PropertyImage } from '../properties/property-image.entity';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, PaymentDetails, Wallet, ReputationToken,
      PropertyInterest, Property, PropertyImage,
    ]),
    KycModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
