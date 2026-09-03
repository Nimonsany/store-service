import { config } from 'dotenv';

config({
  path: '.env.test',
  override: true,
  quiet: true,
});

if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'Refusing to run E2E tests: NODE_ENV must be "test".',
  );
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Refusing to run E2E tests: DATABASE_URL is required.',
  );
}

let databaseName: string;

try {
  const url = new URL(databaseUrl);

  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('unsupported database protocol');
  }

  databaseName = decodeURIComponent(
    url.pathname.replace(/^\/+/, ''),
  );
} catch {
  throw new Error(
    'Refusing to run E2E tests: DATABASE_URL must be a valid PostgreSQL URL.',
  );
}

if (!databaseName.endsWith('_test_db')) {
  throw new Error(
    `Refusing to run destructive E2E tests against database "${databaseName}". ` +
      'The database name must end with "_test_db".',
  );
}
