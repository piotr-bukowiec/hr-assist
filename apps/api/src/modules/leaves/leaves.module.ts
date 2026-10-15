import { Module, forwardRef } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [forwardRef(() => EmployeesModule)],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
