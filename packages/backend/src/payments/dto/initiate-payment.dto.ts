import { IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  agreementId!: string;
}
