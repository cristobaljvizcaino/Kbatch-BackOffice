import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Server, Check, Globe, AlertTriangle } from 'lucide-react';
import { useEnvironment } from './EnvironmentContext';

// =============================================================================
// HELPERS
// =============================================================================

/** Extraer un tag visual corto del nombre del ambiente (e.g., "D1", "Q2") */
function getEnvTag(envName: string): string {
  const parts = envName.split('-');
  return parts[parts.length - 1] || envName;
}

/** Determinar tipo de ambiente para color coding */
function getEnvType(envName: string): 'dev' | 'qa' | 'prod' | 'unknown' {
  const upper = envName.toUpperCase();
  if (upper.includes('-D')) return 'dev';
  if (upper.includes('-Q')) return 'qa';
  if (upper.includes('-P') || upper.includes('PROD')) return 'prod';
  return 'unknown';
}

/** Colores según tipo de ambiente */
function getEnvColors(type: ReturnType<typeof getEnvType>) {
  switch (type) {
    case 'dev':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        hoverBg: 'hover:bg-emerald-500/10',
        label: 'DEV',
      };
    case 'qa':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        hoverBg: 'hover:bg-amber-500/10',
        label: 'QA',
      };
    case 'prod':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
        badge: 'bg-red-500/20 text-red-300 border-red-500/30',
        hoverBg: 'hover:bg-red-500/10',
        label: 'PROD',
      };
    default:
      return {
        bg: 'bg-slate-500/20',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
        badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        hoverBg: 'hover:bg-slate-500/10',
        label: 'ENV',
      };
  }
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const EnvironmentSelector: React.FC = () => {
  const { selectedEnv, environments, setSelectedEnv, apiBaseUrl } = useEnvironment();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const envKeys = Object.keys(environments);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Si no hay ambientes configurados, mostrar advertencia
  if (envKeys.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
        <span className="text-xs text-red-400 font-medium">Sin ambientes</span>
      </div>
    );
  }

  const currentType = getEnvType(selectedEnv);
  const currentColors = getEnvColors(currentType);
  const currentTag = getEnvTag(selectedEnv);

  const handleSelect = (envName: string) => {
    setSelectedEnv(envName);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200
          ${isOpen 
            ? `${currentColors.bg} ${currentColors.border} ${currentColors.text}` 
            : `bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:border-slate-500`
          }`}
        title={`Ambiente activo: ${selectedEnv}\nAPI: ${apiBaseUrl}`}
      >
        <Server className="h-3.5 w-3.5 flex-shrink-0" />
        
        {/* Badge del tipo de ambiente */}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${currentColors.badge}`}>
          {currentColors.label}
        </span>
        
        {/* Nombre corto del ambiente */}
        <span className="text-xs font-semibold tracking-wide">{currentTag}</span>
        
        {/* Dot indicador */}
        <span className={`w-1.5 h-1.5 rounded-full ${currentColors.dot} animate-pulse`}></span>
        
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e293b] border border-slate-600/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Selector de Ambiente</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Seleccione el ambiente de trabajo para las operaciones del portal
            </p>
          </div>

          {/* Environment List */}
          <div className="py-1.5 max-h-80 overflow-y-auto custom-scrollbar">
            {envKeys.map((envName) => {
              const isActive = envName === selectedEnv;
              const type = getEnvType(envName);
              const colors = getEnvColors(type);
              const tag = getEnvTag(envName);
              const envConfig = environments[envName];

              return (
                <button
                  key={envName}
                  onClick={() => handleSelect(envName)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150
                    ${isActive 
                      ? `${colors.bg} border-l-2 ${colors.border}` 
                      : `hover:bg-slate-700/50 border-l-2 border-transparent`
                    }`}
                >
                  {/* Color dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot} ${isActive ? 'animate-pulse' : ''}`} />
                  
                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isActive ? colors.text : 'text-slate-200'}`}>
                        {envName}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors.badge}`}>
                        {colors.label} {tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {envConfig.api_url}
                    </div>
                  </div>

                  {/* Active check */}
                  {isActive && (
                    <Check className={`h-4 w-4 flex-shrink-0 ${colors.text}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {envKeys.length} ambiente{envKeys.length !== 1 ? 's' : ''} disponible{envKeys.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-slate-600 truncate ml-2 max-w-[200px]" title={apiBaseUrl}>
                {apiBaseUrl}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentSelector;
