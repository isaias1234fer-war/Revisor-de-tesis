import { OrcidService } from './orcid.service';
export declare class OrcidController {
    private orcidService;
    constructor(orcidService: OrcidService);
    getAuthUrl(): {
        url: string;
    };
    handleCallback(code: string, advisorId: string): Promise<{
        orcid: any;
    }>;
}
