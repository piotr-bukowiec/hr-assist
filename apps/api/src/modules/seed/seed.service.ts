import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { join, resolve } from 'path';
import { cwd } from 'process';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly seedFilePath: string = resolve(
    join(cwd(), '../../seed/seed.json'),
  );

  onApplicationBootstrap() {
    console.log('SeedService, and directory for seed', this.seedFilePath);
  }
}
