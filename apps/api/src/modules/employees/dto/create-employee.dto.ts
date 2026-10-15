import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ContractType, ICreateEmployeeDto, Location } from '../employee.types';
import { WorkScheduleDto } from './work-schedule.dto';
import { IsPesel } from 'src/common/validators/is-pesel.validator';
import { IsCompanyId } from 'src/common/validators/is-company-id.validator';
import { IsNotBeforeAppStart } from 'src/common/validators/is-not-before-app-start.validator';

export class CreateEmployeeDto implements ICreateEmployeeDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @Length(1, 255)
  surname: string;

  @IsString()
  @Length(11, 11)
  @IsPesel()
  pesel: string;

  @IsString()
  @Length(1, 255)
  position: string;

  @IsEnum(Location)
  location: Location;

  @IsString()
  @IsUUID(4)
  @IsCompanyId()
  company: string;

  @IsInt()
  @Min(1)
  @Max(8)
  workHours: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WorkScheduleDto)
  workSchedule: WorkScheduleDto;

  @Type(() => Date)
  @IsDate()
  @IsNotBeforeAppStart()
  employmentDate: Date;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsInt()
  @IsIn([20, 26])
  leave: number;
}
