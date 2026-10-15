import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeEntity } from './entities/employee.entity';
import { EmployeesService } from './employees.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PeselValidationPipe } from 'src/common/pipes/pesel/pesel.pipe';
import { EmployeeResponseDto } from './dto/employees-list.dto';

@Auth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('/')
  findAll(): Promise<EmployeeResponseDto[]> {
    return this.employeesService.findAll();
  }

  @Get('/positions')
  findAllPositions(): Promise<string[]> {
    return this.employeesService.findAllPositions();
  }

  @Get('/pesel/check-availability')
  checkPeselAvailability(
    @Query('pesel', PeselValidationPipe) pesel: string,
  ): Promise<boolean> {
    return this.employeesService.checkPeselAvailability(pesel);
  }

  @Get('/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.findOne(id);
  }

  @Post('/')
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeEntity> {
    return this.employeesService.create(dto);
  }

  @Put('/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeEntity> {
    return this.employeesService.update(id, dto);
  }

  @Delete('/')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAll(): Promise<void> {
    return this.employeesService.removeAll();
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeEntity> {
    return this.employeesService.remove(id);
  }

  @Post('/:id/fire')
  fire(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeEntity> {
    return this.employeesService.fire(id);
  }

  @Post('/:id/recover')
  recover(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeEntity> {
    return this.employeesService.recover(id);
  }
}
