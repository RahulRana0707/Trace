import { Global, Module } from '@nestjs/common';

import { drizzleProvider } from './drizzle.provider';
import { ProjectRepository } from './repositories/project.repository';
import { MemoryRepository } from './repositories/memory.repository';
import { ApiKeyRepository } from './repositories/api-key.repository';

@Global()
@Module({
  providers: [
    drizzleProvider,
    ProjectRepository,
    MemoryRepository,
    ApiKeyRepository,
  ],
  exports: [
    drizzleProvider,
    ProjectRepository,
    MemoryRepository,
    ApiKeyRepository,
  ],
})
export class DatabaseModule {}
