import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EvaService } from './eva.service';
import { EvaController } from './eva.controller';

@Module({
  imports: [HttpModule],
  providers: [EvaService],
  controllers: [EvaController],
})
export class EvaModule {}
