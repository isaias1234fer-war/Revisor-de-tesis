import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getKpis(role?: string, userId?: string): Promise<{
        totalDrafts: number;
        reviewedDrafts: number;
        pendingDrafts: number;
        avgScore: number;
        iaHumanAgreement: number;
    }>;
    getActivityTimeline(role?: string, userId?: string): Promise<({
        student: {
            user: {
                name: string;
            };
        } & {
            id: string;
            userId: string;
            advisorId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        fileUrl: string;
        fileName: string;
        version: number;
        fileType: string;
        status: string;
        score: number | null;
        recipientEmail: string | null;
        studentId: string;
    })[]>;
}
