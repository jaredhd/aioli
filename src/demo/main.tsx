import React from 'react';
import ReactDOM from 'react-dom/client';
import Demo from './Demo';

// Load the full Aioli CSS bundle (tokens + base reset + all 31 components)
import '../../css/aioli.css';

// Gallery-specific layout styles
import './demo.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Demo />
  </React.StrictMode>
);
