import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminIpGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const allowedIps = (this.config.get<string>('ADMIN_ALLOWED_IPS') ?? '127.0.0.1')
      .split(',')
      .map((ip) => ip.trim());

    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.socket.remoteAddress ??
      '';

    if (!allowedIps.includes(clientIp)) {
      throw new ForbiddenException('Admin access restricted by IP');
    }
    return true;
  }
}
