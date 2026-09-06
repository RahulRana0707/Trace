import {
  BadRequestException,
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

import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  MemoryRepository,
  serializeMemoryEntry,
} from '../database/repositories/memory.repository';
import { ProjectRepository } from '../database/repositories/project.repository';
import { HttpExceptionFilter } from '../common/http-exception.filter';
import { ResponseWrapperInterceptor } from '../common/response.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createMemoryBody,
  createProjectBody,
  type CreateMemoryBody,
  type CreateProjectBody,
} from './dto';
import { serializeProject } from './serialize-project';

// Scoped (not global) — a global interceptor/filter would also wrap AuthController's
// responses, corrupting better-auth's own response shape and double-writing to a
// response it already ended directly via @Res().
@Controller('projects')
@UseGuards(SessionAuthGuard)
@UseInterceptors(ResponseWrapperInterceptor)
@UseFilters(HttpExceptionFilter)
export class ProjectsController {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly memories: MemoryRepository,
  ) {}

  @Get()
  async list(@Req() req: Request) {
    const rows = await this.projects.listProjectsForOrganization(
      req.organizationId!,
    );
    return { items: rows.map(serializeProject) };
  }

  @Post()
  @HttpCode(201)
  async create(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createProjectBody)) body: CreateProjectBody,
  ) {
    const inserted = await this.projects.insertProject({
      organizationId: req.organizationId!,
      createdByUserId: req.user!.id,
      name: body.name,
      description: body.description ?? null,
      bannerImageUrl: body.bannerImageUrl ?? null,
      bannerGradientPreset: body.bannerGradientPreset ?? null,
      tags: body.tags ?? [],
      metadata: body.metadata ?? null,
    });
    return serializeProject(inserted);
  }

  @Get(':projectId/memories')
  async listMemories(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('limit') limitRaw?: string,
    @Query('cursor') cursorParam?: string,
  ) {
    await this.requireOrgProject(req, projectId);

    const limit = Math.min(
      50,
      Math.max(1, limitRaw ? Number.parseInt(limitRaw, 10) || 20 : 20),
    );
    const result = await this.memories.listMemoryEntriesForProject({
      projectId,
      organizationId: req.organizationId!,
      limit,
      cursor: cursorParam ?? null,
    });

    if ('error' in result && result.error === 'invalid_cursor') {
      throw new BadRequestException('Invalid cursor');
    }
    if (!('items' in result)) {
      throw new InternalServerErrorException('Unexpected error');
    }

    return {
      items: result.items.map(serializeMemoryEntry),
      nextCursor: result.nextCursor,
    };
  }

  @Post(':projectId/memories')
  @HttpCode(201)
  async createMemory(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createMemoryBody)) body: CreateMemoryBody,
  ) {
    await this.requireOrgProject(req, projectId);

    const inserted = await this.memories.insertMemoryEntry({
      projectId,
      organizationId: req.organizationId!,
      intent: body.intent,
      alternativesConsidered: body.alternativesConsidered ?? null,
      architectureImpact: body.architectureImpact ?? null,
      filesTouched: body.filesTouched ?? [],
      gitCommitRef: body.gitCommitRef ?? null,
      metadata: body.metadata ?? null,
    });
    return serializeMemoryEntry(inserted);
  }

  private async requireOrgProject(req: Request, projectId: string) {
    const project = await this.projects.getOrgProject(
      projectId,
      req.organizationId!,
    );
    if (!project) {
      throw new NotFoundException('Not found');
    }
    return project;
  }
}
