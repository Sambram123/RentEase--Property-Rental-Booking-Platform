import { useState, useEffect, useCallback, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80';

// ─── Normalise image list: supports {url,public_id} objects OR plain strings ──
const normaliseImages = (images) => {
  if (!images?.length) return [PLACEHOLDER];
  return images.map((img) => {
    if (typeof img === 'string') return img;
    return img.url || PLACEHOLDER;
  });
};

// ─── ImageCarousel ────────────────────────────────────────────────────────────
// Props:
//   images   – [{url,public_id}] or [string] or []
//   title    – property title (for alt text)
//   className – additional classes on the wrapper
//
const ImageCarousel = ({ images, title = 'Property', className = '' }) => {
  const urls = normaliseImages(images);
  const total = urls.length;

  const [active, setActive]       = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const touchStartX = useRef(null);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((idx, dir = 1) => {
    if (animating || idx === active) return;
    setDirection(dir);
    setAnimating(true);
    setActive(idx);
    setTimeout(() => setAnimating(false), 400);
  }, [animating, active]);

  const prev = useCallback(() => {
    const idx = (active - 1 + total) % total;
    goTo(idx, -1);
  }, [active, total, goTo]);

  const next = useCallback(() => {
    const idx = (active + 1) % total;
    goTo(idx, 1);
  }, [active, total, goTo]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  // ── Touch / swipe support ──────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  // ── Error fallback per image ───────────────────────────────────────────────
  const onImgError = (e) => { e.currentTarget.src = PLACEHOLDER; };

  return (
    <div className={`relative w-full select-none overflow-hidden rounded-2xl shadow-md ${className}`}>

      {/* ── Main image ─────────────────────────────────────────────────────── */}
      <div
        className="relative aspect-[16/9] w-full bg-gray-100"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {urls.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`${title} — photo ${idx + 1} of ${total}`}
            loading={idx === 0 ? 'eager' : 'lazy'}
            onError={onImgError}
            className={`
              absolute inset-0 h-full w-full object-cover
              transition-all duration-400 ease-in-out
              ${idx === active
                ? 'opacity-100 translate-x-0 z-10'
                : idx < active
                  ? `opacity-0 -translate-x-full z-0`
                  : `opacity-0 translate-x-full z-0`
              }
            `}
            style={{ transitionProperty: 'opacity, transform' }}
          />
        ))}

        {/* ── Prev / Next buttons ─────────────────────────────────────────── */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* ── Image counter badge ─────────────────────────────────────────── */}
        {total > 1 && (
          <span className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {active + 1} / {total}
          </span>
        )}
      </div>

      {/* ── Line indicators ─────────────────────────────────────────────────── */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 px-4 pt-2.5 pb-1">
          {urls.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Go to image ${idx + 1}`}
              onClick={() => goTo(idx, idx > active ? 1 : -1)}
              className={`
                h-1 rounded-full transition-all duration-300 focus:outline-none
                ${idx === active
                  ? 'w-8 bg-primary'
                  : 'w-5 bg-gray-300 hover:bg-gray-400'
                }
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
