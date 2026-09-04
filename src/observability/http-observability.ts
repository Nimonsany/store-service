import { Logger, type INestApplication } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

interface RequestContext {
  requestId: string;
}

const requestContext = new AsyncLocalStorage<RequestContext>();

const requestIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function resolveRequestId(value: string | string[] | undefined): string {
  if (typeof value === 'string' && requestIdPattern.test(value)) {
    return value;
  }

  return randomUUID();
}

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function configureHttpObservability(app: INestApplication): void {
  const logger = new Logger('HttpRequest');

  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = resolveRequestId(request.headers['x-request-id']);

    const startedAt = process.hrtime.bigint();

    response.setHeader('X-Request-Id', requestId);

    response.once('finish', () => {
      const elapsedNanoseconds = process.hrtime.bigint() - startedAt;

      const durationMs = Math.round(Number(elapsedNanoseconds) / 1_000_000);

      const message = JSON.stringify({
        event: 'http_request',
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs,
      });

      if (response.statusCode >= 500) {
        logger.error(message);
        return;
      }

      if (response.statusCode >= 400) {
        logger.warn(message);
        return;
      }

      logger.log(message);
    });

    requestContext.run({ requestId }, next);
  });
}
