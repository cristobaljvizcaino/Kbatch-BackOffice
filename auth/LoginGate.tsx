import React from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from './AuthContext';

const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Activity className="h-10 w-10 text-blue-500 animate-pulse" />
        <p className="text-slate-500 text-sm">Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 gap-8">
        <div className="flex items-center gap-3">
          <Activity className="h-10 w-10 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-wide">KBATCH</h1>
            <p className="text-xs text-slate-400">Portal Backoffice</p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8 w-full max-w-sm text-center shadow-2xl">
          <h2 className="text-white text-lg font-semibold mb-2">Acceso requerido</h2>
          <p className="text-slate-400 text-sm mb-6">
            Inicia sesión con tu cuenta corporativa de Microsoft para continuar.
          </p>
          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Iniciar sesión con Microsoft
          </button>
        </div>

        <p className="text-slate-600 text-xs">
          Protegido por Microsoft Azure AD
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoginGate;
