import {
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';

import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { mcpContext } from './mcp-context';
import { McpToolsService } from './mcp-tools.service';

function methodNotAllowed(res: Response) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32_000, message: 'Method not allowed for this endpoint.' },
    id: null,
  });
}

@Controller('mcp')
@UseGuards(ApiKeyAuthGuard)
export class McpController {
  constructor(private readonly mcpTools: McpToolsService) {}

  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response) {
    const { projectId, organizationId, keyId } = req.agentAuth!;

    await mcpContext.run({ projectId, organizationId, keyId }, async () => {
      const server = this.mcpTools.createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body as unknown);
      } catch (err) {
        console.error('mcp: request failed', err);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32_603, message: 'Internal server error' },
            id: null,
          });
        }
      } finally {
        res.on('close', () => {
          void transport.close();
          void server.close();
        });
      }
    });
  }

  @Get()
  handleGet(@Res() res: Response) {
    methodNotAllowed(res);
  }

  @Delete()
  handleDelete(@Res() res: Response) {
    methodNotAllowed(res);
  }
}
