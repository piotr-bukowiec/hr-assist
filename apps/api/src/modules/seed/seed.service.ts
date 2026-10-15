import {
  Injectable,
  OnApplicationBootstrap,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'path';
import { cwd } from 'process';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateCompanyDto } from '../companies/dto/create-company.dto';
import { UserEntity } from '../users/user.entity';
import { CompanyEntity } from '../companies/entities/company.entity';
import { CompaniesService } from '../companies/companies.service';
import { UsersService } from '../users/users.service';

interface SeedData {
  users: CreateUserDto[];
  companies: CreateCompanyDto[];
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
  ) {}

  private readonly logger = new Logger(SeedService.name);

  private readonly seedFilePath: string = resolve(
    join(cwd(), '../../seed/seed.json'),
  );

  private getParsedSeedData(): SeedData {
    if (!existsSync(this.seedFilePath)) {
      throw new Error(`Seed file not found at path: ${this.seedFilePath}`);
    }

    return JSON.parse(readFileSync(this.seedFilePath, 'utf-8')) as SeedData;
  }

  private async checkDatabaseIsEmpty(): Promise<void> {
    const usersExists: boolean = (await UserEntity.count()) !== 0;
    const companiesExists: boolean = (await CompanyEntity.count()) !== 0;

    if (usersExists || companiesExists) {
      this.logger.error(
        'Baza danych zawiera już dane (użytkownicy lub firmy)! Przerywam seedowanie.',
      );
      throw new Error('Database is not empty. Seeding aborted.');
    }
  }

  private async validateSeedData({
    users,
    companies,
  }: SeedData): Promise<void> {
    if (!users || !Array.isArray(users)) {
      throw new Error('Users must be an array');
    }
    if (!companies || !Array.isArray(companies)) {
      throw new Error('Companies must be an array');
    }

    for (const [index, rawUserData] of users.entries()) {
      const userDto = plainToInstance(CreateUserDto, rawUserData);
      const errors = await validate(userDto);

      if (errors.length > 0) {
        this.logger.error(
          `Błąd walidacji użytkownika na indeksie ${index}`,
          errors,
        );
        throw new BadRequestException(
          `Seed validation failed for user at index ${index}`,
        );
      }
    }

    for (const [index, rawCompanyData] of companies.entries()) {
      const companyDto = plainToInstance(CreateCompanyDto, rawCompanyData);
      const errors = await validate(companyDto);

      if (errors.length > 0) {
        this.logger.error(`Błąd walidacji firmy na indeksie ${index}`, errors);
        throw new BadRequestException(
          `Seed validation failed for company at index ${index}`,
        );
      }
    }
  }

  private async seed(): Promise<void> {
    await this.checkDatabaseIsEmpty();
    const seedData: SeedData = this.getParsedSeedData();

    this.logger.log('Rozpoczęcie walidacji danych seed...');
    await this.validateSeedData(seedData);
    this.logger.log('Walidacja zakończona sukcesem.');

    this.logger.log('Zapis danych początkowych do bazy...');

    const { companies, users } = seedData;

    await Promise.all(
      users.map(async (user) => await this.usersService.create(user)),
    );

    await Promise.all(
      companies.map(
        async (company) => await this.companiesService.create(company),
      ),
    );

    this.logger.log('Seedowanie zakończone pomyślnie!');
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }
}
