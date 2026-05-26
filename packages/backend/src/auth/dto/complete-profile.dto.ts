import { IsString, IsEnum, Length, Matches } from 'class-validator';
import { UserRole } from '@trustnest/shared';

export class CompleteProfileDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** ISO date string (YYYY-MM-DD) */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dob must be in YYYY-MM-DD format' })
  dob!: string;
}
