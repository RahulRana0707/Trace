import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import { and, eq } from 'drizzle-orm';
import type { Request } from 'express';

import { auth } from './auth';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/drizzle.provider';
import * as schema from '../database/schema';

export type SessionAuthedUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

declare module 'express' {
  interface Request {
    user?: SessionAuthedUser;
    organizationId?: string;
  }
}

/**
 * Session auth for dashboard calls. Verifies the session's activeOrganizationId
 * against a live `member` row rather than trusting the session field outright —
 * a user removed from an org after their session was issued must not keep access.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const result = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!result) {
      throw new UnauthorizedException('Unauthorized');
    }

    const organizationId = result.session.activeOrganizationId;
    if (!organizationId) {
      throw new BadRequestException('No active organization');
    }

    const [membership] = await this.db
      .select({ id: schema.member.id })
      .from(schema.member)
      .where(
        and(
          eq(schema.member.organizationId, organizationId),
          eq(schema.member.userId, result.user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('Not a member of the active organization');
    }

    req.user = result.user;
    req.organizationId = organizationId;
    return true;
  }
}
