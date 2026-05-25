import { PrismaService } from '../prisma/prisma.service';
export declare class TemplatesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
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
    private extractStructure;
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
