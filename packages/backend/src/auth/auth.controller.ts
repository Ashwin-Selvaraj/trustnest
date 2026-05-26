import {
  Controller, Post, Body, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  completeProfile(@Req() req: Request, @Body() dto: CompleteProfileDto) {
    const user = req.user as JwtPayload;
    return this.authService.completeProfile(user.sub, dto);
  }
}
