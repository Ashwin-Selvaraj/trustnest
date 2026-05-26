import { IsString, Matches } from 'class-validator';

export class KycAadhaarInitDto {
  @IsString()
  @Matches(/^\d{12}$/, { message: 'Aadhaar number must be exactly 12 digits' })
  aadhaarNumber!: string;
}
