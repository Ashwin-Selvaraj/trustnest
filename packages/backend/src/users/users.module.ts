import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Wallet } from '../blockchain/wallet.entity';
import { ReputationToken } from '../reputation/reputation-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet, ReputationToken])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
