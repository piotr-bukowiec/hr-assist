import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dataSourceConfig } from 'src/db/data-source';

export const typeOrmConfig: TypeOrmModuleOptions = dataSourceConfig;
