import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import {
  MemoryRepository,
  serializeMemoryEntry,
} from '../database/repositories/memory.repository';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { ResponseWrapperInterceptor } from '../common/response.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { createMemoryBody, type CreateMemoryBody } from '../projects/dto';
import { searchMemoryBody, type SearchMemoryBody } from './dto';

@Controller('agent')
@UseGuards(ApiKeyAuthGuard)
@UseInterceptors(ResponseWrapperInterceptor)
@UseFilters(HttpExceptionFilter)
export class AgentController {
  constructor(private readonly memories: MemoryRepository) {}

  @Get('ping')
  ping(@Req() req: Request) {
    return { ok: true, projectId: req.agentAuth!.projectId };
  }

  @Get('memories')
  async list(
    @Req() req: Request,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursorParam?: string,
  ) {
    const { projectId, organizationId } = req.agentAuth!;
    const limit = Math.min(
      50,
      Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || 20 : 20),
    );

    const result = await this.memories.listMemoryEntriesForProject({
      projectId,
      organizationId,
      limit,
      cursor: cursorParam ?? null,
    });

    if ('error' in result && result.error === 'invalid_cursor') {
      throw new NotFoundException('Invalid cursor');
    }
    if (!('items' in result)) {
      throw new InternalServerErrorException('Unexpected error');
    }

    return {
      items: result.items.map(serializeMemoryEntry),
      nextCursor: result.nextCursor,
    };
  }

  @Post('memories')
  @HttpCode(201)
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createMemoryBody)) body: CreateMemoryBody,
  ) {
    const { projectId, organizationId } = req.agentAuth!;
    const inserted = await this.memories.insertMemoryEntry({
      projectId,
      organizationId,
      intent: body.intent,
      alternativesConsidered: body.alternativesConsidered ?? null,
      architectureImpact: body.architectureImpact ?? null,
      filesTouched: body.filesTouched ?? [],
      gitCommitRef: body.gitCommitRef ?? null,
      metadata: body.metadata ?? null,
    });
    return serializeMemoryEntry(inserted);
  }

  @Get('memories/:memoryId')
  async getOne(@Req() req: Request, @Param('memoryId') memoryId: string) {
    const { projectId, organizationId } = req.agentAuth!;
    const row = await this.memories.getMemoryEntryForProject(
      projectId,
      organizationId,
      memoryId,
    );
    if (!row) {
      throw new NotFoundException('Not found');
    }
    return serializeMemoryEntry(row);
  }

  @Post('memories/search')
  @HttpCode(200)
  async search(
    @Req() req: Request,
    @Body(new ZodValidationPipe(searchMemoryBody)) body: SearchMemoryBody,
  ) {
    const { projectId, organizationId } = req.agentAuth!;
    const { items } = await this.memories.searchMemoryEntriesForProject({
      projectId,
      organizationId,
      query: body.query,
      limit: body.limit ?? 15,
    });

    const results = items.map((row) => {
      const snippetSource =
        row.intent ||
        row.alternativesConsidered ||
        row.architectureImpact ||
        '';
      return {
        id: row.id,
        snippet:
          snippetSource.length > 320
            ? `${snippetSource.slice(0, 320)}…`
            : snippetSource,
        createdAt: row.createdAt.toISOString(),
      };
    });

    return { items: results };
  }
}
