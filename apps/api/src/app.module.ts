import {
  ClassSerializerInterceptor,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { HashModule } from './common/hash/hash.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { GlobalExceptionFilter } from './common/filters/global-exception/global-exception.filter';
import { ResponseWrapperInterceptor } from './common/interceptors/response-wrapper/response-wrapper.interceptor';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { ScheduleModule } from '@nestjs/schedule';
import { typeOrmConfig } from './config/typeorm.config';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HashModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    EmployeesModule,
    CompaniesModule,
    HolidaysModule,
    AttendanceModule,
    LeavesModule,
    ReportsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseWrapperInterceptor,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: {
            enableImplicitConversion: true,
          },
        }),
    },
    {
      inject: [Reflector],
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) =>
        new ClassSerializerInterceptor(reflector, {
          enableCircularCheck: true,
        }),
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
