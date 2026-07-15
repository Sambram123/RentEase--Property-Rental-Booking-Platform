import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
  secure:      true,
});

// ─── Upload a single image buffer to Cloudinary ───────────────────────────────
// Returns: { url, public_id }
export const uploadImage = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:         'RentEase/Properties',
        resource_type:  'image',
        quality:        'auto',
        fetch_format:   'auto',
        // Responsive breakpoints for optimization
        responsive_breakpoints: [
          {
            create_derived: true,
            bytes_step: 20000,
            min_width: 200,
            max_width: 1200,
            max_images: 5,
          },
        ],
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({
          url:       result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    // Pipe buffer into the upload stream
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Delete an image from Cloudinary by public_id ─────────────────────────────
export const deleteImage = async (public_id) => {
  if (!public_id) return;
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
  } catch (err) {
    // Log but don't throw — deletion failure shouldn't block other operations
    console.error(`Cloudinary delete failed for ${public_id}:`, err.message);
  }
};

// ─── Upload multiple image buffers concurrently ────────────────────────────────
// Returns: [{ url, public_id }, ...]
export const uploadImages = async (files) => {
  const uploads = files.map((file) => uploadImage(file.buffer, file.mimetype));
  return Promise.all(uploads);
};

// ─── Delete multiple images concurrently ─────────────────────────────────────
export const deleteImages = async (publicIds) => {
  if (!publicIds?.length) return;
  await Promise.allSettled(publicIds.map(deleteImage));
};

export default cloudinary;
