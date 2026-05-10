import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DatasetsService {
  constructor(private prisma: PrismaService) {}

  async createDataset(file: Express.Multer.File, userId: string, tenantId: string) {
    const dataset = await this.prisma.dataset.create({
      data: {
        name: file.originalname,
        filePath: file.path,
        userId,
        tenantId,
        status: 'VALIDATED',
      },
    });
    return { datasetId: dataset.id, name: dataset.name, status: dataset.status };
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
