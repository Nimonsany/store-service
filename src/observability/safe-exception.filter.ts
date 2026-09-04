import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { getRequestId } from './http-observability';

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorType =
      exception instanceof Error ? exception.name : typeof exception;

    const message = JSON.stringify({
      event: 'http_exception',
      requestId: getRequestId(),
      method: request.method,
      path: request.path,
      statusCode,
      errorType,
    });

    if (statusCode >= 500) {
      this.logger.error(message);
    } else {
      this.logger.warn(message);
    }

    if (isHttpException) {
      response.status(statusCode).json(exception.getResponse());
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
