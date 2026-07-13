/**
 * Client-side image resize + JPEG compress so large phone photos
 * upload cleanly without blocking report submission.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImageFile(
  file: File,
  options?: { maxEdge?: number; quality?: number }
): Promise<File> {
  // Non-images or HEIC (canvas may not decode) — pass through
  if (!file.type.startsWith('image/')) return file;
  if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') {
    return file;
  }

  const maxEdge = options?.maxEdge ?? MAX_EDGE;
  const quality = options?.quality ?? JPEG_QUALITY;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    // Already small enough and under ~1.5MB JPEG/PNG — keep original
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );

    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'report-photo';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn('Image compress failed, using original file:', err);
    return file;
  }
}
