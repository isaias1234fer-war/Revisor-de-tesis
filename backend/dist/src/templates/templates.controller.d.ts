import { TemplatesService } from './templates.service';
export declare class TemplatesController {
    private templatesService;
    constructor(templatesService: TemplatesService);
    create(body: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        fileUrl: string;
        structure: import("@prisma/client/runtime/library").JsonValue;
        rubric: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        fileUrl: string;
        structure: import("@prisma/client/runtime/library").JsonValue;
        rubric: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        fileUrl: string;
        structure: import("@prisma/client/runtime/library").JsonValue;
        rubric: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
    }>;
}
