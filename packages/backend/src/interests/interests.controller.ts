import {
  Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { RequiresKycGuard } from '../common/guards/requires-kyc.guard';
import { RequiresTenantRoleGuard } from '../common/guards/requires-tenant-role.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('properties/:id')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @UseGuards(RequiresKycGuard, RequiresTenantRoleGuard)
  @Post('interest')
  expressInterest(
    @Req() req: Request,
    @Param('id') propertyId: string,
    @Body() dto: CreateInterestDto,
  ) {
    const user = req.user as JwtPayload;
    return this.interestsService.create(propertyId, user.sub, dto);
  }

  @Get('interests')
  getInterests(@Req() req: Request, @Param('id') propertyId: string) {
    const user = req.user as JwtPayload;
    return this.interestsService.findByProperty(propertyId, user.sub);
  }

  @Patch('interests/:interestId/accept')
  acceptInterest(
    @Req() req: Request,
    @Param('id') propertyId: string,
    @Param('interestId') interestId: string,
  ) {
    const user = req.user as JwtPayload;
    return this.interestsService.accept(propertyId, interestId, user.sub);
  }

  @Patch('interests/:interestId/decline')
  declineInterest(
    @Req() req: Request,
    @Param('id') propertyId: string,
    @Param('interestId') interestId: string,
  ) {
    const user = req.user as JwtPayload;
    return this.interestsService.decline(propertyId, interestId, user.sub);
  }

  @Delete('interests/:interestId')
  withdrawInterest(
    @Req() req: Request,
    @Param('id') propertyId: string,
    @Param('interestId') interestId: string,
  ) {
    const user = req.user as JwtPayload;
    return this.interestsService.withdraw(propertyId, interestId, user.sub);
  }
}
