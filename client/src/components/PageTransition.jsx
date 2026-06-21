import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — wraps page content with a smooth fade-slide animation
 * on route changes for an app-like feel
 */
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (location.pathname !== key) {
      setAnimating(true);
      const t = setTimeout(() => {
        setKey(location.pathname);
        setAnimating(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [location.pathname, key]);

  return (
    <div
      style={{
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
