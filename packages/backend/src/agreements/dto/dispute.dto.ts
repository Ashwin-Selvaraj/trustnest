import { IsString, IsOptional } from 'class-validator';

export class DisputeDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  evidenceIpfsHash?: string;
}
