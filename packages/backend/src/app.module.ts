import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { McpModule } from './mcp/mcp.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [DatabaseModule, AuthModule, ProjectsModule, AgentModule, McpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
