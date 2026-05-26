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
import { UserRole } from '@trustnest/shared';

@Injectable()
export class RequiresTenantRoleGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req     = context.switchToHttp().getRequest<Request>();
    const jwtUser = req.user as JwtPayload;

    const user = await this.userRepo.findOne({ where: { id: jwtUser.sub } });

    if (!user || (user.role !== UserRole.TENANT && user.role !== UserRole.BOTH)) {
      throw new ForbiddenException({ code: 'TENANT_ROLE_REQUIRED' });
    }

    return true;
  }
}
