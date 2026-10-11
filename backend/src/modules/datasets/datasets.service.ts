import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import { execSync } from 'child_process';
import { join } from 'path';

/** Minimum observations the statistical engine needs to fit a distribution. */
const MIN_OBSERVATIONS = 5;

@Injectable()
export class DatasetsService {
  constructor(private prisma: PrismaService) {}

  private parseDataFile(filePath: string, sheetName?: string): number[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'xlsx' || ext === 'xlsm') {
      try {
        const pythonPath = join(process.cwd(), '..', 'eva-engine', 'venv', 'Scripts', 'python');
        const scriptPath = join(process.cwd(), 'parse_excel.py');
        const sheetArg = sheetName ? `"${sheetName}"` : '';
        const cmd = `"${pythonPath}" "${scriptPath}" "${filePath}" parse ${sheetArg}`;
        const stdout = execSync(cmd, { encoding: 'utf-8' });
        
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const res = JSON.parse(lastLine);
        return res.values || [];
      } catch (err) {
        console.error('Failed to parse Excel file in DatasetsService', err);
        return [];
      }
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    if (ext === 'csv') {
      try {
        const records = csv.parse(content, { skip_empty_lines: true, trim: true });
        return records
          .flat()
          .map((v: string) => parseFloat(v))
          .filter((v: number) => !isNaN(v));
      } catch (err) {
        console.error('Failed to parse CSV in DatasetsService', err);
        return [];
      }
    }

    return content
      .split('\n')
      .map((line) => parseFloat(line.trim()))
      .filter((v) => !isNaN(v));
  }

  async inspectExcelSheets(filePath: string) {
    try {
      const pythonPath = join(process.cwd(), '..', 'eva-engine', 'venv', 'Scripts', 'python');
      const scriptPath = join(process.cwd(), 'parse_excel.py');
      const cmd = `"${pythonPath}" "${scriptPath}" "${filePath}" list-sheets`;
      const stdout = execSync(cmd, { encoding: 'utf-8' });
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      const lines = stdout.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const res = JSON.parse(lastLine);
      return { sheets: res.sheets || [] };
    } catch (err) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error('Failed to inspect excel sheets', err);
      throw new BadRequestException(`Excel inspection failed: ${err.message}`);
    }
  }

  async createDataset(file: Express.Multer.File, userId: string, tenantId: string, name?: string, sheetName?: string) {
    const ext = file.path.split('.').pop()?.toLowerCase();
    let finalPath = file.path;

    if (ext === 'xlsx' || ext === 'xlsm') {
      let rawData: number[] = [];
      let tubes: any[] = [];
      let measurements: any[] = [];

      try {
        const pythonPath = join(process.cwd(), '..', 'eva-engine', 'venv', 'Scripts', 'python');
        const scriptPath = join(process.cwd(), 'parse_excel.py');
        const sheetArg = sheetName ? `"${sheetName}"` : '';
        const cmd = `"${pythonPath}" "${scriptPath}" "${file.path}" parse ${sheetArg}`;
        const stdout = execSync(cmd, { encoding: 'utf-8' });
        
        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const res = JSON.parse(lastLine);
        
        rawData = res.values || [];
        tubes = res.tubes || [];
        measurements = res.measurements || [];
      } catch (err) {
        console.error('Failed to parse Excel file inside createDataset', err);
      }

      if (rawData.length === 0) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new BadRequestException('No valid numeric observations could be extracted from the specified Excel sheet');
      }

      // Convert to CSV and save
      const csvContent = rawData.join('\n');
      const csvPath = file.path.replace(/\.(xlsx|xlsm)$/i, '.csv');
      fs.writeFileSync(csvPath, csvContent, 'utf-8');

      // Save tube coordinates + measurements metadata JSON in uploads/
      // measurements contains: { reportName, nominalThickness, remainingThickness, rowNo, tubeNo }
      const metaPath = csvPath.replace(/\.csv$/, '-meta.json');
      fs.writeFileSync(metaPath, JSON.stringify({ tubes, measurements }, null, 2), 'utf-8');

      // Delete original Excel
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      finalPath = csvPath;
    }

    const rawData = this.parseDataFile(finalPath);
    const rowCount = rawData.length;

    // The engine needs at least 5 observations to fit a Gumbel. Marking a file
    // VALIDATED regardless of what we could parse out of it hides the problem
    // until the user runs an analysis and gets a failure instead.
    const status = rowCount >= MIN_OBSERVATIONS ? 'VALIDATED' : 'INVALID';

    const dataset = await this.prisma.dataset.create({
      data: {
        name: (name?.trim()) || file.originalname.replace(/\.[^.]+$/, ''),
        filePath: finalPath,
        userId,
        tenantId,
        rowCount,
        status,
      },
    });
    return { datasetId: dataset.id, name: dataset.name, status: dataset.status, rowCount };
  }

  async findByUser(userId: string) {
    return this.prisma.dataset.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Look a dataset up, scoped to its owner.
   *
   * `userId` is required: without it any authenticated user could read or
   * delete another tenant's dataset just by knowing its UUID. A dataset that
   * exists but belongs to someone else reports as not found, so the endpoint
   * does not leak which ids are real.
   */
  async findById(id: string, userId: string) {
    const d = await this.prisma.dataset.findFirst({ where: { id, userId } });
    if (!d) throw new NotFoundException('Dataset not found');
    return d;
  }

  async remove(id: string, userId: string) {
    const dataset = await this.findById(id, userId);

    // EvaRun.datasetId is a required relation — deleting a dataset still
    // referenced by a run would break every one of those result pages.
    const runCount = await this.prisma.evaRun.count({ where: { datasetId: id } });
    if (runCount > 0) {
      throw new ConflictException(
        `Cannot delete "${dataset.name}": ${runCount} analysis run${runCount === 1 ? '' : 's'} ` +
        `still reference${runCount === 1 ? 's' : ''} it. Delete those runs first.`,
      );
    }

    await this.prisma.dataset.delete({ where: { id } });

    // Best-effort cleanup of the stored file and its sidecar metadata. A
    // failure here must not fail the request — the record is already gone.
    for (const p of [dataset.filePath, dataset.filePath.replace(/\.csv$/i, '-meta.json')]) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (err) {
        console.error(`Failed to delete file ${p} for dataset ${id}`, err);
      }
    }

    return { id, name: dataset.name, deleted: true };
  }
}
