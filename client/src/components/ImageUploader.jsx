import { useState, useRef, useCallback } from 'react';
import { FiUploadCloud, FiX, FiImage, FiAlertCircle } from 'react-icons/fi';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS  = '.jpg,.jpeg,.png,.webp';

// ─── ImageUploader component ──────────────────────────────────────────────────
// Props:
//   newFiles        – File[] (state in parent, new files to upload)
//   onNewFilesChange – fn(File[]) → setter
//   existingImages  – [{ url, public_id }] from Cloudinary (for edit flow)
//   onExistingChange – fn([{ url, public_id }]) → setter (for edit flow)
//   error           – validation error string from parent
//
const ImageUploader = ({
  newFiles = [],
  onNewFilesChange,
  existingImages = [],
  onExistingChange,
  error,
}) => {
  const fileInputRef   = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState([]);

  const totalCount = existingImages.length + newFiles.length;

  // ── Validate and add files ─────────────────────────────────────────────────
  const addFiles = useCallback((rawFiles) => {
    const errs = [];
    const valid = [];

    for (const file of rawFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errs.push(`"${file.name}" — invalid type. Only JPG, PNG, WEBP allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errs.push(`"${file.name}" — exceeds ${MAX_SIZE_MB}MB limit.`);
        continue;
      }
      // Prevent duplicate files by name + size
      const isDuplicate =
        newFiles.some((f) => f.name === file.name && f.size === file.size);
      if (isDuplicate) continue;

      valid.push(file);
    }

    setFileErrors(errs);

    if (valid.length === 0) return;

    const newTotal = totalCount + valid.length;
    const canAdd   = Math.min(valid.length, MAX_FILES - totalCount);

    if (newTotal > MAX_FILES) {
      setFileErrors((prev) => [
        ...prev,
        `Maximum ${MAX_FILES} images allowed. ${valid.length - canAdd} file(s) skipped.`,
      ]);
    }

    if (canAdd > 0) {
      onNewFilesChange([...newFiles, ...valid.slice(0, canAdd)]);
    }
  }, [newFiles, totalCount, onNewFilesChange]);

  // ── Remove a new (not yet uploaded) file ──────────────────────────────────
  const removeNewFile = (index) => {
    const updated = newFiles.filter((_, i) => i !== index);
    onNewFilesChange(updated);
    setFileErrors([]);
  };

  // ── Remove an existing Cloudinary image ───────────────────────────────────
  const removeExisting = (public_id) => {
    if (!onExistingChange) return;
    onExistingChange(existingImages.filter((img) => img.public_id !== public_id));
  };

  // ── Drag events ───────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const hasImages = totalCount > 0;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        aria-label="Upload property images"
        className={`
          relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed
          px-6 py-10 text-center cursor-pointer transition-all select-none
          ${dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : error
              ? 'border-red-300 bg-red-50/50 hover:border-red-400'
              : 'border-gray-200 bg-gray-50/50 hover:border-primary hover:bg-primary/3'
          }
        `}
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition ${dragging ? 'bg-primary/15' : 'bg-gray-100'}`}>
          <FiUploadCloud className={`h-7 w-7 transition ${dragging ? 'text-primary' : 'text-gray-400'}`} />
        </div>
        <div>
          <p className="text-sm font-semibold text-secondary">
            {dragging ? 'Drop images here' : 'Drag & drop images here'}
          </p>
          <p className="mt-1 text-xs text-muted">
            or{' '}
            <span className="font-semibold text-primary underline underline-offset-2">browse files</span>
            {' '}from your device
          </p>
          <p className="mt-2 text-[11px] text-muted">
            JPG, PNG, WEBP · Up to {MAX_FILES} images · Max {MAX_SIZE_MB}MB each
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTS}
          onChange={onFileChange}
          className="sr-only"
          aria-hidden="true"
        />
      </div>

      {/* Validation errors */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {fileErrors.length > 0 && (
        <ul className="space-y-1">
          {fileErrors.map((err, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
              <FiAlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {/* Image preview grid */}
      {hasImages && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            {totalCount} / {MAX_FILES} image{totalCount !== 1 ? 's' : ''} selected
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">

            {/* Existing Cloudinary images */}
            {existingImages.map((img, idx) => (
              <div key={img.public_id || idx} className="group relative aspect-square">
                <img
                  src={img.url}
                  alt={`Existing property image ${idx + 1}`}
                  loading="lazy"
                  className="h-full w-full rounded-xl object-cover shadow-sm ring-2 ring-transparent transition group-hover:ring-primary/30"
                />
                {/* First image badge */}
                {idx === 0 && existingImages.length + newFiles.length > 0 && (
                  <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeExisting(img.public_id)}
                  aria-label="Remove image"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition hover:bg-red-600 group-hover:opacity-100"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* New local files (previews) */}
            {newFiles.map((file, idx) => {
              const src = URL.createObjectURL(file);
              const globalIdx = existingImages.length + idx;
              return (
                <div key={`new-${idx}`} className="group relative aspect-square">
                  <img
                    src={src}
                    alt={`New image ${idx + 1}`}
                    className="h-full w-full rounded-xl object-cover shadow-sm ring-2 ring-primary/20 transition group-hover:ring-primary/50"
                    onLoad={() => URL.revokeObjectURL(src)}
                  />
                  {/* First image cover badge */}
                  {globalIdx === 0 && (
                    <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Cover
                    </span>
                  )}
                  {/* New badge */}
                  <span className="absolute left-1 top-1 rounded-md bg-primary/80 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewFile(idx)}
                    aria-label="Remove image"
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition hover:bg-red-600 group-hover:opacity-100"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            {/* Add more slot (if under limit) */}
            {totalCount < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add more images"
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-primary hover:bg-primary/3 hover:text-primary"
              >
                <FiImage className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
