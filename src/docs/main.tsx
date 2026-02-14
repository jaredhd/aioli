import React from 'react';
import ReactDOM from 'react-dom/client';
import Docs from './Docs';

// Load the full Aioli CSS bundle (tokens + base reset + all 31 components)
import '../../css/aioli.css';

// Docs-specific layout styles
import './docs.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Docs />
  </React.StrictMode>
);
