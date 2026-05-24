import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../../infra/adapters/driven/database/schema';

const TEST_DATABASE_URL = 'postgres://root:root@localhost:5432/proarq_test';

async function main() {
  console.log('Running migrations on test database...');
  const queryClient = postgres(TEST_DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient, { schema });
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('Migrations complete.');
  await queryClient.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
