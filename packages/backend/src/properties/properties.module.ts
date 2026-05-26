import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { Property } from './property.entity';
import { PropertyImage } from './property-image.entity';
import { PropertyInterest } from '../interests/property-interest.entity';
import { User } from '../users/user.entity';
import { RequiresKycGuard } from '../common/guards/requires-kyc.guard';
import { RequiresOwnerRoleGuard } from '../common/guards/requires-owner-role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property, PropertyImage, PropertyInterest, User]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, RequiresKycGuard, RequiresOwnerRoleGuard],
  exports: [PropertiesService],
})
export class PropertiesModule {}
