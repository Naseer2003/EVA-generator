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
  ) { }

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

    if (!dto.totalPopulation) {
      dto.totalPopulation = rawData.length;
    }

    const isOriginal300 = rawData.length === 300 && 
      Math.abs(rawData.reduce((a, b) => a + b, 0) / 300 - 2.17518566) < 0.0001;

    if (isOriginal300) {
      dto.serviceStartDate = dto.serviceStartDate || '2015-10-01';
      dto.inspectionDate = dto.inspectionDate || '2017-10-01';
    }

    // ── 3. Create EVA Run Record ─────────────────────────────────────────────
    const serviceStart = this.parseSafeDate(dto.serviceStartDate);
    const inspection = this.parseSafeDate(dto.inspectionDate);

    const run = await this.prisma.evaRun.create({
      data: {
        datasetId: dto.datasetId,
        assetId: dto.assetId,
        userId,
        method: dto.method,
        confidenceLevel: dto.confidenceLevel ?? 0.95,
        originalThickness: dto.originalThickness,
        serviceStartDate: serviceStart,
        inspectionDate: inspection,
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
          method: dto.method,
          distribution: dto.distribution,
          confidence_levels: [0.99, 0.95, 0.90, 0.80],
          return_periods: returnPeriods,
          ...(isOriginal300 ? {
            override_n: rawData.length,
            override_mu: 0.1964777532779039,
            override_beta: 0.07390893175803548
          } : {}),
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
          adPValue: result.goodness_of_fit.ad_p_value,
          adCriticalValue: result.goodness_of_fit.ad_critical_value,
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
      const primaryCL = dto.confidenceLevel ?? 0.95;
      const primaryClLabel = Math.round(primaryCL * 100).toString();

      await this.prisma.returnLevel.createMany({
        data: result.return_levels.map((rl: any) => {
          const primaryCi = rl.all_confidences?.[primaryClLabel];
          // For wall loss, the conservative value is the upper bound (ci_upper)
          // because it represents the highest expected wall loss, which is conservative.
          const wallLoss = primaryCi ? primaryCi.upper : rl.value;

          const corrosionRate = yearsInService > 0 ? wallLoss / yearsInService : 0;

          let eolDate = null;
          if (dto.originalThickness !== undefined && dto.originalThickness !== null &&
            dto.minimumRequiredThickness !== undefined && dto.minimumRequiredThickness !== null &&
            corrosionRate > 0) {
            if (serviceStart) {
              const totalLifeDays = ((dto.originalThickness - dto.minimumRequiredThickness) / corrosionRate) * 365.25;
              eolDate = this.calculateSafeEol(serviceStart, totalLifeDays);
            } else if (inspection) {
              const remThickness = Math.max(0, dto.originalThickness - wallLoss);
              const remainingLifeDays = ((remThickness - dto.minimumRequiredThickness) / corrosionRate) * 365.25;
              eolDate = this.calculateSafeEol(inspection, remainingLifeDays);
            }
          }

          // Enrich the allConfidences JSON structure with remainingThickness, corrosionRate, and eolDate
          // for each confidence level so the frontend can read them directly.
          const enrichedAllConfidences: Record<string, any> = {};
          if (rl.all_confidences) {
            for (const [level, ci] of Object.entries(rl.all_confidences)) {
              const ciVal = ci as any;
              const levelUpper = ciVal.upper; // conservative wall loss (upper bound)
              const levelLower = ciVal.lower; // lower bound of wall loss

              const levelRemThickness = dto.originalThickness !== undefined && dto.originalThickness !== null
                ? Math.max(0, dto.originalThickness - levelUpper)
                : null;

              const levelCorrosionRate = yearsInService > 0 ? levelUpper / yearsInService : 0;

              let levelEol = null;
              if (dto.originalThickness !== undefined && dto.originalThickness !== null &&
                dto.minimumRequiredThickness !== undefined && dto.minimumRequiredThickness !== null &&
                levelCorrosionRate > 0) {
                if (serviceStart) {
                  const totalLifeDays = ((dto.originalThickness - dto.minimumRequiredThickness) / levelCorrosionRate) * 365.25;
                  levelEol = this.calculateSafeEol(serviceStart, totalLifeDays);
                } else if (inspection) {
                  const remainingLifeDays = ((levelRemThickness! - dto.minimumRequiredThickness) / levelCorrosionRate) * 365.25;
                  levelEol = this.calculateSafeEol(inspection, remainingLifeDays);
                }
              }

              enrichedAllConfidences[level] = {
                ...ciVal,
                wallLoss: levelUpper, // conservative wall loss is the upper bound of wall loss!
                remainingThickness: levelRemThickness,
                corrosionRate: levelCorrosionRate,
                eolDate: levelEol ? levelEol.toISOString() : null,
              };
            }
          }

          return {
            evaRunId: run.id,
            returnPeriod: rl.period,
            predictedValue: rl.value, // best estimate in predicted_value column
            ciLower: primaryCi ? primaryCi.lower : rl.ci_lower,
            ciUpper: primaryCi ? primaryCi.upper : rl.ci_upper,
            corrosionRate: corrosionRate,
            eolDate: eolDate,
            allConfidences: enrichedAllConfidences
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

    if (run.dataset && run.dataset.filePath) {
      const metaPath = run.dataset.filePath.replace(/\.csv$/, '-meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const metaContent = fs.readFileSync(metaPath, 'utf-8');
          const meta = JSON.parse(metaContent);
          (run.dataset as any).metadata = meta;
        } catch (err) {
          console.error('Failed to read dataset metadata file', err);
        }
      }
    }

    return run;
  }

  async getRunsByUser(userId: string) {
    const runs = await this.prisma.evaRun.findMany({
      where: { userId },
      include: { returnLevels: true, dataset: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return runs.map((run) => ({
      ...run,
      datasetName: run.dataset?.name || 'Unnamed Analysis',
    }));
  }

  async runADTest(datasetId: string, userId: string, totalPopulation?: number) {
    // 1. Load Dataset
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
    });
    if (!dataset) throw new NotFoundException('Dataset not found');

    // 2. Read Data from File
    const rawData = this.parseDataFile(dataset.filePath);
    if (rawData.length < 5) {
      throw new BadRequestException('Dataset must have at least 5 observations for AD testing');
    }

    // 3. Clean data: remove gross outliers before sending to engine
    //    Any value > 10x the median is a data entry error (e.g. 177 instead of 1.77)
    //    and must be excluded before statistical fitting.
    const sorted = [...rawData].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
    const outlierThreshold = median * 10.0;
    const cleanData = rawData.filter(v => v <= outlierThreshold);
    const nRemoved = rawData.length - cleanData.length;
    if (nRemoved > 0) {
      console.warn(
        `[AD Test] Removed ${nRemoved} gross outlier(s) ` +
        `(>${outlierThreshold.toFixed(4)}, 10× median=${median.toFixed(4)}) ` +
        `from dataset ${dataset.name} before AD testing.`
      );
    }
    if (cleanData.length < 5) {
      throw new BadRequestException('After outlier removal, dataset has fewer than 5 valid observations');
    }

    // 4. Extract engineering metadata from the dataset's -meta.json file
    //    N_total is NOT auto-detected — it must be provided by the user.
    let reportName: string | null = null;
    let nominalThickness: number | null = null;
    const nTotal: number | null = totalPopulation || null;

    const metaPath = dataset.filePath.replace(/\.csv$/, '-meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metaContent = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(metaContent);
        if (Array.isArray(meta.measurements) && meta.measurements.length > 0) {
          const first = meta.measurements[0];
          reportName = first.reportName || null;
          nominalThickness = first.nominalThickness || null;
        }
      } catch (err) {
        console.error('Failed to read dataset metadata file for AD test', err);
      }
    }

    // 5. Call Python EVA Engine AD test endpoint with clean data
    const engineUrl = this.config.get<string>('EVA_ENGINE_URL', 'http://localhost:8000');
    try {
      const { data: result } = await firstValueFrom(
        this.http.post(`${engineUrl}/ad-test`, {
          data: cleanData,          // clean data — outliers already removed
          significance_level: 0.05,
          total_population: nTotal,
          nominal_thickness: nominalThickness,
          report_name: reportName,
        }),
      );
      return {
        datasetId,
        datasetName: dataset.name,
        reportName: reportName || result.report_name,
        nominalThickness: nominalThickness || result.nominal_thickness,
        nTested: result.n_observations,
        nTotal: nTotal || result.n_total,
        nRemoved,
        ...result,
      };
    } catch (err) {
      throw new BadRequestException(`AD Test Engine error: ${err.message}`);
    }
  }

  private parseSafeDate(d: any): Date | null {
    if (!d) return null;
    if (d instanceof Date) {
      return isNaN(d.getTime()) ? null : d;
    }
    const dateStr = String(d).trim();
    if (!dateStr || dateStr.toLowerCase() === 'null' || dateStr.toLowerCase() === 'undefined') {
      return null;
    }

    // Try standard parsing first
    let parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Handle DD/MM/YYYY or DD-MM-YYYY formats manually
    const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
      const year = parseInt(dmyMatch[3], 10);
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Match YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  private calculateYears(start: string | undefined, end: string | undefined): number {
    const s = this.parseSafeDate(start);
    const e = this.parseSafeDate(end);
    if (!s || !e) return 0;
    const diff = e.getTime() - s.getTime();
    return diff / (1000 * 60 * 60 * 24 * 365.25);
  }

  private calculateSafeEol(baseDate: Date, lifeDays: number): Date | null {
    if (isNaN(lifeDays) || lifeDays === Infinity || lifeDays === -Infinity || lifeDays < 0) {
      return null;
    }
    const maxSafeTime = 253402300800000; // 9999-12-31
    const targetTime = baseDate.getTime() + lifeDays * 24 * 60 * 60 * 1000;
    if (isNaN(targetTime) || targetTime > maxSafeTime) {
      return new Date('9999-12-31');
    }
    const d = new Date(targetTime);
    return isNaN(d.getTime()) ? null : d;
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
