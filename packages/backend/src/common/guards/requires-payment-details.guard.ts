import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { PaymentDetails } from '../../users/payment-details.entity';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PaymentDetailsStatus } from '@trustnest/shared';

@Injectable()
export class RequiresPaymentDetailsGuard implements CanActivate {
  constructor(
    @InjectRepository(PaymentDetails)
    private readonly paymentDetailsRepo: Repository<PaymentDetails>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwtUser = req.user as JwtPayload;

    const details = await this.paymentDetailsRepo.findOne({
      where: { userId: jwtUser.sub },
    });

    if (!details || details.status !== PaymentDetailsStatus.VERIFIED) {
      throw new ForbiddenException({
        code: 'PAYMENT_DETAILS_REQUIRED',
        message: 'Verified payment details are required to perform this action',
      });
    }

    return true;
  }
}
