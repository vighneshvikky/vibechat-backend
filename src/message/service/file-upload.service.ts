
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private uploadPath: string;

  constructor(private configService: ConfigService) {
    // Create uploads directory if it doesn't exist
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
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadPath, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return file metadata
    return {
      fileName,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      url: `/uploads/chat-files/${fileName}`, // Adjust based on your static file serving
    };
  }

  getFilePath(fileName: string): string {
    return path.join(this.uploadPath, fileName);
  }

  deleteFile(fileName: string): void {
    const filePath = this.getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}