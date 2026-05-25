import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis(role?: string, userId?: string) {
    let whereClause = {};

    if (role === 'STUDENT' && userId) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId },
      });
      whereClause = { studentId: student?.id || '' };
    } else if (role === 'ADVISOR' && userId) {
      const advisor = await this.prisma.advisorProfile.findUnique({
        where: { userId },
      });
      whereClause = { student: { advisorId: advisor?.id || '' } };
    }

    const totalDrafts = await this.prisma.thesisDraft.count({
      where: whereClause,
    });
    const reviewedDrafts = await this.prisma.thesisDraft.count({
      where: { ...whereClause, status: 'REVIEWED' },
    });
    const pendingDrafts = await this.prisma.thesisDraft.count({
      where: { ...whereClause, status: { in: ['PENDING', 'ANALYZING'] } },
    });

    const avgScore = await this.prisma.thesisDraft.aggregate({
      where: whereClause,
      _avg: { score: true },
    });

    return {
      totalDrafts,
      reviewedDrafts,
      pendingDrafts,
      avgScore: avgScore._avg.score || 0,
      iaHumanAgreement: 85, // Mocked percentage
    };
  }

  async getActivityTimeline(role?: string, userId?: string) {
    let whereClause = {};

    if (role === 'STUDENT' && userId) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId },
      });
      whereClause = { studentId: student?.id || '' };
    } else if (role === 'ADVISOR' && userId) {
      const advisor = await this.prisma.advisorProfile.findUnique({
        where: { userId },
      });
      whereClause = { student: { advisorId: advisor?.id || '' } };
    }

    return this.prisma.thesisDraft.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    });
  }
}
