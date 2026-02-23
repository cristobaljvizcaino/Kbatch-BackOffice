import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import LoginGate from './auth/LoginGate';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LoginGate>
        <App />
      </LoginGate>
    </AuthProvider>
  </React.StrictMode>
);