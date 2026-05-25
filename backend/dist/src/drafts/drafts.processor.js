"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const ai_service_1 = require("../ai/ai.service");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const reports_service_1 = require("../reports/reports.service");
const email_service_1 = require("../email/email.service");
const pdf = require('pdf-parse');
let DraftProcessor = class DraftProcessor extends bullmq_1.WorkerHost {
    constructor(aiService, prisma, storageService, reportsService, emailService) {
        super();
        this.aiService = aiService;
        this.prisma = prisma;
        this.storageService = storageService;
        this.reportsService = reportsService;
        this.emailService = emailService;
    }
    async process(job) {
        const { draftId } = job.data;
        const draft = await this.prisma.thesisDraft.findUnique({
            where: { id: draftId },
            include: { student: true },
        });
        if (!draft)
            return;
        await this.prisma.thesisDraft.update({
            where: { id: draftId },
            data: { status: 'ANALYZING' },
        });
        try {
            let text = "Simulated extracted text from the document...";
            try {
                const path = require('path');
                const fs = require('fs');
                const filePath = path.join(process.cwd(), 'uploads', draft.fileUrl);
                if (fs.existsSync(filePath)) {
                    const fileBuffer = fs.readFileSync(filePath);
                    if (draft.fileType === 'application/pdf') {
                        const parsed = await pdf(fileBuffer);
                        text = parsed.text || text;
                        console.log(`Successfully parsed PDF draft: ${draft.id} (${text.length} characters)`);
                    }
                    else {
                        text = fileBuffer.toString('utf-8') || text;
                        console.log(`Successfully read text draft: ${draft.id} (${text.length} characters)`);
                    }
                }
                else {
                    console.warn(`Draft file not found at: ${filePath}, using fallback text.`);
                }
            }
            catch (parseError) {
                console.error("Could not parse file, falling back to simulated text:", parseError.message);
            }
            const template = await this.prisma.thesisTemplate.findFirst({
                where: { isActive: true },
            });
            const analysis = await this.aiService.analyzeDraft(text, template?.structure || {});
            await this.prisma.aiReview.create({
                data: {
                    draftId,
                    findings: analysis.findings,
                    score: analysis.score,
                    summary: analysis.summary,
                },
            });
            const updatedDraftRecord = await this.prisma.thesisDraft.update({
                where: { id: draftId },
                data: {
                    score: analysis.score,
                    status: 'REVIEWED'
                },
            });
            if (updatedDraftRecord.recipientEmail) {
                try {
                    const updatedDraft = await this.prisma.thesisDraft.findUnique({
                        where: { id: draftId },
                        include: {
                            student: { include: { user: true } },
                            aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
                        }
                    });
                    if (updatedDraft) {
                        const pdfBuffer = await this.reportsService.generateDraftReport(updatedDraft);
                        await this.emailService.sendReport(updatedDraft.recipientEmail, updatedDraft.title, analysis.score, pdfBuffer, updatedDraft.student?.user?.name || 'Estudiante');
                    }
                }
                catch (mailError) {
                    console.error(`Error sending emailed report for draft ${draftId}:`, mailError.message);
                }
            }
        }
        catch (error) {
            console.error('Error processing draft', error);
            await this.prisma.thesisDraft.update({
                where: { id: draftId },
                data: { status: 'ERROR' },
            });
        }
    }
};
exports.DraftProcessor = DraftProcessor;
exports.DraftProcessor = DraftProcessor = __decorate([
    (0, bullmq_1.Processor)('draft-processing'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        reports_service_1.ReportsService,
        email_service_1.EmailService])
], DraftProcessor);
//# sourceMappingURL=drafts.processor.js.map