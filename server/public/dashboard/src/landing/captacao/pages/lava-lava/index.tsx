import React from 'react';
import { Hero, LeadForm, Benefits, Investment, Process, Footer } from '../../components/lava-lava';
import { lavaLavaConfig } from '../../config';

export const LavaLavaPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Benefits />
      <Investment />
      <Process />
      <LeadForm 
        marcaId={lavaLavaConfig.marcaId} 
        tipoLeadId={lavaLavaConfig.tipoLeadId} 
      />
      <Footer />
    </div>
  );
};
