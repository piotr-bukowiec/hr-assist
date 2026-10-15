import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CompanyEntity } from './entities/company.entity';

@Auth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}
  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyEntity> {
    return this.companiesService.create(createCompanyDto);
  }

  @Get('/')
  findAll(): Promise<CompanyEntity[]> {
    return this.companiesService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyEntity> {
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyEntity> {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete('/:id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.companiesService.remove(id);
  }
}
