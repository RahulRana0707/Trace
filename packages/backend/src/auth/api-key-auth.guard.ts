import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeyRepository } from '../database/repositories/api-key.repository';

export type AgentAuthContext = {
  projectId: string;
  keyId: string;
  organizationId: string;
};

declare module 'express' {
  interface Request {
    agentAuth?: AgentAuthContext;
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Bearer trace_sk_... auth for agent REST calls — ported from apps/web/lib/agent-auth.ts. */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    const resolved = await this.apiKeys.resolveActiveApiKeyToProject(token);
    if (!resolved) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    const projectHeader = req.headers['x-trace-project-id'];
    const projectHeaderValue = Array.isArray(projectHeader)
      ? projectHeader[0]
      : projectHeader;
    if (
      projectHeaderValue &&
      projectHeaderValue.trim() &&
      projectHeaderValue.trim() !== resolved.projectId
    ) {
      throw new ForbiddenException(
        "X-Trace-Project-Id does not match this API key's project",
      );
    }

    req.agentAuth = resolved;
    return true;
  }
}
