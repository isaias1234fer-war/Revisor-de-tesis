import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';
export declare class DraftProcessor extends WorkerHost {
    private aiService;
    private prisma;
    private storageService;
    private reportsService;
    private emailService;
    constructor(aiService: AiService, prisma: PrismaService, storageService: StorageService, reportsService: ReportsService, emailService: EmailService);
    process(job: Job<any, any, string>): Promise<any>;
}
