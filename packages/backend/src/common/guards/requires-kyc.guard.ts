import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../../users/user.entity';
import { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { KycStatus } from '@trustnest/shared';

@Injectable()
export class RequiresKycGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwtUser = req.user as JwtPayload;

    const user = await this.userRepo.findOne({ where: { id: jwtUser.sub } });

    if (!user || user.kycStatus !== KycStatus.VERIFIED) {
      throw new ForbiddenException({
        code: 'KYC_REQUIRED',
        kycStatus: user?.kycStatus ?? KycStatus.PENDING,
        message: 'KYC verification is required to perform this action',
      });
    }

    return true;
  }
}
