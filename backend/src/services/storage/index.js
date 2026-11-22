/**
 * CivicLens Media Storage Services
 * Public module exports for file and image uploads.
 */

export {
  uploadComplaintImage,
  isCloudinaryConfigured
} from './cloudinaryService.js';

import { uploadComplaintImage } from './cloudinaryService.js';

export default {
  uploadComplaintImage
};
