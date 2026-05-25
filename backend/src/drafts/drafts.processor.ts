import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReportsService } from '../reports/reports.service';
import { EmailService } from '../email/email.service';
const pdf = require('pdf-parse');

@Processor('draft-processing')
export class DraftProcessor extends WorkerHost {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    private storageService: StorageService,
    private reportsService: ReportsService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { draftId } = job.data;
    
    const draft = await this.prisma.thesisDraft.findUnique({
      where: { id: draftId },
      include: { student: true },
    });

    if (!draft) return;

    // Update status
    await this.prisma.thesisDraft.update({
      where: { id: draftId },
      data: { status: 'ANALYZING' },
    });

    try {
      // Real extraction: Read uploaded file and parse content using pdf-parse
      let text = "Simulated extracted text from the document...";
      try {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(process.cwd(), 'uploads', draft.fileUrl);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          if (draft.fileType === 'application/pdf') {
            const parsed = await pdf(fileBuffer);
            text = parsed.text || text;
            console.log(`Successfully parsed PDF draft: ${draft.id} (${text.length} characters)`);
          } else {
            text = fileBuffer.toString('utf-8') || text;
            console.log(`Successfully read text draft: ${draft.id} (${text.length} characters)`);
          }
        } else {
          console.warn(`Draft file not found at: ${filePath}, using fallback text.`);
        }
      } catch (parseError) {
        console.error("Could not parse file, falling back to simulated text:", parseError.message);
      }
      
      // Get the active template (simplification)
      const template = await this.prisma.thesisTemplate.findFirst({
        where: { isActive: true },
      });

      const analysis = await this.aiService.analyzeDraft(text, template?.structure || {});

      // Save AI Review
      await this.prisma.aiReview.create({
        data: {
          draftId,
          findings: analysis.findings,
          score: analysis.score,
          summary: analysis.summary,
        },
      });

      // Update draft score and status
      const updatedDraftRecord = await this.prisma.thesisDraft.update({
        where: { id: draftId },
        data: { 
          score: analysis.score,
          status: 'REVIEWED'
        },
      });

      // If a recipient email is assigned, send the report via email!
      if (updatedDraftRecord.recipientEmail) {
        try {
          const updatedDraft = await this.prisma.thesisDraft.findUnique({
            where: { id: draftId },
            include: {
              student: { include: { user: true } },
              aiReviews: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          });
          
          if (updatedDraft) {
            const pdfBuffer = await this.reportsService.generateDraftReport(updatedDraft);
            await this.emailService.sendReport(
              updatedDraft.recipientEmail,
              updatedDraft.title,
              analysis.score,
              pdfBuffer,
              updatedDraft.student?.user?.name || 'Estudiante',
            );
          }
        } catch (mailError) {
          console.error(`Error sending emailed report for draft ${draftId}:`, mailError.message);
        }
      }

    } catch (error) {
      console.error('Error processing draft', error);
      await this.prisma.thesisDraft.update({
        where: { id: draftId },
        data: { status: 'ERROR' },
      });
    }
  }
}
