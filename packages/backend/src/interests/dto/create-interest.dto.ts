import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateInterestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
