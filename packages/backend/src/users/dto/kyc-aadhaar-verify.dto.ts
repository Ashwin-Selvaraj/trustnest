import { IsString, Length } from 'class-validator';

export class KycAadhaarVerifyDto {
  @IsString()
  sessionId!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}
