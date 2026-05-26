import {
  Controller, Get, Post, Body, Param, Query, Req,
  DefaultValuePipe, ParseIntPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AgreementsService } from './agreements.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { DisputeDto } from './dto/dispute.dto';
import { RateDto } from './dto/rate.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AgreementStatus } from '@trustnest/shared';
import { RequiresKycGuard } from '../common/guards/requires-kyc.guard';

@Controller('agreements')
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RequiresKycGuard)
  create(@Body() dto: CreateAgreementDto) {
    return this.agreementsService.create(dto);
  }

  @Get()
  list(
    @Req() req: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: AgreementStatus,
  ) {
    const user = req.user as JwtPayload;
    return this.agreementsService.list(user.sub, page, Math.min(limit, 100), status);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    return this.agreementsService.findById(id, user.sub);
  }

  @Post(':id/confirm')
  @UseGuards(RequiresKycGuard)
  confirm(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as JwtPayload;
    return this.agreementsService.confirm(id, user.sub);
  }

  @Post(':id/dispute')
  dispute(@Req() req: Request, @Param('id') id: string, @Body() dto: DisputeDto) {
    const user = req.user as JwtPayload;
    return this.agreementsService.raiseDispute(id, user.sub, dto);
  }

  @Post(':id/rate')
  rate(@Req() req: Request, @Param('id') id: string, @Body() dto: RateDto) {
    const user = req.user as JwtPayload;
    return this.agreementsService.rate(id, user.sub, dto);
  }
}
