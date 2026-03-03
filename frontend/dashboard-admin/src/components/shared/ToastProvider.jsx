// ============================================================
// ToastProvider.jsx — Provider global de notificações toast
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React, { createContext, useContext } from 'react';
import { useToast } from '../../hooks/useToast';
import Toast from './Toast';

const ToastContext = createContext(null);

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext deve ser usado dentro de ToastProvider');
  return ctx;
};

export default function ToastProvider({ children }) {
  const { toasts, toast } = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toast toasts={toasts} />
    </ToastContext.Provider>
  );
}
