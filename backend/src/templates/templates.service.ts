import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { fileUrl, fileName, ...rest } = data;
    
    // In a real scenario, we would download the file and parse it
    // For now, we'll simulate the structure extraction
    const structure = await this.extractStructure(fileUrl, fileName);

    return this.prisma.thesisTemplate.create({
      data: {
        ...rest,
        fileUrl,
        structure,
      },
    });
  }

  private async extractStructure(fileUrl: string, fileName: string) {
    // This is a placeholder for actual extraction logic
    // In production, we would use pdf-parse or mammoth to read the file
    // and then use IA to extract sections and rules
    return {
      sections: [
        { name: 'Resumen', required: true, maxLength: 500 },
        { name: 'Introducción', required: true, minLength: 1000 },
        { name: 'Metodología', required: true },
        { name: 'Resultados', required: true },
        { name: 'Conclusiones', required: true },
        { name: 'Bibliografía', required: true, style: 'APA' },
      ],
      formatting: {
        font: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 1.5,
      }
    };
  }

  async findAll() {
    return this.prisma.thesisTemplate.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.thesisTemplate.findUnique({
      where: { id },
    });
  }
}
