import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsDateOnly } from '../../common/validators.js';

/** POST /planning-runs: the period (normally a semester); the label defaults to «Herbstsemester 2026». */
export class CreatePlanningRunDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsDateOnly()
  periodStartsOn: string;

  @IsDateOnly()
  periodEndsOn: string;
}

/** POST /planning-runs/:id/courses/:courseId/fix: the index of the option from GET …/fix-options. */
export class ApplyFixDto {
  @IsInt()
  @Min(0)
  option: number;
}
