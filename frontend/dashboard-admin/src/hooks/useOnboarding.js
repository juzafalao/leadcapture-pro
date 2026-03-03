// ============================================================
// useOnboarding.js — Hook para estado do Onboarding Wizard
// LeadCapture Pro — Zafalão Tech
// ============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';

const ONBOARDING_KEY = 'lcp_onboarding_completed';

export function useOnboarding() {
  const { usuario, tenant } = useAuth();
  const [completed, setCompleted] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === 'true'
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState({});

  const markCompleted = useCallback(async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setCompleted(true);
    // Optionally persist to DB
    if (usuario?.id) {
      await supabase
        .from('usuarios')
        .update({ onboarding_completed: true })
        .eq('id', usuario.id)
        .then(() => {})
        .catch((err) => { console.error('[Onboarding] Erro ao persistir conclusão:', err); });
    }
  }, [usuario?.id]);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setCompleted(false);
    setCurrentStep(0);
    setStepData({});
  }, []);

  const updateStepData = useCallback((step, data) => {
    setStepData(prev => ({ ...prev, [step]: data }));
  }, []);

  const nextStep = useCallback((totalSteps) => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const shouldShowOnboarding = !completed && !!usuario;

  return {
    completed,
    currentStep,
    stepData,
    shouldShowOnboarding,
    markCompleted,
    resetOnboarding,
    updateStepData,
    nextStep,
    prevStep,
  };
}
