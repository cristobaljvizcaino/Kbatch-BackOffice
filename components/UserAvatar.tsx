import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const UserAvatar: React.FC = () => {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded bg-slate-600 animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
      >
        <User className="h-4 w-4" />
        Iniciar sesión
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(prev => !prev)}
        className="h-8 w-8 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
        title={user.name}
      >
        {user.initials}
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
