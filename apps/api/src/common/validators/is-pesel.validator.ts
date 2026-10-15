import { ValidationOptions, registerDecorator } from 'class-validator';
import { isPeselValid } from 'src/common/utils/is-pesel-valid.util';

export function IsPesel(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPesel',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'Invalid PESEL',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return typeof value === 'string' && isPeselValid(value);
        },
      },
    });
  };
}
