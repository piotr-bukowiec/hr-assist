import { Module, forwardRef } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [forwardRef(() => CompaniesService)],
})
export class CompaniesModule {}
