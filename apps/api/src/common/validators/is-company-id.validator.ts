import { Injectable } from '@nestjs/common';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { CompaniesService } from 'src/modules/companies/companies.service';

@ValidatorConstraint({ name: 'IsCompanyId', async: true })
@Injectable()
export class IsCompanyIdConstraint implements ValidatorConstraintInterface {
  constructor(private readonly companiesService: CompaniesService) {}

  async validate(
    companyId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _args: ValidationArguments,
  ): Promise<boolean> {
    if (!companyId) return false;
    return await this.companiesService.exists(companyId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments): string {
    return 'Company with the given ID does not exist';
  }
}

export function IsCompanyId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCompanyIdConstraint,
    });
  };
}
