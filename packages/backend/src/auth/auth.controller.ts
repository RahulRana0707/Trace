import { All, Controller, Req, Res } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';

import { auth } from './auth';

const handler = toNodeHandler(auth);

/**
 * better-auth's request/response reconciliation reads req.baseUrl + req.originalUrl
 * to reconstruct the full path, but forcing req.url back to originalUrl is a cheap
 * defensive no-op that avoids depending on that reconciliation working perfectly
 * across better-auth/better-call versions.
 */
@Controller('api/auth')
export class AuthController {
  @All('*path')
  handleAuth(@Req() req: Request, @Res() res: Response) {
    if (req.originalUrl) {
      req.url = req.originalUrl;
    }
    return handler(req, res);
  }
}
