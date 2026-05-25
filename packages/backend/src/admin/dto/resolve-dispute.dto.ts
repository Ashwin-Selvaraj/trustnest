import { IsNumber, Min } from 'class-validator';

export class ResolveDisputeDto {
  @IsNumber()
  @Min(0)
  tenantShareINR!: number;

  @IsNumber()
  @Min(0)
  ownerShareINR!: number;
}
