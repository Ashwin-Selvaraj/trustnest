import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\+91[0-9]{10}$/, { message: 'phone must be a valid Indian mobile number (+91XXXXXXXXXX)' })
  phone!: string;
}
