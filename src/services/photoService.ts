import { db } from '../database/db';
import { MemberPhotoRecord, BackupPhotoItem } from '../types';

// Max file size: 5MB
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Resizes an image file or blob using Canvas to max width/height with target quality.
 * Prevents storage bloat and provides blazing fast IndexedDB reads.
 */
export async function resizeImageToBlob(
  fileOrBlob: Blob | File,
  maxWidth: number,
  maxHeight: number,
  mimeType: 'image/jpeg' | 'image/webp' = 'image/jpeg',
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.max(1, Math.round(width * ratio));
        height = Math.max(1, Math.round(height * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing'));
    };

    img.src = url;
  });
}

/**
 * Process uploaded photo file:
 * - Validates file size (max 5MB)
 * - Validates MIME type (jpeg, png, webp)
 * - Resizes full photo (max 600x600)
 * - Generates thumbnail (max 150x150)
 */
export async function processUploadedPhoto(file: File): Promise<{
  fullBlob: Blob;
  thumbnailBlob: Blob;
  mimeType: string;
}> {
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    throw new Error('Image exceeds 5 MB limit. Please select a photo under 5 MB.');
  }

  const fileType = file.type.toLowerCase();
  const isValidType = ALLOWED_IMAGE_TYPES.includes(fileType) || 
    file.name.match(/\.(jpe?g|png|webp)$/i);

  if (!isValidType) {
    throw new Error('Unsupported image format. Please upload JPG, PNG, or WebP.');
  }

  // Create full size optimized photo (max 600x600)
  const fullBlob = await resizeImageToBlob(file, 600, 600, 'image/jpeg', 0.85);

  // Create thumbnail (max 150x150)
  const thumbnailBlob = await resizeImageToBlob(fullBlob, 150, 150, 'image/jpeg', 0.8);

  return {
    fullBlob,
    thumbnailBlob,
    mimeType: 'image/jpeg',
  };
}

/**
 * Save member photo into IndexedDB (db.memberPhotos)
 */
export async function saveMemberPhoto(
  memberId: string,
  blob: Blob,
  thumbnailBlob?: Blob,
  mimeType: string = 'image/jpeg'
): Promise<void> {
  try {
    const record: MemberPhotoRecord = {
      memberId,
      blob,
      thumbnailBlob: thumbnailBlob || blob,
      mimeType,
      size: blob.size,
      updatedAt: new Date().toISOString(),
    };
    await db.memberPhotos.put(record);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded on your device. Please free up browser storage space.');
    }
    throw err;
  }
}

/**
 * Delete member photo from IndexedDB
 */
export async function deleteMemberPhoto(memberId: string): Promise<void> {
  try {
    await db.memberPhotos.delete(memberId);
  } catch (err) {
    console.error('Failed to delete member photo:', err);
  }
}

/**
 * Get member photo record from IndexedDB
 */
export async function getMemberPhoto(memberId: string): Promise<MemberPhotoRecord | undefined> {
  try {
    return await db.memberPhotos.get(memberId);
  } catch (err) {
    console.error('Failed to load member photo:', err);
    return undefined;
  }
}

/**
 * Convert Blob to Base64 Data URL (for backup)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to Base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 Data URL to Blob (for restore)
 */
export function base64ToBlob(dataUrl: string, defaultMime = 'image/jpeg'): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : defaultMime;
  const base64Data = parts.length > 1 ? parts[1] : parts[0];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
