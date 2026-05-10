// @ts-nocheck
// prisma.config.ts — Prisma v7 configuration
// TS errors suppressed as the Prisma v7 Config type definitions are still evolving.
import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL as string;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: DATABASE_URL,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({ connectionString: DATABASE_URL });
      return new PrismaNeon(pool);
    },
  },
});
