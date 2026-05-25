import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class RateDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsOptional()
  @IsString()
  review?: string;
}
