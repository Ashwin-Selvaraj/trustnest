import { Controller, Get, Patch, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const user = req.user as JwtPayload;
    return this.notificationsService.findForUser(
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Patch(':id/read')
  markRead(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    return this.notificationsService.markRead(id, user.sub);
  }

  @Patch('read-all')
  markAllRead(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.notificationsService.markAllRead(user.sub);
  }
}
