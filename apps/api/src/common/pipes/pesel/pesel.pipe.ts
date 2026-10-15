import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { isPeselValid } from 'src/common/utils/is-pesel-valid.util';

@Injectable()
export class PeselValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !isPeselValid(value)) {
      throw new BadRequestException('Invalid PESEL format');
    }
    return value;
  }
}
