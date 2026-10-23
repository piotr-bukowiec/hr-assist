import {
  Injectable,
  OnApplicationBootstrap,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { existsSync, readFileSync, renameSync, unlinkSync } from 'node:fs';
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

  private isSeedFileExists(): boolean {
    return existsSync(this.seedFilePath);
  }

  private getParsedSeedData(): SeedData {
    if (!existsSync(this.seedFilePath)) {
      throw new Error(`Seed file not found at path: ${this.seedFilePath}`);
    }

    return JSON.parse(readFileSync(this.seedFilePath, 'utf-8')) as SeedData;
  }

  private async isDatabaseEmpty(): Promise<boolean> {
    return (
      (await UserEntity.count()) === 0 && (await CompanyEntity.count()) === 0
    );
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
    const seedData: SeedData = this.getParsedSeedData();

    this.logger.log('Starting seed data validation...');
    await this.validateSeedData(seedData);
    this.logger.log('Seed data validation completed successfully!');

    const { companies, users } = seedData;

    for (const user of users) {
      await this.usersService.create(user);
    }

    for (const company of companies) {
      await this.companiesService.create(company);
    }

    try {
      const oldSeedFileName: string = `${this.seedFilePath}.old`;

      if (existsSync(oldSeedFileName)) {
        unlinkSync(oldSeedFileName);
      }

      renameSync(this.seedFilePath, oldSeedFileName);

      this.logger.log(
        'Seed file seed.json has been successfully renamed to seed.json.old',
      );
    } catch (error) {
      this.logger.error('Error archiving seed data file:', error);
      throw new Error('Error archiving seed data file');
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    const isSeedFileExists: boolean = this.isSeedFileExists();
    const isDatabaseEmpty: boolean = await this.isDatabaseEmpty();

    if (isDatabaseEmpty) {
      if (!isSeedFileExists) {
        this.logger.error(
          'No seed.json file provided and database is empty. Aborting application startup.',
        );
        throw new Error(
          'No seed.json file provided and database is empty. Aborting application startup.',
        );
      } else {
        this.logger.log('Database is empty. Seeding database...');
        await this.seed();
        this.logger.log('Seeding completed successfully!');
      }
    } else {
      if (isSeedFileExists) {
        this.logger.warn(
          'Database is not empty and seed.json is present. Skipping seed to protect existing data.',
        );
      }
    }
  }
}
