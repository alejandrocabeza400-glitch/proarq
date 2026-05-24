import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../infra/adapters/driven/database/schema';

const TEST_DATABASE_URL = 'postgres://root:root@localhost:5432/proarq_test';

async function main() {
  const queryClient = postgres(TEST_DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient, { schema });
  await migrate(db, { migrationsFolder: './migrations' });
  await queryClient.end();
}

main().catch((_err) => {
  process.exit(1);
});
