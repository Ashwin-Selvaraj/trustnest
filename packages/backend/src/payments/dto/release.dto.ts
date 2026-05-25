import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class ReleaseDto {
  @IsNumber()
  @Min(0)
  deductionINR!: number;

  @IsOptional()
  @IsString()
  deductionReason?: string;
}
