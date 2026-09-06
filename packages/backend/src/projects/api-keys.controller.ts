import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';

import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ApiKeyRepository } from '../database/repositories/api-key.repository';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { ResponseWrapperInterceptor } from '../common/response.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createApiKeyBody, type CreateApiKeyBody } from './dto';

function serializeKey(row: {
  id: string;
  projectId: string;
  organizationId: string;
  keyPrefix: string;
  name: string | null;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: row.id,
    projectId: row.projectId,
    organizationId: row.organizationId,
    keyPrefix: row.keyPrefix,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

@Controller('projects/:projectId/api-keys')
@UseGuards(SessionAuthGuard)
@UseInterceptors(ResponseWrapperInterceptor)
@UseFilters(HttpExceptionFilter)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  @Get()
  async list(@Req() req: Request, @Param('projectId') projectId: string) {
    const rows = await this.apiKeys.listApiKeysForProject(
      projectId,
      req.organizationId!,
    );
    if (rows === 'forbidden') {
      throw new NotFoundException('Not found');
    }
    return { items: rows.map(serializeKey) };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createApiKeyBody)) body: CreateApiKeyBody,
  ) {
    const name =
      body.name && body.name.trim().length > 0 ? body.name.trim() : null;
    const created = await this.apiKeys.createApiKeyForProject({
      projectId,
      organizationId: req.organizationId!,
      name,
    });
    if (!created.ok) {
      throw new NotFoundException('Not found');
    }
    return {
      id: created.id,
      projectId: created.projectId,
      secret: created.plaintextSecret,
    };
  }

  @Delete(':keyId')
  async revoke(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('keyId') keyId: string,
  ) {
    const result = await this.apiKeys.revokeProjectApiKey({
      keyId,
      projectId,
      organizationId: req.organizationId!,
    });
    if (!result.ok) {
      throw new NotFoundException('Not found');
    }
    return { revoked: true, alreadyRevoked: result.alreadyRevoked };
  }
}
