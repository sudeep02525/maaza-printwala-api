import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Storage Abstraction Service for Maaza Printwala
 * Supports Local Disk Adapter for development and Cloudinary/S3 for production.
 */
class StorageService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local'; // 'local', 's3', 'cloudinary'
    this.localUploadDir = path.resolve('public/uploads/artwork');

    if (this.provider === 'local') {
      if (!fs.existsSync(this.localUploadDir)) {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      }
    }
  }

  /**
   * Stores an artwork file and returns sanitized metadata and URL.
   * Discards client filename and metadata for security.
   */
  async saveArtworkFile(fileBuffer, originalMimeType, originalExtension) {
    // Sanitize extension
    const ext = originalExtension ? originalExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'pdf';
    // Generate secure unique backend filename (MZ-ART-<timestamp>-<uuid>.<ext>)
    const secureFileName = `MZ-ART-${Date.now()}-${uuidv4().slice(0, 8)}.${ext}`;

    if (this.provider === 'local') {
      const filePath = path.join(this.localUploadDir, secureFileName);
      await fs.promises.writeFile(filePath, fileBuffer);

      return {
        provider: 'local',
        fileId: secureFileName,
        fileUrl: `/uploads/artwork/${secureFileName}`,
        mimeType: originalMimeType,
        sizeBytes: fileBuffer.length,
        createdAt: new Date().toISOString(),
      };
    }

    // Abstraction hook for Cloudinary / S3 in future phases
    if (this.provider === 'cloudinary' || this.provider === 's3') {
      throw new Error(`Cloud storage provider '${this.provider}' integration is reserved for production deployment phase.`);
    }

    throw new Error(`Unsupported storage provider: ${this.provider}`);
  }

  /**
   * Programmatically verifies that an uploaded artwork fileId exists in server storage metadata.
   * Returns authoritative fileUrl and metadata if valid, otherwise null.
   */
  async verifyArtworkExists(fileId) {
    if (!fileId || typeof fileId !== 'string') return null;
    if (!fileId.match(/^MZ-ART-[a-zA-Z0-9.-]+$/)) return null;

    if (this.provider === 'local') {
      const filePath = path.join(this.localUploadDir, fileId);
      try {
        const stats = await fs.promises.stat(filePath);
        if (stats && stats.isFile()) {
          return {
            provider: 'local',
            fileId,
            fileUrl: `/uploads/artwork/${fileId}`,
            sizeBytes: stats.size,
            verifiedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        return null;
      }
    }

    // For cloud providers in future phases, this would query S3 headObject or Cloudinary API
    return null;
  }
}

export default new StorageService();
