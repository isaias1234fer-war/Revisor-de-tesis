import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class UsersController {
    private usersService;
    private prisma;
    constructor(usersService: UsersService, prisma: PrismaService);
    getAdvisors(): Promise<{
        advisorProfile: {
            id: string;
            orcidId: string;
        };
        id: string;
        email: string;
        name: string;
    }[]>;
    getMyStudentProfile(req: any): Promise<{
        advisor: {
            user: {
                email: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            orcidId: string | null;
            orcidAccessToken: string | null;
            orcidRefreshToken: string | null;
        };
    } & {
        id: string;
        userId: string;
        advisorId: string | null;
    }>;
    assignAdvisor(req: any, advisorId: string): Promise<{
        id: string;
        userId: string;
        advisorId: string | null;
    }>;
}
