// ============================================================
// OnboardingWizard.jsx — Wizard de Onboarding Inicial
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../hooks/useOnboarding';
import StepBemVindo from './steps/StepBemVindo';
import StepPerfil from './steps/StepPerfil';
import StepIntegracao from './steps/StepIntegracao';
import StepConclusao from './steps/StepConclusao';

const STEPS = ['Boas-vindas', 'Perfil', 'Integração', 'Concluído'];

export default function OnboardingWizard() {
  const {
    shouldShowOnboarding,
    currentStep,
    stepData,
    markCompleted,
    updateStepData,
    nextStep,
    prevStep,
  } = useOnboarding();

  if (!shouldShowOnboarding) return null;

  const handleNext = (data) => {
    if (data) updateStepData(currentStep, data);
    nextStep(STEPS.length);
  };

  const handleBack = () => prevStep();
  const handleFinish = () => markCompleted();

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((step, i) => (
            <div key={step} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1 w-full rounded-full transition-colors duration-300 ${
                  i <= currentStep ? 'bg-[#10B981]' : 'bg-white/10'
                }`}
              />
              <span className={`text-[9px] font-semibold uppercase tracking-wider transition-colors ${
                i === currentStep ? 'text-[#10B981]' : 'text-[#334155]'
              }`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <StepBemVindo onNext={handleNext} />
            )}
            {currentStep === 1 && (
              <StepPerfil
                data={stepData[1]}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 2 && (
              <StepIntegracao
                data={stepData[2]}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <StepConclusao onFinish={handleFinish} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip button */}
        {currentStep < STEPS.length - 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={markCompleted}
              className="text-xs text-[#334155] hover:text-[#475569] transition-colors"
            >
              Pular onboarding
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
