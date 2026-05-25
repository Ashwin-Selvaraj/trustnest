import { IsString, IsNumber, IsPositive, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateAgreementDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  ownerId!: string;

  @IsString()
  propertyAddress!: string;

  @IsNumber()
  @IsPositive()
  monthlyRentINR!: number;

  @IsNumber()
  @IsPositive()
  depositINR!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  pdfIpfsHash?: string;
}
