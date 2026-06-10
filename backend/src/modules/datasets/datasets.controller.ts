import {
  Controller, Post, Get, Param, UseGuards, Request,
  UploadedFile, UseInterceptors, BadRequestException,
  Res, StreamableFile, NotFoundException, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { createReadStream, existsSync } from 'fs';
import { DatasetsService } from './datasets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DatasetsController {
  constructor(private datasets: DatasetsService) {
    console.log('DatasetsController Initialized');
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['.csv', '.txt', '.xlsx'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException('Only CSV, TXT, XLSX files allowed'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
    @Body('name') name?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.datasets.createDataset(file, req.user.id, req.user.tenantId, name);
  }

  @Get()
  getAll(@Request() req: any) {
    return this.datasets.findByUser(req.user.id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: any) {
    console.log('Processing download request for ID:', id);
    const dataset = await this.datasets.findById(id);
    const fullPath = join(process.cwd(), dataset.filePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException('Physical file not found on server');
    }

    const file = createReadStream(fullPath);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${dataset.name}"`,
    });
    
    return new StreamableFile(file);
  }
}
