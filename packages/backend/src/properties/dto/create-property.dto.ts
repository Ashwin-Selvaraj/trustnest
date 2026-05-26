import {
  IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString,
  MaxLength, Min, IsInt, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BhkType, FurnishingStatus, TenantPreference } from '@trustnest/shared';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(300)
  address!: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsString()
  @MaxLength(100)
  locality!: string;

  @IsEnum(BhkType)
  bhkType!: BhkType;

  @IsEnum(FurnishingStatus)
  furnishingStatus!: FurnishingStatus;

  @IsNumber()
  @Min(0)
  monthlyRentINR!: number;

  @IsNumber()
  @Min(0)
  depositINR!: number;

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

  @IsArray()
  @IsString({ each: true })
  amenities!: string[];

  @IsArray()
  @IsEnum(TenantPreference, { each: true })
  preferredTenants!: TenantPreference[];

  @IsDateString()
  availableFrom!: string;
}
