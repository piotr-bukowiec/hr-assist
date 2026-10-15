import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { argon2id, hash, verify } from 'argon2';

@Injectable()
export class HashService {
  constructor(private readonly configService: ConfigService) {}

  private get pepper(): Buffer {
    const secret = this.configService.getOrThrow<string>('HASH_PEPPER');
    return Buffer.from(secret);
  }

  async hashText(text: string): Promise<string> {
    return hash(text, {
      type: argon2id,
      secret: this.pepper,
    });
  }

  async compare(text: string, hashedText: string): Promise<boolean> {
    try {
      return await verify(hashedText, text, {
        secret: this.pepper,
      });
    } catch {
      return false;
    }
  }
}
