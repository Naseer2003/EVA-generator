import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

@Injectable()
export class DatasetsService {
  constructor(private prisma: PrismaService) {}

  private parseDataFile(filePath: string): number[] {
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
        console.error('Failed to parse CSV in DatasetsService', err);
        return [];
      }
    }

    return content
      .split('\n')
      .map((line) => parseFloat(line.trim()))
      .filter((v) => !isNaN(v));
  }

  async createDataset(file: Express.Multer.File, userId: string, tenantId: string, name?: string) {
    const rawData = this.parseDataFile(file.path);
    const rowCount = rawData.length;

    const dataset = await this.prisma.dataset.create({
      data: {
        name: (name?.trim()) || file.originalname.replace(/\.[^.]+$/, ''),
        filePath: file.path,
        userId,
        tenantId,
        rowCount,
        status: 'VALIDATED',
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

  async findById(id: string) {
    const d = await this.prisma.dataset.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Dataset not found');
    return d;
  }
}
