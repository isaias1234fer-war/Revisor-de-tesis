import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class DraftsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @InjectQueue('draft-processing') private draftQueue: Queue,
  ) {}

  async create(studentId: string, title: string, file: any) {
    const objectName = await this.storageService.uploadFile(
      file.originalname,
      file.buffer,
      file.mimetype
    );

    const draft = await this.prisma.thesisDraft.create({
      data: {
        studentId,
        title,
        fileName: file.originalname,
        fileUrl: objectName,
        fileType: file.mimetype,
      },
    });

    // Enqueue for processing
    try {
      await this.draftQueue.add('analyze', { draftId: draft.id });
      console.log(`Draft ${draft.id} enqueued for AI analysis`);
    } catch (error) {
      console.error('Failed to enqueue draft for analysis (Is Redis running?):', error.message);
      // We don't throw here so the user still gets their draft uploaded
    }

    return draft;
  }

  async findByStudent(studentId: string) {
    return this.prisma.thesisDraft.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.thesisDraft.findUnique({
      where: { id },
      include: {
        aiReviews: true,
        humanReviews: true,
      },
    });
  }

  async remove(id: string) {
    // Primero eliminamos los registros relacionados para evitar errores de integridad
    await this.prisma.aiReview.deleteMany({ where: { draftId: id } });
    await this.prisma.humanReview.deleteMany({ where: { draftId: id } });
    
    return this.prisma.thesisDraft.delete({
      where: { id },
    });
  }
}
