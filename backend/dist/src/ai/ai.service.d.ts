import { ConfigService } from '@nestjs/config';
export declare class AiService {
    private configService;
    private model;
    constructor(configService: ConfigService);
    analyzeDraft(text: string, templateStructure: any): Promise<any>;
    compareWithOrcid(thesisTitle: string, publications: any[]): Promise<any>;
}
