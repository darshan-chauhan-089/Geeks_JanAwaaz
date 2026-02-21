import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }    from '@context/AuthContext';
import { LoadingProvider } from '@context/LoadingContext';
import { ToastProvider }   from '@context/ToastContext';
import ToastContainer      from '@components/common/Toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <LoadingProvider>
          <AuthProvider>
            <App />
            <ToastContainer />
          </AuthProvider>
        </LoadingProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
