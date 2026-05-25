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
exports.OrcidService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = require("axios");
let OrcidService = class OrcidService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.clientId = this.configService.get('ORCID_CLIENT_ID');
        this.clientSecret = this.configService.get('ORCID_CLIENT_SECRET');
        this.redirectUri = this.configService.get('ORCID_REDIRECT_URI');
        this.orcidApiUrl = 'https://pub.orcid.org/v3.0';
    }
    getAuthUrl() {
        return `https://orcid.org/oauth/authorize?client_id=${this.clientId}&response_type=code&scope=/read-public&redirect_uri=${this.redirectUri}`;
    }
    async handleCallback(code, advisorId) {
        try {
            const response = await axios_1.default.post('https://orcid.org/oauth/token', new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
            }), {
                headers: {
                    Accept: 'application/json',
                },
            });
            const { orcid, access_token, refresh_token } = response.data;
            await this.prisma.advisorProfile.update({
                where: { id: advisorId },
                data: {
                    orcidId: orcid,
                    orcidAccessToken: access_token,
                    orcidRefreshToken: refresh_token,
                },
            });
            await this.syncPublications(advisorId, orcid, access_token);
            return { orcid };
        }
        catch (error) {
            throw new common_1.HttpException('Error in ORCID OAuth', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async syncPublications(advisorId, orcid, accessToken) {
        try {
            const response = await axios_1.default.get(`${this.orcidApiUrl}/${orcid}/works`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
            });
            const works = response.data.group;
            for (const group of works) {
                const workSummary = group['work-summary'][0];
                const title = workSummary.title.title.value;
                const year = workSummary['publication-date']?.year?.value;
                const doi = workSummary['external-ids']?.['external-id']?.find((id) => id['external-id-type'] === 'doi')?.['external-id-value'];
                await this.prisma.orcidPublication.create({
                    data: {
                        advisorId,
                        title,
                        year: year ? parseInt(year) : null,
                        doi,
                        journal: workSummary['journal-title']?.value,
                    },
                });
            }
        }
        catch (error) {
            console.error('Error syncing publications', error);
        }
    }
};
exports.OrcidService = OrcidService;
exports.OrcidService = OrcidService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], OrcidService);
//# sourceMappingURL=orcid.service.js.map