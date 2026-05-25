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
exports.OrcidController = void 0;
const common_1 = require("@nestjs/common");
const orcid_service_1 = require("./orcid.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let OrcidController = class OrcidController {
    constructor(orcidService) {
        this.orcidService = orcidService;
    }
    getAuthUrl() {
        return { url: this.orcidService.getAuthUrl() };
    }
    async handleCallback(code, advisorId) {
        return this.orcidService.handleCallback(code, advisorId);
    }
};
exports.OrcidController = OrcidController;
__decorate([
    (0, common_1.Get)('auth-url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get ORCID authorization URL' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrcidController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Get)('callback'),
    (0, swagger_1.ApiOperation)({ summary: 'Handle ORCID OAuth callback' }),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrcidController.prototype, "handleCallback", null);
exports.OrcidController = OrcidController = __decorate([
    (0, swagger_1.ApiTags)('orcid'),
    (0, common_1.Controller)('orcid'),
    __metadata("design:paramtypes", [orcid_service_1.OrcidService])
], OrcidController);
//# sourceMappingURL=orcid.controller.js.map