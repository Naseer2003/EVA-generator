import { IsString, IsOptional, IsArray, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class RunEvaDto {
  @IsString()
  datasetId: string;

  @IsString()
  @IsOptional()
  assetId?: string;

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

  @IsNumber()
  @Min(1)
  @Max(1000000)
  @IsOptional()
  totalPopulation?: number;

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
