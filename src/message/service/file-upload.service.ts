import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
 import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    this.uploadPath = path.join(process.cwd(), 'uploads', 'chat-files');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

 async uploadFile(file: Express.Multer.File): Promise<{
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}> {
  if (!file) throw new BadRequestException('No file provided');

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize)
    throw new BadRequestException('File size exceeds 10MB limit');


  const fileExt = path.extname(file.originalname);
  const fileName = path.basename(file.filename);
  const relativeUrl = `/uploads/${fileName}`;

  return {
    fileName,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    url: relativeUrl,
  };
}

  getFilePath(fileName: string): string {
    return path.join(this.uploadPath, fileName);
  }

  deleteFile(fileName: string): void {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
