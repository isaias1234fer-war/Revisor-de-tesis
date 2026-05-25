import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    // Definir la carpeta de subidas en la raíz del backend
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

  onModuleInit() {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileName: string, file: Buffer, mimeType: string) {
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const filePath = path.join(this.uploadDir, uniqueFileName);
    
    console.log(`Saving file to: ${filePath}`);
    fs.writeFileSync(filePath, file);
    
    // Retornamos el nombre del archivo para guardarlo en la DB
    return uniqueFileName;
  }

  async getFileUrl(fileName: string) {
    // Para desarrollo local, retornamos una ruta relativa o una URL de stream
    // Por ahora, simulamos una URL que el frontend pueda entender
    return `/uploads/${fileName}`;
  }
}
