import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';

@Module({
  imports: [MulterModule.register({ dest: './uploads' })],
  controllers: [DatasetsController],
  providers: [DatasetsService],
})
export class DatasetsModule {}
