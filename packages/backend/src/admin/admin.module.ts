import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Agreement } from '../agreements/agreement.entity';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agreement]), BlockchainModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
