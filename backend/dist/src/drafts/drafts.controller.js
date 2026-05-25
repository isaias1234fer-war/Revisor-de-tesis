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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsController = void 0;
const common_1 = require("@nestjs/common");
const drafts_service_1 = require("./drafts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const reports_service_1 = require("../reports/reports.service");
const ai_service_1 = require("../ai/ai.service");
const email_service_1 = require("../email/email.service");
let DraftsController = class DraftsController {
    constructor(draftsService, prisma, reportsService, aiService, emailService) {
        this.draftsService = draftsService;
        this.prisma = prisma;
        this.reportsService = reportsService;
        this.aiService = aiService;
        this.emailService = emailService;
    }
    async downloadReport(id, res, req) {
        const draft = await this.prisma.thesisDraft.findUnique({
            where: { id },
            include: {
                student: { include: { user: true } },
                aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });
        if (!draft)
            throw new Error('Draft not found');
        const pdfBuffer = await this.reportsService.generateDraftReport(draft);
        const user = req.user;
        if (user && user.userId) {
            this.prisma.user.findUnique({ where: { id: user.userId } }).then(dbUser => {
                if (dbUser && dbUser.email) {
                    console.log(`Enviando copia del reporte al correo personal: ${dbUser.email}`);
                    this.emailService.sendReport(dbUser.email, draft.title, draft.score, pdfBuffer, dbUser.name || 'Estudiante');
                }
            }).catch(err => {
                console.error('Error al obtener el correo del usuario para el reporte:', err.message);
            });
        }
        res.set({
            'Content-Disposition': `attachment; filename=reporte-tesis-${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    async upload(file, title, req) {
        const user = req.user;
        console.log(`Uploading draft for user ${user.userId} with title: ${title}`);
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: user.userId }
        });
        if (!student) {
            throw new Error("El usuario no tiene un perfil de estudiante");
        }
        return this.draftsService.create(student.id, title, file);
    }
    async getAdvisorPendingDrafts(req) {
        const user = req.user;
        const advisor = await this.prisma.advisorProfile.findUnique({
            where: { userId: user.userId }
        });
        if (!advisor) {
            return [];
        }
        return this.prisma.thesisDraft.findMany({
            where: {
                student: {
                    advisorId: advisor.id
                }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    }
                },
                aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });
    }
    async findAll(req) {
        const user = req.user;
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: user.userId }
        });
        if (!student) {
            return [];
        }
        return this.draftsService.findByStudent(student.id);
    }
    async getOrcidMatch(id) {
        const draft = await this.prisma.thesisDraft.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        advisor: {
                            include: {
                                publications: true
                            }
                        }
                    }
                }
            }
        });
        if (!draft)
            throw new Error('Borrador no encontrado');
        if (!draft.student.advisor) {
            return {
                match: false,
                score: 0,
                reason: 'El estudiante aún no tiene un asesor asignado.'
            };
        }
        const publications = draft.student.advisor.publications;
        if (publications.length === 0) {
            return {
                match: false,
                score: 0,
                reason: 'El asesor aún no tiene publicaciones académicas vinculadas a ORCID.'
            };
        }
        return this.aiService.compareWithOrcid(draft.title, publications.map(p => ({ title: p.title, journal: p.journal, year: p.year })));
    }
    async submitReview(id, comments, status, req) {
        const user = req.user;
        const advisor = await this.prisma.advisorProfile.findUnique({
            where: { userId: user.userId }
        });
        if (!advisor) {
            throw new Error('El usuario no tiene un perfil de asesor');
        }
        const humanReview = await this.prisma.humanReview.create({
            data: {
                draftId: id,
                advisorId: advisor.id,
                comments,
                status,
            }
        });
        let draftStatus = 'REVIEWED';
        if (status === 'APPROVED')
            draftStatus = 'APPROVED';
        if (status === 'REJECTED')
            draftStatus = 'REJECTED';
        if (status === 'CHANGES_REQUESTED')
            draftStatus = 'PENDING';
        await this.prisma.thesisDraft.update({
            where: { id },
            data: {
                status: draftStatus,
                score: status === 'APPROVED' ? 100 : undefined
            }
        });
        return humanReview;
    }
    async uploadBatch(files, titles, emails, req) {
        const user = req.user;
        console.log(`Uploading batch of ${files?.length} drafts for student ${user.userId}`);
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: user.userId }
        });
        if (!student) {
            throw new Error("El usuario no tiene un perfil de estudiante");
        }
        if (!files || files.length === 0) {
            throw new Error("No se subieron archivos");
        }
        const results = [];
        let parsedTitles = [];
        let parsedEmails = [];
        if (titles) {
            if (Array.isArray(titles)) {
                parsedTitles = titles;
            }
            else if (typeof titles === 'string') {
                try {
                    if (titles.startsWith('[') && titles.endsWith(']')) {
                        parsedTitles = JSON.parse(titles);
                    }
                    else {
                        parsedTitles = titles.split(',').map((t) => t.trim());
                    }
                }
                catch {
                    parsedTitles = [titles];
                }
            }
        }
        if (emails) {
            if (Array.isArray(emails)) {
                parsedEmails = emails;
            }
            else if (typeof emails === 'string') {
                try {
                    if (emails.startsWith('[') && emails.endsWith(']')) {
                        parsedEmails = JSON.parse(emails);
                    }
                    else {
                        parsedEmails = emails.split(',').map((e) => e.trim());
                    }
                }
                catch {
                    parsedEmails = [emails];
                }
            }
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let title = parsedTitles[i] || '';
            const recipientEmail = parsedEmails[i] || '';
            if (!title) {
                title = file.originalname.replace(/\.[^/.]+$/, "");
            }
            const draft = await this.draftsService.create(student.id, title, file, recipientEmail);
            results.push(draft);
        }
        return results;
    }
    async downloadReportsZip(ids, res) {
        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename=reportes_tesis_lote.zip`,
        });
        archive.on('error', (err) => {
            console.error('Error during ZIP generation:', err);
            res.status(500).send({ message: 'Error generating ZIP archive' });
        });
        archive.pipe(res);
        for (const id of ids) {
            const draft = await this.prisma.thesisDraft.findUnique({
                where: { id },
                include: {
                    student: { include: { user: true } },
                    aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });
            if (draft) {
                try {
                    const pdfBuffer = await this.reportsService.generateDraftReport(draft);
                    const safeName = draft.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
                    archive.append(pdfBuffer, { name: `reporte_${safeName}_${id.substring(0, 5)}.pdf` });
                }
                catch (err) {
                    console.error(`Failed to generate report for draft ${id} in batch ZIP:`, err);
                }
            }
        }
        await archive.finalize();
    }
    async findOne(id) {
        return this.draftsService.findOne(id);
    }
    async remove(id) {
        return this.draftsService.remove(id);
    }
};
exports.DraftsController = DraftsController;
__decorate([
    (0, common_1.Get)(':id/report'),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate and download the AI review report as PDF' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a new thesis draft' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('advisor/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all drafts of students assigned to the logged in advisor' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "getAdvisorPendingDrafts", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all drafts for the logged in student' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/orcid-match'),
    (0, swagger_1.ApiOperation)({ summary: 'Check title compatibility against advisor publications' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "getOrcidMatch", null);
__decorate([
    (0, common_1.Post)(':id/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a human review for a draft' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('comments')),
    __param(2, (0, common_1.Body)('status')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Post)('upload-batch'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a batch of thesis drafts (10-20 files)' }),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)('titles')),
    __param(2, (0, common_1.Body)('emails')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "uploadBatch", null);
__decorate([
    (0, common_1.Post)('download-reports-zip'),
    (0, swagger_1.ApiOperation)({ summary: 'Download multiple reports combined in a ZIP file' }),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "downloadReportsZip", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get draft details including AI findings' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a draft' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DraftsController.prototype, "remove", null);
exports.DraftsController = DraftsController = __decorate([
    (0, swagger_1.ApiTags)('drafts'),
    (0, common_1.Controller)('drafts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [drafts_service_1.DraftsService,
        prisma_service_1.PrismaService,
        reports_service_1.ReportsService,
        ai_service_1.AiService,
        email_service_1.EmailService])
], DraftsController);
//# sourceMappingURL=drafts.controller.js.map