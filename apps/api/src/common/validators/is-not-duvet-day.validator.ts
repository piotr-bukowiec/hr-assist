import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { HolidaysService } from 'src/modules/holidays/holidays.service';

@ValidatorConstraint({ name: 'isNotDuvetDay', async: true })
@Injectable()
export class IsNotDuvetDayConstraint implements ValidatorConstraintInterface {
  constructor(private readonly holidaysService: HolidaysService) {}

  async validate(value: Date): Promise<boolean> {
    if (!(value instanceof Date)) return false;
    return !(await this.holidaysService.isDuvetDay(value));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments): string {
    return 'Nie można dodać nieobecności w dzień wolny (weekend lub święto)';
  }
}

export function IsNotDuvetDay(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotDuvetDayConstraint,
    });
  };
}
