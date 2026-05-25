import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPIs based on user role' })
  async getKpis(@Req() req: any) {
    const { role, userId } = req.user;
    return this.dashboardService.getKpis(role, userId);
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Get recent activity timeline based on user role' })
  async getTimeline(@Req() req: any) {
    const { role, userId } = req.user;
    return this.dashboardService.getActivityTimeline(role, userId);
  }
}
