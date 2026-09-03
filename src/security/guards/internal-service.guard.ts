import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedSecret = process.env.INTERNAL_SERVICE_SECRET;

    if (!expectedSecret) {
      throw new ServiceUnavailableException(
        'Internal service authentication is not configured',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedSecret = request.headers['x-internal-service-secret'];

    if (
      typeof providedSecret !== 'string' ||
      providedSecret !== expectedSecret
    ) {
      throw new UnauthorizedException('Invalid internal service credentials');
    }

    return true;
  }
}
