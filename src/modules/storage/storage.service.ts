import { randomUUID } from "node:crypto";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Carpetas permitidas dentro del bucket. Restringimos a un conjunto conocido
// para evitar que un cliente escriba/lea rutas arbitrarias del bucket.
export const STORAGE_FOLDERS = [
  "vehicle-documents",
  "driver-license",
  "checklist",
] as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[number];

// Tipos MIME permitidos -> extension. La firma incluye el ContentType, de modo
// que el cliente DEBE enviar exactamente ese header en el PUT o la firma falla.
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UPLOAD_URL_TTL_SECONDS = 600; // 10 minutos para subir
const DOWNLOAD_URL_TTL_SECONDS = 600; // 10 minutos para ver

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET_NAME ?? "";

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.warn(
        "Credenciales de R2 incompletas. Revisa R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY y R2_BUCKET_NAME en el .env",
      );
    }

    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKeyId ?? "",
        secretAccessKey: secretAccessKey ?? "",
      },
      forcePathStyle: true,
    });
  }

  /**
   * Genera una URL prefirmada para subir (PUT) directamente a R2.
   * Devuelve la "key" definitiva del objeto, que es lo que se persiste en la BD.
   */
  async createUploadUrl(input: {
    folder: string;
    filename: string;
    contentType: string;
  }): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
    const folder = this.assertFolder(input.folder);
    const contentType = input.contentType?.toLowerCase().trim();

    if (!contentType || !ALLOWED_CONTENT_TYPES[contentType]) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo preparar la carga del archivo",
        errors: [
          "Tipo de archivo no permitido. Solo se aceptan PDF, JPG, PNG o WEBP",
        ],
      });
    }

    const key = `${folder}/${randomUUID()}-${this.sanitizeFilename(input.filename)}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );

    return { key, uploadUrl, expiresIn: UPLOAD_URL_TTL_SECONDS };
  }

  /**
   * Genera una URL prefirmada para ver/descargar (GET) un objeto privado.
   */
  async createDownloadUrl(
    key: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const safeKey = this.assertKey(key);

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: safeKey }),
      { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
    );

    return { url, expiresIn: DOWNLOAD_URL_TTL_SECONDS };
  }

  /**
   * Borra un objeto del bucket. Es "best-effort": si falla no interrumpe el
   * flujo principal (p. ej. al reemplazar un documento), solo se registra.
   */
  async deleteObject(key: string | null | undefined): Promise<void> {
    if (!key) return;
    try {
      const safeKey = this.assertKey(key);
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: safeKey }),
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo borrar el objeto '${key}' de R2: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private assertFolder(folder: string): StorageFolder {
    if ((STORAGE_FOLDERS as readonly string[]).includes(folder)) {
      return folder as StorageFolder;
    }
    throw new BadRequestException({
      success: false,
      message: "No se pudo preparar la carga del archivo",
      errors: [`Carpeta de almacenamiento no valida: '${folder}'`],
    });
  }

  // Solo permitimos operar sobre keys dentro de las carpetas conocidas y sin
  // saltos de ruta ("..") para no exponer otros objetos del bucket.
  private assertKey(key: string): string {
    const trimmed = (key ?? "").trim();
    const isKnownFolder = (STORAGE_FOLDERS as readonly string[]).some(
      (folder) => trimmed.startsWith(`${folder}/`),
    );

    if (!trimmed || trimmed.includes("..") || !isKnownFolder) {
      throw new BadRequestException({
        success: false,
        message: "No se pudo acceder al archivo",
        errors: ["La referencia del archivo no es valida"],
      });
    }

    return trimmed;
  }

  private sanitizeFilename(filename: string): string {
    const base = (filename ?? "archivo").split(/[\\/]/).pop() ?? "archivo";
    const cleaned = base
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+/, "")
      .slice(0, 80);
    return cleaned || "archivo";
  }
}
