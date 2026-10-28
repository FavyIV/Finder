import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { AppError } from '../../errors/app-error';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads an image buffer directly to Cloudinary.
 * Returns the secure CDN URL of the uploaded image.
 * This is the ONLY module in the entire codebase that communicates with Cloudinary.
 */
export async function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'campus-lost-and-found',
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError('IMAGE_UPLOAD_FAILED', 'Failed to upload image to storage service.', 500),
          );
          return;
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(buffer);
  });
}
