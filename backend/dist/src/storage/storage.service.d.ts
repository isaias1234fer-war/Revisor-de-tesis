import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class StorageService implements OnModuleInit {
    private configService;
    private uploadDir;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private ensureDirectoryExists;
    uploadFile(fileName: string, file: Buffer, mimeType: string): Promise<string>;
    getFileUrl(fileName: string): Promise<string>;
}
