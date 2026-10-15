import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { addYears, isAfter } from 'date-fns';

@ValidatorConstraint({ name: 'isNotTooFarDate', async: false })
export class IsNotTooFarDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date, args: ValidationArguments): boolean {
    const maxYears: number = (args.constraints[0] as number) || 5;

    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }

    const maxAllowedDate = addYears(new Date(), maxYears);
    return !isAfter(value, maxAllowedDate);
  }

  defaultMessage(args: ValidationArguments): string {
    const maxYears: number = (args.constraints[0] as number) || 5;
    return `The date in ${args.property} cannot be further than ${maxYears} years into the future.`;
  }
}

export function IsNotTooFarDate(
  maxYears: number = 5,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxYears],
      validator: IsNotTooFarDateConstraint,
    });
  };
}
