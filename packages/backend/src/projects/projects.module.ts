import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ApiKeysController } from './api-keys.controller';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, ApiKeysController],
})
export class ProjectsModule {}
