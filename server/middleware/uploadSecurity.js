// ─────────────────────────────────────────────────────────────────────────────
// File Upload Security Middleware
// Validates MIME types and file sizes for image uploads (base64 data URIs)
// ─────────────────────────────────────────────────────────────────────────────

// Allowed MIME types for property/avatar images
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

// Max sizes
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;         // 2 MB
const MAX_PROPERTY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validate a base64 image submission in request body.
 * Checks MIME type and estimated byte size to prevent oversized payloads.
 *
 * @param {number} maxBytes - Maximum allowed size in bytes
 */
export const validateImagePayload = (maxBytes = MAX_PROPERTY_IMAGE_SIZE_BYTES) => {
  return (req, res, next) => {
    try {
      const { image, avatar, images } = req.body;

      const payloadsToCheck = [];
      if (image) payloadsToCheck.push(image);
      if (avatar) payloadsToCheck.push(avatar);
      if (Array.isArray(images)) payloadsToCheck.push(...images);

      for (const payload of payloadsToCheck) {
        if (typeof payload !== 'string') continue;

        // Only validate base64 data URIs
        if (!payload.startsWith('data:')) continue;

        // Check MIME type
        const mimeMatch = payload.match(/^data:([^;]+);base64,/);
        if (!mimeMatch) {
          res.status(400);
          throw new Error('Invalid image format — must be a valid data URI');
        }

        const mime = mimeMatch[1].toLowerCase();
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
          res.status(415);
          throw new Error(
            `Unsupported image type: ${mime}. Allowed: JPEG, PNG, WebP, GIF`
          );
        }

        // Estimate base64 size → actual byte size
        const base64Data = payload.split(',')[1] || '';
        const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
        if (estimatedBytes > maxBytes) {
          res.status(413);
          throw new Error(
            `Image too large (${(estimatedBytes / 1024 / 1024).toFixed(1)}MB). ` +
            `Maximum allowed: ${(maxBytes / 1024 / 1024).toFixed(0)}MB`
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Avatar-specific upload validator (2 MB limit)
 */
export const validateAvatarUpload = validateImagePayload(MAX_AVATAR_SIZE_BYTES);

/**
 * Property image upload validator (5 MB per image limit)
 */
export const validatePropertyImageUpload = validateImagePayload(MAX_PROPERTY_IMAGE_SIZE_BYTES);
