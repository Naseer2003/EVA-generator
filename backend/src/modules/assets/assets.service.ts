import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.asset.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async create(data: { name: string; location?: string; material?: string; designThickness?: number }, tenantId: string) {
    return this.prisma.asset.create({ data: { ...data, tenantId } });
  }
}
