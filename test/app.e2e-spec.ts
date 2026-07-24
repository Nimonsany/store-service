import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Store lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ownerUserId = '29887c63-7058-41f6-b6b9-f92b2c759716';

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for E2E tests');
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

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

  it('creates a pending store', async () => {
    const response = await request(app.getHttpServer())
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

    const response = await request(app.getHttpServer())
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

    await request(app.getHttpServer())
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

    const response = await request(app.getHttpServer())
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

    const response = await request(app.getHttpServer())
      .patch(`/stores/${store.id}/status`)
      .set('x-user-role', 'ADMIN')
      .send({
        status: 'PENDING',
      })
      .expect(400);

    expect(response.body.message).toContain('ACTIVE to PENDING');
  });
});
