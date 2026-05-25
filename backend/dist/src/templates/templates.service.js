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
exports.TemplatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TemplatesService = class TemplatesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { fileUrl, fileName, ...rest } = data;
        const structure = await this.extractStructure(fileUrl, fileName);
        return this.prisma.thesisTemplate.create({
            data: {
                ...rest,
                fileUrl,
                structure,
            },
        });
    }
    async extractStructure(fileUrl, fileName) {
        return {
            sections: [
                { name: 'Resumen', required: true, maxLength: 500 },
                { name: 'Introducción', required: true, minLength: 1000 },
                { name: 'Metodología', required: true },
                { name: 'Resultados', required: true },
                { name: 'Conclusiones', required: true },
                { name: 'Bibliografía', required: true, style: 'APA' },
            ],
            formatting: {
                font: 'Times New Roman',
                fontSize: 12,
                lineSpacing: 1.5,
            }
        };
    }
    async findAll() {
        return this.prisma.thesisTemplate.findMany({
            where: { isActive: true },
        });
    }
    async findOne(id) {
        return this.prisma.thesisTemplate.findUnique({
            where: { id },
        });
    }
};
exports.TemplatesService = TemplatesService;
exports.TemplatesService = TemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplatesService);
//# sourceMappingURL=templates.service.js.map