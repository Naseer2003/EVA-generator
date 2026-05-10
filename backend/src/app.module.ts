import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DatasetsModule } from './modules/datasets/datasets.module';
import { EvaModule } from './modules/eva/eva.module';
import { AssetsModule } from './modules/assets/assets.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // ── Config (loads .env globally) ────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Database ─────────────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature Modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    DatasetsModule,
    EvaModule,
    AssetsModule,
    ReportsModule,
  ],
})
export class AppModule {}
