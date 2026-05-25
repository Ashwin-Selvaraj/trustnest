import { IsString, IsUUID, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}
