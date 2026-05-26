import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgreementsModule } from './agreements/agreements.module';
import { PaymentsModule } from './payments/payments.module';
import { ReputationModule } from './reputation/reputation.module';
import { AdminModule } from './admin/admin.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { PropertiesModule } from './properties/properties.module';
import { InterestsModule } from './interests/interests.module';
import { KycModule } from './kyc/kyc.module';
import { User } from './users/user.entity';
import { Wallet } from './blockchain/wallet.entity';
import { Agreement } from './agreements/agreement.entity';
import { PaymentEvent } from './payments/payment-event.entity';
import { BlockchainJob } from './blockchain/blockchain-job.entity';
import { ReputationToken } from './reputation/reputation-token.entity';
import { Property } from './properties/property.entity';
import { PropertyImage } from './properties/property-image.entity';
import { PropertyInterest } from './interests/property-interest.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          User, Wallet, Agreement, PaymentEvent, BlockchainJob, ReputationToken,
          Property, PropertyImage, PropertyInterest,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        migrations: ['dist/migrations/*.js'],
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    BlockchainModule,
    AuthModule,
    UsersModule,
    AgreementsModule,
    PaymentsModule,
    ReputationModule,
    AdminModule,
    PropertiesModule,
    InterestsModule,
    KycModule,
  ],
})
export class AppModule {}
