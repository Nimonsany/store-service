import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureHttpObservability } from '../src/observability/http-observability';
import { SafeExceptionFilter } from '../src/observability/safe-exception.filter';

describe('Store lifecycle (e2e)', () => {
  const internalServiceSecret = 'store-e2e-internal-secret';

  const internalRequest = () =>
    request
      .agent(app.getHttpServer())
      .set('x-internal-service-secret', internalServiceSecret);
  let app: INestApplication;
  let prisma: PrismaService;

  const ownerUserId = '29887c63-7058-41f6-b6b9-f92b2c759716';

  beforeAll(async () => {
    process.env.INTERNAL_SERVICE_SECRET = internalServiceSecret;
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for E2E tests');
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    configureHttpObservability(app);
    app.useGlobalFilters(new SafeExceptionFilter());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.store.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates a request ID for a public store request', async () => {
    const response = await request(app.getHttpServer())
      .get('/stores')
      .expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('preserves a gateway request ID for a public store request', async () => {
    await request(app.getHttpServer())
      .get('/stores')
      .set('X-Request-Id', 'gateway-store-e2e-123')
      .expect('X-Request-Id', 'gateway-store-e2e-123')
      .expect(200);
  });

  it('allows public store reads without internal credentials', async () => {
    await request(app.getHttpServer()).get('/stores').expect(200);
  });

  it('rejects protected requests without internal service credentials', async () => {
    await request(app.getHttpServer()).post('/stores').send({}).expect(401);
  });

  it('rejects protected requests with invalid internal service credentials', async () => {
    await request(app.getHttpServer())
      .post('/stores')
      .set('x-internal-service-secret', 'wrong-secret')
      .send({})
      .expect(401);
  });

  it('creates a pending store', async () => {
    const response = await internalRequest()
      .post('/stores')
      .set('x-user-id', ownerUserId)
      .set('x-user-role', 'STORE_OWNER')
      .send({
        name: 'Test Store',
        slug: 'test-store',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
      })
      .expect(201);

    expect(response.body.status).toBe('PENDING');

    expect(response.body.ownerUserId).toBe(ownerUserId);
  });

  it('rejects a second open store', async () => {
    await prisma.store.create({
      data: {
        ownerUserId,
        name: 'Existing Store',
        slug: 'existing-store',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
        status: 'ACTIVE',
      },
    });

    const response = await internalRequest()
      .post('/stores')
      .set('x-user-id', ownerUserId)
      .set('x-user-role', 'STORE_OWNER')
      .send({
        name: 'Second Store',
        slug: 'second-store',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
      })
      .expect(400);

    expect(response.body.message).toContain('open store');
  });

  it('returns conflict for duplicate slug', async () => {
    await prisma.store.create({
      data: {
        ownerUserId,
        name: 'Existing Store',
        slug: 'duplicate-slug',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
        status: 'CLOSED',
      },
    });

    await internalRequest()
      .post('/stores')
      .set('x-user-id', ownerUserId)
      .set('x-user-role', 'STORE_OWNER')
      .send({
        name: 'Duplicate Store',
        slug: 'duplicate-slug',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
      })
      .expect(409);
  });

  it('allows admin to activate pending store', async () => {
    const store = await prisma.store.create({
      data: {
        ownerUserId,
        name: 'Pending Store',
        slug: 'pending-store',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
      },
    });

    const response = await internalRequest()
      .patch(`/stores/${store.id}/status`)
      .set('x-user-role', 'ADMIN')
      .send({
        status: 'ACTIVE',
      })
      .expect(200);

    expect(response.body.status).toBe('ACTIVE');
  });

  it('rejects invalid status transition', async () => {
    const store = await prisma.store.create({
      data: {
        ownerUserId,
        name: 'Active Store',
        slug: 'active-store',
        addressLine: 'Jeetpur',
        city: 'Jeetpur',
        latitude: 27.0936,
        longitude: 84.8802,
        status: 'ACTIVE',
      },
    });

    const response = await internalRequest()
      .patch(`/stores/${store.id}/status`)
      .set('x-user-role', 'ADMIN')
      .send({
        status: 'PENDING',
      })
      .expect(400);

    expect(response.body.message).toContain('ACTIVE to PENDING');
  });
});
