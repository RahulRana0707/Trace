import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { McpController } from './mcp.controller';
import { McpToolsService } from './mcp-tools.service';

@Module({
  imports: [AuthModule],
  controllers: [McpController],
  providers: [McpToolsService],
})
export class McpModule {}
