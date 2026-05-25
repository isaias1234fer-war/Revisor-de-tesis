import { Controller, Post, Get, Body, Param, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Req, Res, Header, Delete } from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { AiService } from '../ai/ai.service';
import { Response } from 'express';

@ApiTags('drafts')
@Controller('drafts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DraftsController {
  constructor(
    private draftsService: DraftsService,
    private prisma: PrismaService,
    private reportsService: ReportsService,
    private aiService: AiService
  ) {}

  @Get(':id/report')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Generate and download the AI review report as PDF' })
  async downloadReport(@Param('id') id: string, @Res() res: Response) {
    const draft = await this.prisma.thesisDraft.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!draft) throw new Error('Draft not found');

    const pdfBuffer = await this.reportsService.generateDraftReport(draft);
    
    res.set({
      'Content-Disposition': `attachment; filename=reporte-tesis-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new thesis draft' })
  async upload(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Req() req: any
  ) {
    const user = req.user;
    console.log(`Uploading draft for user ${user.userId} with title: ${title}`);
    
    // Buscar el perfil del estudiante asociado al usuario
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!student) {
      throw new Error("El usuario no tiene un perfil de estudiante");
    }

    return this.draftsService.create(student.id, title, file);
  }

  @Get('advisor/pending')
  @ApiOperation({ summary: 'Get all drafts of students assigned to the logged in advisor' })
  async getAdvisorPendingDrafts(@Req() req: any) {
    const user = req.user;
    
    const advisor = await this.prisma.advisorProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!advisor) {
      return [];
    }

    return this.prisma.thesisDraft.findMany({
      where: {
        student: {
          advisorId: advisor.id
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all drafts for the logged in student' })
  async findAll(@Req() req: any) {
    const user = req.user;
    
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!student) {
      return [];
    }

    return this.draftsService.findByStudent(student.id);
  }

  @Get(':id/orcid-match')
  @ApiOperation({ summary: 'Check title compatibility against advisor publications' })
  async getOrcidMatch(@Param('id') id: string) {
    const draft = await this.prisma.thesisDraft.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            advisor: {
              include: {
                publications: true
              }
            }
          }
        }
      }
    });

    if (!draft) throw new Error('Borrador no encontrado');
    if (!draft.student.advisor) {
      return {
        match: false,
        score: 0,
        reason: 'El estudiante aún no tiene un asesor asignado.'
      };
    }

    const publications = draft.student.advisor.publications;
    if (publications.length === 0) {
      return {
        match: false,
        score: 0,
        reason: 'El asesor aún no tiene publicaciones académicas vinculadas a ORCID.'
      };
    }

    // Run AI comparison
    return this.aiService.compareWithOrcid(
      draft.title,
      publications.map(p => ({ title: p.title, journal: p.journal, year: p.year }))
    );
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Submit a human review for a draft' })
  async submitReview(
    @Param('id') id: string,
    @Body('comments') comments: any,
    @Body('status') status: string,
    @Req() req: any
  ) {
    const user = req.user;
    const advisor = await this.prisma.advisorProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!advisor) {
      throw new Error('El usuario no tiene un perfil de asesor');
    }

    // Create HumanReview
    const humanReview = await this.prisma.humanReview.create({
      data: {
        draftId: id,
        advisorId: advisor.id,
        comments,
        status, // APPROVED, REJECTED, CHANGES_REQUESTED
      }
    });

    // Update ThesisDraft status
    let draftStatus = 'REVIEWED';
    if (status === 'APPROVED') draftStatus = 'APPROVED';
    if (status === 'REJECTED') draftStatus = 'REJECTED';
    if (status === 'CHANGES_REQUESTED') draftStatus = 'PENDING'; // Volver a pendiente para cambios

    await this.prisma.thesisDraft.update({
      where: { id },
      data: {
        status: draftStatus,
        score: status === 'APPROVED' ? 100 : undefined // Opcional
      }
    });

    return humanReview;
  }

  @Post('upload-batch')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a batch of thesis drafts (10-20 files)' })
  async uploadBatch(
    @UploadedFiles() files: any[],
    @Body('titles') titles: any,
    @Req() req: any
  ) {
    const user = req.user;
    console.log(`Uploading batch of ${files?.length} drafts for student ${user.userId}`);

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.userId }
    });

    if (!student) {
      throw new Error("El usuario no tiene un perfil de estudiante");
    }

    if (!files || files.length === 0) {
      throw new Error("No se subieron archivos");
    }

    const results = [];
    let parsedTitles: string[] = [];

    if (titles) {
      if (Array.isArray(titles)) {
        parsedTitles = titles;
      } else if (typeof titles === 'string') {
        try {
          if (titles.startsWith('[') && titles.endsWith(']')) {
            parsedTitles = JSON.parse(titles);
          } else {
            parsedTitles = titles.split(',').map((t: string) => t.trim());
          }
        } catch {
          parsedTitles = [titles];
        }
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let title = parsedTitles[i] || '';
      
      if (!title) {
        title = file.originalname.replace(/\.[^/.]+$/, "");
      }

      const draft = await this.draftsService.create(student.id, title, file);
      results.push(draft);
    }

    return results;
  }

  @Post('download-reports-zip')
  @ApiOperation({ summary: 'Download multiple reports combined in a ZIP file' })
  async downloadReportsZip(@Body('ids') ids: string[], @Res() res: Response) {
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=reportes_tesis_lote.zip`,
    });

    archive.on('error', (err: any) => {
      console.error('Error during ZIP generation:', err);
      res.status(500).send({ message: 'Error generating ZIP archive' });
    });

    archive.pipe(res);

    for (const id of ids) {
      const draft = await this.prisma.thesisDraft.findUnique({
        where: { id },
        include: {
          student: { include: { user: true } },
          aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });

      if (draft) {
        try {
          const pdfBuffer = await this.reportsService.generateDraftReport(draft);
          const safeName = draft.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
          archive.append(pdfBuffer, { name: `reporte_${safeName}_${id.substring(0, 5)}.pdf` });
        } catch (err) {
          console.error(`Failed to generate report for draft ${id} in batch ZIP:`, err);
        }
      }
    }

    await archive.finalize();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get draft details including AI findings' })
  async findOne(@Param('id') id: string) {
    return this.draftsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft' })
  async remove(@Param('id') id: string) {
    return this.draftsService.remove(id);
  }
}
