import { ConfigService } from '@nestjs/config';
import { HashService } from './hash.service';

describe('HashService', () => {
  let hashService: HashService;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockPepper = 'super_secret_pepper_value_12345!';
  const plainText = 'SecurePassword123!';

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue(mockPepper),
    };

    hashService = new HashService(configService as ConfigService);
  });

  it('should be defined', () => {
    expect(hashService).toBeDefined();
  });

  describe('hashText', () => {
    describe('when hashing a plain text password', () => {
      let hash: string;

      beforeEach(async () => {
        hash = await hashService.hashText(plainText);
      });

      it('should return a defined value', () => {
        expect(hash).toBeDefined();
      });

      it('should return a string', () => {
        expect(typeof hash).toBe('string');
      });

      it('should not return an empty string', () => {
        expect(hash.length).toBeGreaterThan(0);
      });

      it('should not equal the original plain text', () => {
        expect(hash).not.toEqual(plainText);
      });

      it('should use the argon2id algorithm', () => {
        expect(hash).toContain('$argon2id$');
      });
    });

    describe('when hashing the same plain text twice', () => {
      let hash1: string;
      let hash2: string;

      beforeEach(async () => {
        hash1 = await hashService.hashText(plainText);
        hash2 = await hashService.hashText(plainText);
      });

      it('should produce two defined hashes', () => {
        expect(hash1).toBeDefined();
      });

      it('should produce a second defined hash', () => {
        expect(hash2).toBeDefined();
      });

      it('should generate distinct hashes due to random salting', () => {
        expect(hash1).not.toEqual(hash2);
      });
    });
  });

  describe('compare', () => {
    describe('when the plain text matches the hash', () => {
      let isValid: boolean;

      beforeEach(async () => {
        const hash = await hashService.hashText(plainText);
        isValid = await hashService.compare(plainText, hash);
      });

      it('should return true', () => {
        expect(isValid).toBe(true);
      });
    });

    describe('when the plain text does not match the hash', () => {
      let isValid: boolean;

      beforeEach(async () => {
        const hash = await hashService.hashText(plainText);
        isValid = await hashService.compare('WrongPassword123!', hash);
      });

      it('should return false', () => {
        expect(isValid).toBe(false);
      });
    });

    describe('when the pepper secret changes', () => {
      let isValid: boolean;

      beforeEach(async () => {
        const hash = await hashService.hashText(plainText);

        (configService.getOrThrow as jest.Mock).mockReturnValue(
          'different_pepper_value',
        );

        isValid = await hashService.compare(plainText, hash);
      });

      it('should return false', () => {
        expect(isValid).toBe(false);
      });
    });

    describe('when the hash is malformed or corrupted', () => {
      let isValid: boolean;

      beforeEach(async () => {
        isValid = await hashService.compare(plainText, 'invalid_hash_string');
      });

      it('should return false', () => {
        expect(isValid).toBe(false);
      });
    });
  });
});
