import {
  IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString,
  MaxLength, Min, IsInt,
} from 'class-validator';
import { BhkType, FurnishingStatus, TenantPreference } from '@trustnest/shared';

export class UpdatePropertyDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  locality?: string;

  @IsOptional()
  @IsEnum(BhkType)
  bhkType?: BhkType;

  @IsOptional()
  @IsEnum(FurnishingStatus)
  furnishingStatus?: FurnishingStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRentINR?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositINR?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  areaSqft?: number;

  @IsOptional()
  @IsInt()
  floorNumber?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalFloors?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(TenantPreference, { each: true })
  preferredTenants?: TenantPreference[];

  @IsOptional()
  @IsDateString()
  availableFrom?: string;
}
