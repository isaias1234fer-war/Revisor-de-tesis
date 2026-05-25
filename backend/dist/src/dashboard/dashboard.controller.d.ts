import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getKpis(req: any): Promise<{
        totalDrafts: number;
        reviewedDrafts: number;
        pendingDrafts: number;
        avgScore: number;
        iaHumanAgreement: number;
    }>;
    getTimeline(req: any): Promise<({
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
