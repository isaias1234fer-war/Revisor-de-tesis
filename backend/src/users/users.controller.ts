import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  @Get('advisors')
  @ApiOperation({ summary: 'Get list of all advisors' })
  async getAdvisors() {
    return this.prisma.user.findMany({
      where: { role: 'ADVISOR' },
      select: {
        id: true,
        name: true,
        email: true,
        advisorProfile: {
          select: {
            id: true,
            orcidId: true,
          }
        }
      }
    });
  }

  @Get('my-student-profile')
  @ApiOperation({ summary: 'Get student profile of logged in user' })
  async getMyStudentProfile(@Req() req: any) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        advisor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });
    return studentProfile;
  }

  @Post('assign-advisor')
  @ApiOperation({ summary: 'Assign advisor to current student' })
  async assignAdvisor(@Req() req: any, @Body('advisorId') advisorId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      throw new Error('User is not a student');
    }

    return this.prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        advisorId: advisorId || null,
      },
    });
  }
}
