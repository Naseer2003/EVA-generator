import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

function parseDataFile(filePath: string): number[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    try {
      const records = csv.parse(content, { skip_empty_lines: true, trim: true });
      return records
        .flat()
        .map((v: string) => parseFloat(v))
        .filter((v: number) => !isNaN(v));
    } catch (err) {
      console.error(`Failed to parse CSV: ${filePath}`, err);
      return [];
    }
  }

  return content
    .split('\n')
    .map((line) => parseFloat(line.trim()))
    .filter((v) => !isNaN(v));
}

async function main() {
  await prisma.$connect();
  console.log('✅ Connected to database');

  const datasets = await prisma.dataset.findMany();
  console.log(`Found ${datasets.length} datasets total.`);

  for (const dataset of datasets) {
    const rawPath = dataset.filePath;
    // Resolve relative path if it starts with ./
    const fullPath = path.resolve(process.cwd(), rawPath);
    console.log(`Processing dataset "${dataset.name}" (ID: ${dataset.id}) at ${fullPath}...`);

    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Warning: physical file not found at ${fullPath}`);
      continue;
    }

    const data = parseDataFile(fullPath);
    const count = data.length;

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { rowCount: count } as any,
    });

    console.log(`✅ Updated "${dataset.name}": rowCount = ${count}`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('🎉 Done populating row counts.');
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
