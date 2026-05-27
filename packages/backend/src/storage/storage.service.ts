import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
    this.bucket     = this.config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl  = this.config.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Upload a Buffer to R2 and return the public URL.
   *
   * @param key       Object key, e.g. "kyc/selfies/userId/timestamp.jpg"
   * @param body      File content as a Buffer
   * @param mimeType  MIME type, e.g. "image/jpeg"
   */
  async upload(key: string, body: Buffer, mimeType: string): Promise<string> {
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket:      this.bucket,
          Key:         key,
          Body:        body,
          ContentType: mimeType,
        }),
      );
    } catch (err) {
      this.logger.error(`R2 upload failed for key=${key}`, err);
      throw new InternalServerErrorException('File upload failed');
    }

    return `${this.publicUrl}/${key}`;
  }
}
