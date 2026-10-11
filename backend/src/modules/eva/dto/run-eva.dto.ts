import { IsString, IsOptional, IsArray, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RunEvaDto {
  @IsString()
  datasetId: string;

  @IsString()
  @IsOptional()
  assetId?: string;

  @IsString()
  @IsOptional()
  distribution?: string;

  @IsString()
  @IsIn(['mle', 'mom'])
  method: string = 'mle';

  @IsNumber()
  @Min(0.5)
  @Max(0.999)
  @IsOptional()
  confidenceLevel?: number = 0.95;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  returnPeriods?: number[] = [2, 5, 10, 25, 50, 100];

  @IsNumber()
  @Min(100)
  @Max(10000)
  @IsOptional()
  nBootstrap?: number = 1000;

  // N — the total population: every unit in the bundle / circuit. This is a
  // required engineering input and is never inferred from the dataset row
  // count, which is the inspected sample size n. EVA extrapolates n -> N, so
  // the engine needs N >= 2 (y_N = -ln(-ln(1 - 1/N)) is undefined below that).
  @IsNumber()
  @Min(2)
  @Max(1000000)
  totalPopulation: number;

  @IsNumber()
  @IsOptional()
  originalThickness?: number;

  @IsString()
  @IsOptional()
  serviceStartDate?: string;

  @IsString()
  @IsOptional()
  inspectionDate?: string;

  @IsNumber()
  @IsOptional()
  minimumRequiredThickness?: number;
}
