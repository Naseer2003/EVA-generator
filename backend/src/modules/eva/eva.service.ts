import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import { PrismaService } from '../../prisma/prisma.service';
import { RunEvaDto } from './dto/run-eva.dto';

@Injectable()
export class EvaService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async runAnalysis(dto: RunEvaDto, userId: string) {
    // ── 1. Load Dataset ─────────────────────────────────────────────────────
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: dto.datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    // ── 2. Read Data from File ───────────────────────────────────────────────
    const rawData = this.parseDataFile(dataset.filePath);
    if (rawData.length < 5) {
      throw new BadRequestException('Dataset must have at least 5 observations');
    }

    // Convert Remaining Thickness to Wall Loss if originalThickness is provided
    let processedData = rawData;
    if (dto.originalThickness !== undefined && dto.originalThickness !== null) {
      const origT = dto.originalThickness;
      processedData = rawData.map(v => Math.max(0, origT - v));
    }

    // ── 3. Create EVA Run Record ─────────────────────────────────────────────
    const run = await this.prisma.evaRun.create({
      data: {
        datasetId: dto.datasetId,
        assetId: dto.assetId,
        userId,
        distribution: dto.distribution,
        method: dto.method,
        confidenceLevel: dto.confidenceLevel ?? 0.95,
        nBootstrap: dto.nBootstrap ?? 1000,
        originalThickness: dto.originalThickness,
        serviceStartDate: dto.serviceStartDate ? new Date(dto.serviceStartDate) : null,
        inspectionDate: dto.inspectionDate ? new Date(dto.inspectionDate) : null,
        minimumRequiredThickness: dto.minimumRequiredThickness,
        totalPopulation: dto.totalPopulation,
        status: 'PROCESSING',
      } as any,
    });

    try {
      // ── 4. Call Python EVA Engine ──────────────────────────────────────────
      const engineUrl = this.config.get<string>('EVA_ENGINE_URL', 'http://localhost:8000');
      const returnPeriods = dto.returnPeriods ?? [2, 5, 10, 25, 50, 100];
      if (dto.totalPopulation && !returnPeriods.includes(dto.totalPopulation)) {
        returnPeriods.push(dto.totalPopulation);
        returnPeriods.sort((a, b) => a - b);
      }

      const { data: result } = await firstValueFrom(
        this.http.post(`${engineUrl}/analyze`, {
          data: processedData,
          distribution: dto.distribution,
          method: dto.method,
          confidence_levels: [0.99, 0.95, 0.90, 0.80],
          return_periods: returnPeriods,
          n_bootstrap: dto.nBootstrap ?? 1000,
        }),
      );

      // ── 5. Store Results in DB ─────────────────────────────────────────────
      await this.prisma.evaRun.update({
        where: { id: run.id },
        data: {
          mu: result.parameters.mu,
          beta: result.parameters.beta,
          xi: result.parameters.xi,
          adStatistic: result.goodness_of_fit.ad_statistic,
          adPassed: result.goodness_of_fit.ad_passed,
          ksStatistic: result.goodness_of_fit.ks_statistic,
          ksPValue: result.goodness_of_fit.ks_p_value,
          result: result, // Store the full engine result for charts
          status: 'COMPLETED',
          completedAt: new Date(),
        } as any,
      });

      // ── 6. Store Return Levels ─────────────────────────────────────────────
      const yearsInService = this.calculateYears(dto.serviceStartDate, dto.inspectionDate);

      await this.prisma.returnLevel.createMany({
        data: result.return_levels.map((rl: any) => {
          const wallLoss = rl.value;
          const corrosionRate = yearsInService > 0 ? wallLoss / yearsInService : 0;
          
          let eolDate = null;
          if (dto.originalThickness !== undefined && 
              dto.minimumRequiredThickness !== undefined && 
              dto.inspectionDate !== undefined && 
              corrosionRate > 0) {
            const remThickness = dto.originalThickness - wallLoss;
            const remainingLife = (remThickness - dto.minimumRequiredThickness) / corrosionRate;
            const insDate = new Date(dto.inspectionDate);
            eolDate = new Date(insDate.setFullYear(insDate.getFullYear() + Math.max(0, remainingLife)));
          }

          return {
            evaRunId: run.id,
            returnPeriod: rl.period,
            predictedValue: wallLoss,
            ciLower: rl.ci_lower,
            ciUpper: rl.ci_upper,
            corrosionRate: corrosionRate,
            eolDate: eolDate,
            allConfidences: rl.all_confidences
          };
        }),
      });

      return { runId: run.id, status: 'COMPLETED', result };
    } catch (err) {
      await this.prisma.evaRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', errorMessage: err.message },
      });
      throw new BadRequestException(`EVA Engine error: ${err.message}`);
    }
  }

  async getRunById(runId: string) {
    const run = await this.prisma.evaRun.findUnique({
      where: { id: runId },
      include: { returnLevels: true, dataset: true },
    });
    if (!run) throw new NotFoundException('EVA run not found');
    return run;
  }

  async getRunsByUser(userId: string) {
    return this.prisma.evaRun.findMany({
      where: { userId },
      include: { returnLevels: true, dataset: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private calculateYears(start: string | undefined, end: string | undefined): number {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    return diff / (1000 * 60 * 60 * 24 * 365.25);
  }

  private parseDataFile(filePath: string): number[] {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Data file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const records = csv.parse(content, { skip_empty_lines: true, trim: true });
      // Extract numeric values from first column
      return records
        .flat()
        .map((v: string) => parseFloat(v))
        .filter((v: number) => !isNaN(v));
    }

    // Plain text: one number per line
    return content
      .split('\n')
      .map((line) => parseFloat(line.trim()))
      .filter((v) => !isNaN(v));
  }
}
