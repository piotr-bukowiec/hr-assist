import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { EmployeesService } from 'src/modules/employees/employees.service';

@ValidatorConstraint({ name: 'IsEmployeeExists', async: true })
@Injectable()
export class IsEmployeeExistsConstraint implements ValidatorConstraintInterface {
  constructor(private readonly employeesService: EmployeesService) {}

  async validate(
    employeeId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _args: ValidationArguments,
  ): Promise<boolean> {
    if (!employeeId) return false;
    return await this.employeesService.exists(employeeId);
  }

  defaultMessage(args: ValidationArguments): string {
    return `Pracownik o podanym ID (${args.value}) nie istnieje w systemie.`;
  }
}

export function IsEmployeeExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmployeeExistsConstraint,
    });
  };
}
