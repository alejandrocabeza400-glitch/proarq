import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not defined.');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database to perform rollback...');
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('Dropping existing public schema...');
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    console.log('Dropping existing drizzle migration tracking schema...');
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`;
    console.log('Recreating public schema...');
    await sql`CREATE SCHEMA public;`;
    console.log('Database rollback completed successfully!');
  } catch (error) {
    console.error('Error rolling back the database:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
