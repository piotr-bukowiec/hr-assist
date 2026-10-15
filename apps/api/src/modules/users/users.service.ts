import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { HashService } from '../../common/hash/hash.service';
import { UserEntity } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly hashService: HashService,
  ) {}

  findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const user = this.usersRepository.create({
      ...dto,
      password: await this.hashService.hashText(dto.password),
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.throwIfUniqueViolation(error);
      throw error;
    }
  }

  async update(
    id: string,
    { password, ...rest }: UpdateUserDto,
  ): Promise<UserEntity> {
    const user: UserEntity = await this.findOne(id);

    Object.assign(user, {
      ...rest,
      password: password
        ? await this.hashService.hashText(password)
        : user.password,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      this.throwIfUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByAccessToken(accessToken: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { accessToken } }) ?? null;
  }

  async setAccessToken(id: string, accessToken: string | null): Promise<void> {
    await this.usersRepository.update(id, {
      accessToken: accessToken as unknown as string,
    });
  }

  private throwIfUniqueViolation(error: unknown): void {
    if (!(error instanceof QueryFailedError)) {
      return;
    }

    const driverError = error.driverError as {
      code?: string;
      detail?: string;
    };

    if (driverError.code !== '23505') {
      return;
    }

    const detail = driverError.detail ?? '';

    if (detail.includes('email')) {
      throw new ConflictException('User with this email already exists');
    }

    if (detail.includes('pesel')) {
      throw new ConflictException('User with this pesel already exists');
    }

    throw new ConflictException('User already exists');
  }
}
