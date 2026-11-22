import multer from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
});

/**
 * Middleware wrapper for single file upload with standard error handling.
 * @param {string} fieldName - Form field name (default 'image')
 */
export function uploadSingleImage(fieldName = 'image') {
  const single = upload.single(fieldName);

  return (req, res, next) => {
    single(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              error: 'FILE_TOO_LARGE',
              message: 'Image size exceeds maximum limit of 10MB.'
            });
          }
          return res.status(400).json({
            success: false,
            error: 'UPLOAD_ERROR',
            message: err.message
          });
        }
        if (err.code === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            success: false,
            error: 'INVALID_FILE_TYPE',
            message: err.message
          });
        }
        return res.status(400).json({
          success: false,
          error: 'UPLOAD_ERROR',
          message: err.message || 'Error uploading file.'
        });
      }
      return next();
    });
  };
}

export default uploadSingleImage;
