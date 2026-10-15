import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyEntity } from './entities/company.entity';
import { ILike, Not } from 'typeorm';

@Injectable()
export class CompaniesService {
  async create({ nip, name, ...rest }: CreateCompanyDto) {
    const isNipTaken: boolean = await CompanyEntity.existsBy({ nip });
    if (isNipTaken) throw new ConflictException('NIP already taken');

    const isNameTaken: boolean = await CompanyEntity.existsBy({
      name: ILike(name),
    });
    if (isNameTaken) throw new ConflictException('Name already taken');

    const company = CompanyEntity.create({ nip, name, ...rest });
    return await company.save();
  }

  async findAll(): Promise<CompanyEntity[]> {
    const companies = await CompanyEntity.find();
    return companies;
  }

  async findOne(id: string): Promise<CompanyEntity> {
    const company = await CompanyEntity.findOneBy({ id });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(
    id: string,
    { name, address, ...rest }: UpdateCompanyDto,
  ): Promise<CompanyEntity> {
    const company = await this.findOne(id);

    if (name && name !== company.name) {
      const isNameTaken: boolean = await CompanyEntity.existsBy({
        name: ILike(name),
        id: Not(id),
      });
      if (isNameTaken) throw new ConflictException('Name already taken');

      company.name = name;
    }

    if (address) {
      Object.assign(company.address, address);
    }

    Object.assign(company, rest);
    return await company.save();
  }

  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);
    if (!company) throw new NotFoundException('Company not found');
    await company.remove();
  }

  async exists(id: string): Promise<boolean> {
    return await CompanyEntity.existsBy({ id });
  }
}
