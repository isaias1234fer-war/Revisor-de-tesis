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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersController = class UsersController {
    constructor(usersService, prisma) {
        this.usersService = usersService;
        this.prisma = prisma;
    }
    async getAdvisors() {
        return this.prisma.user.findMany({
            where: { role: 'ADVISOR' },
            select: {
                id: true,
                name: true,
                email: true,
                advisorProfile: {
                    select: {
                        id: true,
                        orcidId: true,
                    }
                }
            }
        });
    }
    async getMyStudentProfile(req) {
        const studentProfile = await this.prisma.studentProfile.findUnique({
            where: { userId: req.user.userId },
            include: {
                advisor: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                            }
                        }
                    }
                }
            }
        });
        return studentProfile;
    }
    async assignAdvisor(req, advisorId) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId: req.user.userId },
        });
        if (!student) {
            throw new Error('User is not a student');
        }
        return this.prisma.studentProfile.update({
            where: { id: student.id },
            data: {
                advisorId: advisorId || null,
            },
        });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('advisors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of all advisors' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAdvisors", null);
__decorate([
    (0, common_1.Get)('my-student-profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student profile of logged in user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyStudentProfile", null);
__decorate([
    (0, common_1.Post)('assign-advisor'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign advisor to current student' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('advisorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "assignAdvisor", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        prisma_service_1.PrismaService])
], UsersController);
//# sourceMappingURL=users.controller.js.map