import { Module } from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { DraftsController } from './drafts.controller';
import { StorageModule } from '../storage/storage.module';
import { BullModule } from '@nestjs/bullmq';
import { DraftProcessor } from './drafts.processor';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    StorageModule,
    AiModule,
    PrismaModule,
    ReportsModule,
    BullModule.registerQueue({
      name: 'draft-processing',
    }),
  ],
  providers: [DraftsService, DraftProcessor],
  controllers: [DraftsController],
  exports: [DraftsService],
})
export class DraftsModule {}
