import { exec } from 'child_process';
import { resolve } from 'path';
import { config } from 'dotenv';
import { promisify } from 'util';

// Load environment variables
config();

const execAsync = promisify(exec);

interface DbConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

const dbConfig: DbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'permit_portal_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456'
};

const migrationsDir = resolve(__dirname, '../../migrations/sqls');
const seedsDir = resolve(__dirname, '../database/seeds');

async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Create database if it doesn't exist
    try {
      await execAsync(`
        PGPASSWORD=${dbConfig.password} psql \
        -h ${dbConfig.host} \
        -U ${dbConfig.user} \
        -p ${dbConfig.port} \
        -d postgres \
        -c "CREATE DATABASE ${dbConfig.database}"
      `);
      console.log('Database created successfully');
    } catch (error) {
      if (!(error as Error).message.includes('already exists')) {
        throw error;
      }
      console.log('Database already exists');
    }

    // Run migrations
    const migrationFiles = await execAsync(`ls -1 ${migrationsDir}/*.sql | sort`);
    console.log(migrationFiles)
    for (const file of migrationFiles.stdout.split('\n').filter(Boolean)) {
      console.log(`Running migration: ${file}`);
      await execAsync(`
        PGPASSWORD=${dbConfig.password} psql \
        -h ${dbConfig.host} \
        -U ${dbConfig.user} \
        -p ${dbConfig.port} \
        -d ${dbConfig.database} \
        -f ${file}
      `);
    }

    console.log('Migrations completed successfully');

    // Run seeds if specified
    if (process.argv.includes('--seed')) {
      console.log('Running seeds...');
      const seedFiles = await execAsync(`ls -1 ${seedsDir}/*.sql | sort`);
      
      for (const file of seedFiles.stdout.split('\n').filter(Boolean)) {
        console.log(`Running seed: ${file}`);
        await execAsync(`
          PGPASSWORD=${dbConfig.password} psql \
          -h ${dbConfig.host} \
          -U ${dbConfig.user} \
          -p ${dbConfig.port} \
          -d ${dbConfig.database} \
          -f ${file}
        `);
      }

      console.log('Seeds completed successfully');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();