import {
  Controller, Get, Patch, Post, Delete, Body, Param, Req,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { KycAadhaarInitDto } from './dto/kyc-aadhaar-init.dto';
import { KycAadhaarVerifyDto } from './dto/kyc-aadhaar-verify.dto';
import { KycPanDto } from './dto/kyc-pan.dto';
import { PaymentDetailsDto } from './dto/payment-details.dto';
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

  // ─── KYC: Legacy ──────────────────────────────────────────────────────────

  @Post('me/kyc')
  @HttpCode(HttpStatus.ACCEPTED)
  initiateKyc(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.initiateKyc(user.sub);
  }

  // ─── KYC: Aadhaar ─────────────────────────────────────────────────────────

  @Post('me/kyc/aadhaar/init')
  @HttpCode(HttpStatus.OK)
  initiateAadhaarKyc(@Req() req: Request, @Body() dto: KycAadhaarInitDto) {
    const user = req.user as JwtPayload;
    return this.usersService.initiateAadhaarKyc(user.sub, dto);
  }

  @Post('me/kyc/aadhaar/verify')
  @HttpCode(HttpStatus.OK)
  verifyAadhaarKyc(@Req() req: Request, @Body() dto: KycAadhaarVerifyDto) {
    const user = req.user as JwtPayload;
    return this.usersService.verifyAadhaarKyc(user.sub, dto);
  }

  // ─── KYC: PAN ─────────────────────────────────────────────────────────────

  @Post('me/kyc/pan')
  @HttpCode(HttpStatus.OK)
  initiatePanKyc(@Req() req: Request, @Body() dto: KycPanDto) {
    const user = req.user as JwtPayload;
    return this.usersService.initiatePanKyc(user.sub, dto);
  }

  // ─── KYC: Selfie ──────────────────────────────────────────────────────────

  @Post('me/kyc/selfie')
  @HttpCode(HttpStatus.OK)
  verifySelfie(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.verifySelfie(user.sub);
  }

  // ─── Payment Details ───────────────────────────────────────────────────────

  @Post('me/payment-details')
  @HttpCode(HttpStatus.OK)
  savePaymentDetails(@Req() req: Request, @Body() dto: PaymentDetailsDto) {
    const user = req.user as JwtPayload;
    return this.usersService.savePaymentDetails(user.sub, dto);
  }

  @Get('me/payment-details')
  getPaymentDetails(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.getPaymentDetails(user.sub);
  }

  @Delete('me/payment-details')
  @HttpCode(HttpStatus.OK)
  deletePaymentDetails(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.deletePaymentDetails(user.sub);
  }

  // ─── Interests ────────────────────────────────────────────────────────────

  @Get('me/interests')
  getMyInterests(@Req() req: Request) {
    const user = req.user as JwtPayload;
    return this.usersService.getMyInterests(user.sub);
  }

  // ─── Public ───────────────────────────────────────────────────────────────

  @Public()
  @Get(':id/reputation')
  getReputation(@Param('id') id: string) {
    return this.usersService.getReputationScore(id);
  }
}
