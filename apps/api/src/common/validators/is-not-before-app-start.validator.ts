import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

const DEFAULT_APP_START_DATE = '2026-01-01';
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar day (YYYY-MM-DD, UTC) — `@Type(() => Date)` parses "2026-01-01" as UTC midnight. */
const toIsoDay = (date: Date): string => date.toISOString().slice(0, 10);

@ValidatorConstraint({ name: 'IsNotBeforeAppStart', async: false })
@Injectable()
export class IsNotBeforeAppStartConstraint implements ValidatorConstraintInterface {
  private readonly appStartDate: string;

  constructor(configService: ConfigService) {
    const configured = configService.get<string>('APP_START_DATE');
    this.appStartDate =
      configured && ISO_DATE_REGEX.test(configured)
        ? configured
        : DEFAULT_APP_START_DATE;
  }

  validate(
    value: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _args: ValidationArguments,
  ): boolean {
    if (!(value instanceof Date) || isNaN(value.getTime())) return false;
    // Lexicographic comparison of YYYY-MM-DD strings is chronological and
    // independent of the server's time zone.
    return toIsoDay(value) >= this.appStartDate;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(_args: ValidationArguments): string {
    return `Date cannot be earlier than the application start date (${this.appStartDate})`;
  }
}

export function IsNotBeforeAppStart(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotBeforeAppStartConstraint,
    });
  };
}
