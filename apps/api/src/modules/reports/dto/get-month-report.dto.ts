import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IGetMonthReportParamsDto } from '../engine/reports.types';
import { IsEmployeeExists } from 'src/common/validators/is-employee-exists.validator';

export class GetMonthReportParamsDto implements IGetMonthReportParamsDto {
  @IsUUID('4', { message: 'Niepoprawne ID pracownika' })
  @IsEmployeeExists({ message: 'Pracownik o podanym ID nie istnieje' })
  employeeId: string;

  @Type(() => Number)
  @IsInt({ message: 'Rok musi być liczbą całkowitą' })
  @Min(2020, { message: 'Minimalny rok to 2020' })
  @Max(2100, { message: 'Maksymalny rok to 2100' })
  year: number;

  @Type(() => Number)
  @IsInt({ message: 'Miesiąc musi być liczbą całkowitą' })
  @Min(1, { message: 'Miesiąc musi być w zakresie 1-12' })
  @Max(12, { message: 'Miesiąc musi być w zakresie 1-12' })
  month: number;
}
