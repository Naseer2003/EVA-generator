import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EvaService } from './eva.service';
import { RunEvaDto } from './dto/run-eva.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('eva')
@UseGuards(JwtAuthGuard)
export class EvaController {
  constructor(private evaService: EvaService) {}

  @Post('run')
  run(@Body() dto: RunEvaDto, @Request() req: any) {
    return this.evaService.runAnalysis(dto, req.user.id);
  }

  @Get(':id/results')
  getResults(@Param('id') id: string) {
    return this.evaService.getRunById(id);
  }

  @Get('my-runs')
  getMyRuns(@Request() req: any) {
    return this.evaService.getRunsByUser(req.user.id);
  }
}
