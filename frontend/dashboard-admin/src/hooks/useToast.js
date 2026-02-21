import { useState, useCallback, useRef } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef({});

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    timeoutsRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete timeoutsRef.current[id];
    }, 3500);
  }, []);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error:   (message) => addToast(message, 'error'),
    warning: (message) => addToast(message, 'warning'),
    info:    (message) => addToast(message, 'info'),
  };

  return { toasts, toast };
}
