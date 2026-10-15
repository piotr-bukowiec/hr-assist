import { AbsenceEntity } from 'src/modules/attendance/entities/absence.entity';
import { AddressEntity } from 'src/modules/companies/entities/address.entity';
import { CompanyEntity } from 'src/modules/companies/entities/company.entity';
import { EmployeeEntity } from 'src/modules/employees/entities/employee.entity';
import { HolidayEntity } from 'src/modules/holidays/entities/holiday.entity';
import { UserEntity } from 'src/modules/users/user.entity';
import { DataSourceOptions, DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
dotenv.config();

export const dataSourceConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    CompanyEntity,
    AddressEntity,
    EmployeeEntity,
    AbsenceEntity,
    HolidayEntity,
  ],
  logging: process.env.NODE_ENV !== 'production',
  synchronize: process.env.NODE_ENV === 'development',
};

export const dataSource = new DataSource(dataSourceConfig);
export default dataSource;
