import {
  Controller, Post, Get, Body, Param, Req, Headers,
  HttpCode, HttpStatus, RawBodyRequest, UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ReleaseDto } from './dto/release.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Public } from '../common/decorators/public.decorator';
import { RequiresPaymentDetailsGuard } from '../common/guards/requires-payment-details.guard';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payments/initiate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RequiresPaymentDetailsGuard)
  initiatePayment(@Req() req: Request, @Body() dto: InitiatePaymentDto) {
    const user = req.user as JwtPayload;
    return this.paymentsService.initiatePayment(dto.agreementId, user.sub);
  }

  @Public()
  @Post('payments/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Headers('x-razorpay-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const rawBody = (req.rawBody ?? Buffer.from(JSON.stringify(req.body))).toString('utf8');
    return this.paymentsService.handleWebhook(signature ?? '', rawBody);
  }

  @Get('payments/:agreementId')
  getHistory(@Req() req: Request, @Param('agreementId') agreementId: string) {
    const user = req.user as JwtPayload;
    return this.paymentsService.getPaymentHistory(agreementId, user.sub);
  }

  @Post('agreements/:id/release')
  @HttpCode(HttpStatus.ACCEPTED)
  releaseEscrow(
    @Req() req: Request,
    @Param('id') agreementId: string,
    @Body() dto: ReleaseDto,
  ) {
    const user = req.user as JwtPayload;
    return this.paymentsService.releaseEscrow(agreementId, user.sub, dto.deductionINR);
  }
}
