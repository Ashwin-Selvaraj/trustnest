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

@Injectable()
export class RequiresProfileCompleteGuard implements CanActivate {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const jwtUser = req.user as JwtPayload;

    const user = await this.userRepo.findOne({ where: { id: jwtUser.sub } });

    if (!user || !user.name || !user.role || !user.dob) {
      throw new ForbiddenException({
        code: 'PROFILE_INCOMPLETE',
        message: 'Please complete your profile before proceeding',
      });
    }

    return true;
  }
}
