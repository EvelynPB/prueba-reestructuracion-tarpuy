import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ResultadosApp from './ResultadosApp.jsx';
import '../index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ResultadosApp />
  </StrictMode>,
);
