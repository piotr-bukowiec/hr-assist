import { Module, forwardRef } from '@nestjs/common';
import { SeedService } from './seed.service';
import { UsersModule } from '../users/users.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => CompaniesModule)],
  providers: [SeedService],
})
export class SeedModule {}
