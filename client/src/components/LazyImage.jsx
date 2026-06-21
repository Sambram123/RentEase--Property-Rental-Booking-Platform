import { useState, useRef, useEffect } from 'react';

/**
 * LazyImage — loads images only when they enter the viewport
 * Supports blur-up effect and fallback placeholder
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  fallback = null,
  eager = false,
  onLoad,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(eager);
  const imgRef = useRef(null);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (eager || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Pre-load 200px before entering viewport
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [eager]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  return (
    <div ref={!eager ? imgRef : undefined} className={`relative overflow-hidden ${placeholderClassName}`}>
      {/* Shimmer placeholder */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]" />
      )}

      {/* Actual image */}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          {...rest}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {fallback || (
            <div className="text-center">
              <span className="text-3xl">🏠</span>
              <p className="mt-1 text-xs text-muted">Image unavailable</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LazyImage;
