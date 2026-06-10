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
  const latestRun = await prisma.evaRun.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { returnLevels: true, dataset: true }
  });

  if (!latestRun) {
    console.log("No runs found");
    return;
  }

  console.log("=== Latest Run ===");
  console.log("ID:", latestRun.id);
  console.log("Method:", latestRun.method);
  console.log("totalPopulation (N):", latestRun.totalPopulation);
  console.log("originalThickness:", latestRun.originalThickness);
  console.log("minimumRequiredThickness:", latestRun.minimumRequiredThickness);
  console.log("serviceStartDate:", latestRun.serviceStartDate);
  console.log("inspectionDate:", latestRun.inspectionDate);
  
  const rl = latestRun.returnLevels.find((r: any) => r.returnPeriod === latestRun.totalPopulation) || latestRun.returnLevels[latestRun.returnLevels.length - 1];
  console.log("\n--- Target Return Level ---");
  console.log("returnPeriod:", rl.returnPeriod);
  console.log("predictedValue:", rl.predictedValue);
  console.log("ciLower:", rl.ciLower);
  console.log("ciUpper:", rl.ciUpper);
  console.log("corrosionRate:", rl.corrosionRate);
  console.log("eolDate:", rl.eolDate);
  console.log("allConfidences:", JSON.stringify(rl.allConfidences, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main();
