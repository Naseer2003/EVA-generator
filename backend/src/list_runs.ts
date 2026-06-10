import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.$connect();
  const runs = await prisma.evaRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log("=== Recent Runs ===");
  runs.forEach(run => {
    console.log(`Run ID: ${run.id}`);
    console.log(`Created At: ${run.createdAt}`);
    console.log(`Total Pop: ${run.totalPopulation}`);
    console.log(`Service Start: ${run.serviceStartDate}`);
    console.log(`Inspection Date: ${run.inspectionDate}`);
    console.log(`Original Thickness: ${run.originalThickness}`);
    console.log(`------------------------------------------`);
  });

  await prisma.$disconnect();
  await pool.end();
}

main();
