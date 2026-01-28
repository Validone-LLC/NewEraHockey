import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@utils/analytics';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'smooth' for animated scroll
    });
    trackPageView(pathname);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
