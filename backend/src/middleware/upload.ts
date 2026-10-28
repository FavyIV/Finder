import multer from 'multer';
import type { Request, RequestHandler } from 'express';
import { MAX_PHOTO_SIZE_BYTES, ALLOWED_PHOTO_TYPES } from '../config/constants';
import { AppError } from '../errors/app-error';

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const isAllowed = ALLOWED_PHOTO_TYPES.includes(
    file.mimetype as (typeof ALLOWED_PHOTO_TYPES)[number],
  );

  if (!isAllowed) {
    callback(
      new AppError(
        'INVALID_FILE_TYPE',
        'Only JPEG, JPG, and PNG images are permitted for item photos.',
        400,
      ),
    );
    return;
  }

  callback(null, true);
}

export const uploadSinglePhoto: RequestHandler = multer({
  storage,
  limits: {
    fileSize: MAX_PHOTO_SIZE_BYTES,
  },
  fileFilter,
}).single('photo');
