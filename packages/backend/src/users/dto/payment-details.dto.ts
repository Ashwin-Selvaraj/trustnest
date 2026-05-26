import { IsString, IsOptional, Matches, Length } from 'class-validator';

export class PaymentDetailsDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, { message: 'Invalid UPI ID format' })
  upiId?: string;

  @IsOptional()
  @IsString()
  @Length(9, 18)
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  bankIfsc?: string;
}
