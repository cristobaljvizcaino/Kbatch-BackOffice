import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, MoreVertical } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface UserAvatarProps {
  variant?: 'sidebar' | 'collapsed' | 'topbar';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ variant = 'topbar' }) => {
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
      <div className="kds-sidebar__user" style={{ opacity: 0.5 }}>
        <div className="kds-sidebar__user-avatar" style={{ background: 'var(--color-gray-600)' }}>
          <div className="w-4 h-4 rounded bg-white/20 animate-pulse" />
        </div>
        {variant === 'sidebar' && (
          <div className="kds-sidebar__user-info">
            <div className="h-3 w-24 rounded" style={{ background: 'var(--color-gray-700)' }} />
            <div className="h-2 w-32 rounded mt-1.5" style={{ background: 'var(--color-gray-700)' }} />
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="kds-sidebar__user" onClick={login} style={{ cursor: 'pointer' }}>
        <div className="kds-sidebar__user-avatar" style={{ background: 'var(--color-gray-600)' }}>
          <User className="h-4 w-4 text-white" />
        </div>
        {variant === 'sidebar' && (
          <div className="kds-sidebar__user-info">
            <div className="kds-sidebar__user-name">Iniciar sesión</div>
            <div className="kds-sidebar__user-email">Haga clic para autenticarse</div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'collapsed') {
    return (
      <div className="relative flex justify-center py-4" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="kds-sidebar__user-avatar"
          title={user.name}
          style={{ cursor: 'pointer' }}
        >
          {user.initials}
        </button>
        {menuOpen && (
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl overflow-hidden kds-animate-fade-in"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)', zIndex: 'var(--z-dropdown)' }}
          >
            <div className="px-4 py-3" style={{ background: 'var(--color-gray-50)', borderBottom: '1px solid var(--border-default)' }}>
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--color-danger)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-danger-light)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <div className="kds-sidebar__user" onClick={() => setMenuOpen(prev => !prev)}>
        <div className="kds-sidebar__user-avatar">
          {user.initials}
        </div>
        <div className="kds-sidebar__user-info">
          <div className="kds-sidebar__user-name">{user.name}</div>
          <div className="kds-sidebar__user-email">{user.email}</div>
        </div>
        <MoreVertical className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--color-gray-500)' }} />
      </div>
      {menuOpen && (
        <div 
          className="absolute bottom-full left-4 right-4 mb-2 rounded-xl overflow-hidden kds-animate-fade-in"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)', zIndex: 'var(--z-dropdown)' }}
        >
          <div className="py-1">
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-danger-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
