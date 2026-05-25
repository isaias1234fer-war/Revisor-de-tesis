import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class OrcidService {
    private configService;
    private prisma;
    private clientId;
    private clientSecret;
    private redirectUri;
    private orcidApiUrl;
    constructor(configService: ConfigService, prisma: PrismaService);
    getAuthUrl(): string;
    handleCallback(code: string, advisorId: string): Promise<{
        orcid: any;
    }>;
    syncPublications(advisorId: string, orcid: string, accessToken: string): Promise<void>;
}
