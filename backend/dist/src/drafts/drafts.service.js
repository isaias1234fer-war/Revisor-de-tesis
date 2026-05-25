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
exports.DraftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let DraftsService = class DraftsService {
    constructor(prisma, storageService, draftQueue) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.draftQueue = draftQueue;
    }
    async create(studentId, title, file, recipientEmail) {
        const objectName = await this.storageService.uploadFile(file.originalname, file.buffer, file.mimetype);
        const draft = await this.prisma.thesisDraft.create({
            data: {
                studentId,
                title,
                fileName: file.originalname,
                fileUrl: objectName,
                fileType: file.mimetype,
                recipientEmail,
            },
        });
        try {
            await this.draftQueue.add('analyze', { draftId: draft.id });
            console.log(`Draft ${draft.id} enqueued for AI analysis`);
        }
        catch (error) {
            console.error('Failed to enqueue draft for analysis (Is Redis running?):', error.message);
        }
        return draft;
    }
    async findByStudent(studentId) {
        return this.prisma.thesisDraft.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.thesisDraft.findUnique({
            where: { id },
            include: {
                aiReviews: true,
                humanReviews: true,
            },
        });
    }
    async remove(id) {
        await this.prisma.aiReview.deleteMany({ where: { draftId: id } });
        await this.prisma.humanReview.deleteMany({ where: { draftId: id } });
        return this.prisma.thesisDraft.delete({
            where: { id },
        });
    }
};
exports.DraftsService = DraftsService;
exports.DraftsService = DraftsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('draft-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        bullmq_2.Queue])
], DraftsService);
//# sourceMappingURL=drafts.service.js.map