import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useSmartBack(fallbackPath: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // React Router stores current stack index in history.state.idx.
    // Only go back when there is an in-tab stack entry to return to.
    const idx = typeof window.history.state?.idx === 'number' ? window.history.state.idx : -1;
    if (location.key === 'default' || idx <= 0) {
      navigate(fallbackPath, { replace: true });
      return;
    }
    navigate(-1);
  }, [fallbackPath, location.key, navigate]);
}
