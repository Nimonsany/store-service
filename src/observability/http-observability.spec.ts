import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureHttpObservability } from './http-observability';
import { SafeExceptionFilter } from './safe-exception.filter';

@Controller('observability-test')
class ObservabilityTestController {
  @Get('ok')
  ok() {
    return { ok: true };
  }

  @Get('failure')
  failure() {
    throw new Error('internalSecret=must-not-reach-client');
  }
}

describe('HTTP observability', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ObservabilityTestController],
    }).compile();

    app = moduleRef.createNestApplication();

    configureHttpObservability(app);
    app.useGlobalFilters(new SafeExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a request ID when none is supplied', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/ok')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('preserves a valid incoming request ID', async () => {
    await request(app.getHttpServer())
      .get('/observability-test/ok')
      .set('X-Request-Id', 'gateway-store-123')
      .expect('X-Request-Id', 'gateway-store-123')
      .expect(200);
  });

  it('replaces an invalid incoming request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/ok')
      .set('X-Request-Id', 'invalid request id')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    expect(response.headers['x-request-id']).not.toBe('invalid request id');
  });

  it('returns a generic 500 and preserves request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/observability-test/failure')
      .set('X-Request-Id', 'store-error-test')
      .expect('X-Request-Id', 'store-error-test')
      .expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });

    expect(JSON.stringify(response.body)).not.toContain(
      'must-not-reach-client',
    );
  });
});
