/**
 * CivicLens Media Storage Service - Cloudinary Integration
 * Uploads complaint images using Cloudinary upload_stream with safe local file fallback.
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Fallback upload directory for development or when Cloudinary is unavailable
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

/**
 * Configure Cloudinary with environment variables
 */
function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
      secure: true
    });
  }
}

// Initial configuration attempt
configureCloudinary();

/**
 * Checks whether valid Cloudinary credentials have been provided.
 */
export function isCloudinaryConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    cloudName !== 'your_cloud_name' &&
    apiKey !== 'your_cloudinary_api_key' &&
    apiSecret !== 'your_cloudinary_api_secret'
  );
}

/**
 * Resolves an appropriate file extension from MIME type or original filename.
 */
function resolveFileExtension(mimeType, filename) {
  if (filename && path.extname(filename)) {
    return path.extname(filename).toLowerCase();
  }
  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/svg+xml':
      return '.svg';
    case 'image/jpeg':
    case 'image/jpg':
    default:
      return '.jpg';
  }
}

/**
 * Stores image buffer locally as a fallback when Cloudinary is unavailable.
 * Ensures the citizen's complaint submission succeeds and image is preserved.
 */
function saveLocalFallback({ buffer, mimeType, filename }) {
  try {
    if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
      fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
    }

    const ext = resolveFileExtension(mimeType, filename);
    const uniqueBase = `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const savedFilename = `${uniqueBase}${ext}`;
    const destinationPath = path.join(LOCAL_UPLOADS_DIR, savedFilename);

    fs.writeFileSync(destinationPath, buffer);

    return {
      imageUrl: `/uploads/${savedFilename}`,
      publicId: `local_${uniqueBase}`
    };
  } catch (err) {
    console.error(`[CivicLens Storage] Failed to write local fallback file: ${err.message}`);
    // Safe placeholder fallback
    return {
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      publicId: `placeholder_${Date.now()}`
    };
  }
}

/**
 * Uploads an image buffer to Cloudinary under folder 'civiclens/complaints'.
 * If Cloudinary is not configured or an upload error occurs, smoothly falls back
 * to local storage so that complaints are never lost.
 *
 * @param {Object} params
 * @param {Buffer|Uint8Array} params.buffer - In-memory image buffer
 * @param {Buffer|Uint8Array} [params.imageBuffer] - Alias for buffer
 * @param {string} [params.mimeType='image/jpeg'] - MIME type of the image
 * @param {string} [params.filename] - Original filename
 * @param {number} [params.timeoutMs=15000] - Upload timeout in milliseconds
 *
 * @returns {Promise<{ imageUrl: string|null, publicId: string|null }>}
 */
export async function uploadComplaintImage({
  buffer,
  imageBuffer,
  mimeType = 'image/jpeg',
  filename,
  timeoutMs = 15000
} = {}) {
  // Support either buffer or imageBuffer parameter name
  const rawBuffer = buffer || imageBuffer;

  // If no buffer provided (text-only complaint), return null
  if (!rawBuffer || !(Buffer.isBuffer(rawBuffer) || rawBuffer instanceof Uint8Array)) {
    return { imageUrl: null, publicId: null };
  }

  const fileBuffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawBuffer);

  // Fallback if Cloudinary is not configured
  if (!isCloudinaryConfigured()) {
    console.warn('[CivicLens Storage] Cloudinary credentials not configured. Saving image using local fallback.');
    return saveLocalFallback({ buffer: fileBuffer, mimeType, filename });
  }

  // Ensure Cloudinary is configured with latest process.env values
  configureCloudinary();

  return new Promise((resolve) => {
    let finished = false;

    // Timeout guard to prevent hanging requests
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.error(`[CivicLens Storage] Cloudinary upload timed out after ${timeoutMs}ms. Using local fallback.`);
        resolve(saveLocalFallback({ buffer: fileBuffer, mimeType, filename }));
      }
    }, timeoutMs);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'civiclens/complaints',
        resource_type: 'image',
        filename_override: filename ? path.parse(filename).name : undefined,
        use_filename: Boolean(filename)
      },
      (error, result) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        if (error || !result) {
          console.error(`[CivicLens Storage] Cloudinary upload failed: ${error?.message || 'Unknown error'}. Using local fallback.`);
          resolve(saveLocalFallback({ buffer: fileBuffer, mimeType, filename }));
        } else {
          resolve({
            imageUrl: result.secure_url || result.url,
            publicId: result.public_id
          });
        }
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      console.error(`[CivicLens Storage] Stream error during upload: ${err.message}. Using local fallback.`);
      resolve(saveLocalFallback({ buffer: fileBuffer, mimeType, filename }));
    });

    stream.pipe(uploadStream);
  });
}

export default {
  uploadComplaintImage,
  isCloudinaryConfigured
};
