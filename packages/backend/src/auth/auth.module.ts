import { Module } from '@nestjs/common';

import { ApiKeyAuthGuard } from './api-key-auth.guard';
import { AuthController } from './auth.controller';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [SessionAuthGuard, ApiKeyAuthGuard],
  exports: [SessionAuthGuard, ApiKeyAuthGuard],
})
export class AuthModule {}
