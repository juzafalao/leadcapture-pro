import { LavaLavaPage } from './pages/lava-lava';
import { ABCEscolaPage } from './pages/abc-escola';
import { AzulFitnessPage } from './pages/azul-fitness';

export const landingRoutes = [
  { path: '/captacao/lava-lava', element: <LavaLavaPage /> },
  { path: '/captacao/abc-escola', element: <ABCEscolaPage /> },
  { path: '/captacao/azul-fitness', element: <AzulFitnessPage /> },
];
