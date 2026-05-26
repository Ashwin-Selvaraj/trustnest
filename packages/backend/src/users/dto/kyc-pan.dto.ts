import { IsString, Matches } from 'class-validator';

export class KycPanDto {
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, { message: 'Invalid PAN format' })
  panNumber!: string;
}
