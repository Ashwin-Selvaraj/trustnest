import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterestsController } from './interests.controller';
import { InterestsService } from './interests.service';
import { PropertyInterest } from './property-interest.entity';
import { Property } from '../properties/property.entity';
import { PropertyImage } from '../properties/property-image.entity';
import { Agreement } from '../agreements/agreement.entity';
import { User } from '../users/user.entity';
import { RequiresKycGuard } from '../common/guards/requires-kyc.guard';
import { RequiresTenantRoleGuard } from '../common/guards/requires-tenant-role.guard';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyInterest, Property, PropertyImage, Agreement, User]),
    PropertiesModule,
  ],
  controllers: [InterestsController],
  providers: [InterestsService, RequiresKycGuard, RequiresTenantRoleGuard],
  exports: [InterestsService],
})
export class InterestsModule {}
