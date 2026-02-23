import React from 'react';

export default function LoadingSpinner({ message = 'Carregando', fullScreen = true }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      {message && (
        <span className="text-[#94A3B8] text-sm">{message}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-32">
      {content}
    </div>
  );
}
