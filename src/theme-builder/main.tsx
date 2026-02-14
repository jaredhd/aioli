import React from 'react';
import ReactDOM from 'react-dom/client';
import ThemeBuilder from './ThemeBuilder';

import '../../css/aioli.css';
import './theme-builder.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeBuilder />
  </React.StrictMode>
);
