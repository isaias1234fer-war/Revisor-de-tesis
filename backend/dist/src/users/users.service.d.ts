import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: any): Promise<{
        role: import(".prisma/client").$Enums.Role;
        id: string;
        email: string;
        password: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        role: import(".prisma/client").$Enums.Role;
        id: string;
        email: string;
        password: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(id: string): Promise<{
        studentProfile: {
            id: string;
            userId: string;
            advisorId: string | null;
        };
        advisorProfile: {
            id: string;
            userId: string;
            orcidId: string | null;
            orcidAccessToken: string | null;
            orcidRefreshToken: string | null;
        };
        coordinatorProfile: {
            id: string;
            userId: string;
        };
        adminProfile: {
            id: string;
            userId: string;
        };
    } & {
        role: import(".prisma/client").$Enums.Role;
        id: string;
        email: string;
        password: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
