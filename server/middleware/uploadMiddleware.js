import multer from 'multer';

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// ─── Magic bytes for MIME verification (don't trust extension alone) ──────────
const MAGIC_BYTES = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/png':  [
    [0x89, 0x50, 0x4e, 0x47],
  ],
  'image/webp': [
    // RIFF????WEBP
    null, // checked separately below
  ],
};

const verifyMagicBytes = (buffer, mimetype) => {
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 &&
           buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimetype === 'image/webp') {
    // RIFF at 0-3 and WEBP at 8-11
    const riff = buffer.slice(0, 4).toString('ascii') === 'RIFF';
    const webp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
    return riff && webp;
  }
  return false;
};

// ─── File filter — reject non-images immediately ──────────────────────────────
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(`Invalid file type "${file.mimetype}". Only JPG, PNG, and WEBP are allowed.`),
      false
    );
  }
  cb(null, true);
};

// ─── Multer instance — memory storage (buffers sent to Cloudinary) ────────────
const upload = multer({
  storage:  multer.memoryStorage(),
  limits:   {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files:    10,              // max 10 images
  },
  fileFilter,
});

// ─── Middleware: validate actual file contents after multer parses them ────────
export const validateImageBuffers = (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  for (const file of req.files) {
    if (!verifyMagicBytes(file.buffer, file.mimetype)) {
      res.status(400);
      return next(
        new Error(`File "${file.originalname}" failed content validation. Possibly a disguised executable.`)
      );
    }
  }
  next();
};

// ─── Export configured multer upload handler ─────────────────────────────────
// Usage in routes: upload.array('images', 10)
export default upload;
