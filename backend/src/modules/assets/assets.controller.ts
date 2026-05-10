import { Controller, Get, Post, Body, UseGuards, Request, Req } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('assets')
@UseGuards(JwtAuthGuard)
export class AssetsController {
  constructor(private assets: AssetsService) {}

  @Get()
  getAll(@Request() req: ExpressRequest & { user: any }) {
    return this.assets.findAll(req.user.tenantId);
  }

  @Post()
  create(@Body() body: any, @Request() req: ExpressRequest & { user: any }) {
    return this.assets.create(body, req.user.tenantId);
  }
}
