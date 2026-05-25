import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('templates')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Post()
  @Roles(Role.COORDINATOR, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new thesis template' })
  async create(@Body() body: any) {
    return this.templatesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active templates' })
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific template by ID' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
