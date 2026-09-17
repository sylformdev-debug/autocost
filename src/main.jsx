import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Polices auto-hébergées : aucune requête vers un domaine tiers, rendu
// identique hors ligne et pas de CSS externe bloquant.
import '@fontsource-variable/inter/wght.css';
import '@fontsource/instrument-serif/latin-400.css';

import './styles/base.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
