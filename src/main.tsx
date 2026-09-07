import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// --- Temporary error catcher ---
window.onerror = (msg, src, line, col, err) => {
  document.getElementById('root')!.innerHTML =
    '<pre style="color:red;white-space:pre-wrap;padding:16px;font-family:monospace">'
    + 'ERROR: ' + msg + '\n' + (err && err.stack ? err.stack : src + ':' + line + ':' + col)
    + '</pre>';
};
window.addEventListener('unhandledrejection', (e) => {
  document.getElementById('root')!.innerHTML =
    '<pre style="color:red;white-space:pre-wrap;padding:16px;font-family:monospace">'
    + 'Unhandled Promise: ' + (e.reason?.stack || e.reason)
    + '</pre>';
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e: any) {
  document.getElementById('root')!.innerHTML =
    '<pre style="color:red;white-space:pre-wrap;padding:16px;font-family:monospace">'
    + 'Render error: ' + e?.message + '\n' + e?.stack
    + '</pre>';
}
