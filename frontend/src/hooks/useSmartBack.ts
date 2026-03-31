import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useSmartBack(fallbackPath: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // Direct-open pages usually have key "default"; in this case use fallback route.
    if (location.key === 'default' || window.history.length <= 1) {
      navigate(fallbackPath, { replace: true });
      return;
    }
    navigate(-1);
  }, [fallbackPath, location.key, navigate]);
}

