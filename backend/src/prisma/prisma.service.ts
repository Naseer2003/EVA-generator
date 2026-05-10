import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the backend root directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('❌ DATABASE_URL is not defined in environment variables.');
    }

    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    super({ adapter } as any);
  }
  async onModuleInit() {
    await this.$connect();
    console.log('✅  Prisma connected to Neon PostgreSQL');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
