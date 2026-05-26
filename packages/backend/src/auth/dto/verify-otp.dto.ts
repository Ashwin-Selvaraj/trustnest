import { IsString, IsUUID, Length, IsOptional, IsEnum, Matches } from 'class-validator';
import { UserRole } from '@trustnest/shared';

export class VerifyOtpDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /** ISO date string (YYYY-MM-DD) */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dob must be in YYYY-MM-DD format' })
  dob?: string;
}
