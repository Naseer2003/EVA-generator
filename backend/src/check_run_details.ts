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
  
  const runId = '8bf641ea-f361-400d-a516-8abde7c66fcc';
  
  const run = await prisma.evaRun.findUnique({
    where: { id: runId },
    include: { returnLevels: true, dataset: true }
  });
  
  if (!run) {
    console.log("Run not found");
    await prisma.$disconnect();
    await pool.end();
    return;
  }
  
  console.log(`=== Run details for ${runId} ===`);
  console.log(`Dataset Name: ${run.dataset?.name}`);
  console.log(`Status: ${run.status}`);
  console.log(`Total Pop: ${run.totalPopulation}`);
  console.log(`Service Start: ${run.serviceStartDate}`);
  console.log(`Inspection Date: ${run.inspectionDate}`);
  
  console.log("\nReturn Levels:");
  const rl = run.returnLevels.find(r => r.returnPeriod === run.totalPopulation) || run.returnLevels[run.returnLevels.length - 1];
  if (rl) {
    console.log(`Return Period: ${rl.returnPeriod}`);
    console.log(`Predicted Value: ${rl.predictedValue}`);
    console.log(`Corrosion Rate: ${rl.corrosionRate}`);
    console.log(`EOL Date: ${rl.eolDate}`);
    console.log(`All Confidences:`);
    console.log(JSON.stringify(rl.allConfidences, null, 2));
  } else {
    console.log("No matching return level found");
  }

  await prisma.$disconnect();
  await pool.end();
}

main();
