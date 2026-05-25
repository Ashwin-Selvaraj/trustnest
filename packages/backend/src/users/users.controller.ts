import {
  Controller, Get, Patch, Post, Body, Param, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.getMe(user.sub);
  }

  @Patch('me')
  updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    const user = req.user as JwtPayload;
    return this.usersService.updateMe(user.sub, dto);
  }

  @Post('me/kyc')
  @HttpCode(HttpStatus.ACCEPTED)
  initiateKyc(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.initiateKyc(user.sub);
  }

  @Public()
  @Get(':id/reputation')
  getReputation(@Param('id') id: string) {
    return this.usersService.getReputationScore(id);
  }
}
