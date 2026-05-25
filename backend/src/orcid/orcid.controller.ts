import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { OrcidService } from './orcid.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('orcid')
@Controller('orcid')
export class OrcidController {
  constructor(private orcidService: OrcidService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ORCID authorization URL' })
  getAuthUrl() {
    return { url: this.orcidService.getAuthUrl() };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle ORCID OAuth callback' })
  async handleCallback(@Query('code') code: string, @Query('state') advisorId: string) {
    return this.orcidService.handleCallback(code, advisorId);
  }
}
