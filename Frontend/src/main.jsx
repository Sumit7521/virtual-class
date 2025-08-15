import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router';

// // Keep your keyboard listeners
// window.keyState = {};
// document.addEventListener('keydown', (e) => (window.keyState[e.key] = true));
// document.addEventListener('keyup', (e) => (window.keyState[e.key] = false));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Router wraps App */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
