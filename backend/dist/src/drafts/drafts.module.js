"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftsModule = void 0;
const common_1 = require("@nestjs/common");
const drafts_service_1 = require("./drafts.service");
const drafts_controller_1 = require("./drafts.controller");
const storage_module_1 = require("../storage/storage.module");
const bullmq_1 = require("@nestjs/bullmq");
const drafts_processor_1 = require("./drafts.processor");
const ai_module_1 = require("../ai/ai.module");
const prisma_module_1 = require("../prisma/prisma.module");
const reports_module_1 = require("../reports/reports.module");
const email_module_1 = require("../email/email.module");
let DraftsModule = class DraftsModule {
};
exports.DraftsModule = DraftsModule;
exports.DraftsModule = DraftsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            storage_module_1.StorageModule,
            ai_module_1.AiModule,
            prisma_module_1.PrismaModule,
            reports_module_1.ReportsModule,
            email_module_1.EmailModule,
            bullmq_1.BullModule.registerQueue({
                name: 'draft-processing',
            }),
        ],
        providers: [drafts_service_1.DraftsService, drafts_processor_1.DraftProcessor],
        controllers: [drafts_controller_1.DraftsController],
        exports: [drafts_service_1.DraftsService],
    })
], DraftsModule);
//# sourceMappingURL=drafts.module.js.map