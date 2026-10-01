import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
