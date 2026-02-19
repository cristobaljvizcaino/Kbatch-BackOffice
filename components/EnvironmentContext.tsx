import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

// =============================================================================
// TIPOS (inline para evitar dependencias de path entre directorios)
// =============================================================================

/** Configuración de un ambiente individual */
export interface EnvironmentConfig {
  api_url: string;
  auth_user: string;
  auth_password: string;
}

/** Mapa de ambientes: key = nombre del ambiente, value = configuración */
export type EnvironmentMap = Record<string, EnvironmentConfig>;

/** Estado del ambiente activo en la aplicación */
export interface EnvironmentState {
  selectedEnv: string;
  config: EnvironmentConfig;
  apiBaseUrl: string;
  environments: EnvironmentMap;
  setSelectedEnv: (envName: string) => void;
  /** Se incrementa cada vez que se cambia de ambiente; úsalo como dependencia para re-fetch */
  environmentVersion: number;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/** Sufijo de ruta API que se agrega al api_url del ambiente */
const API_PATH_SUFFIX = '/kmfef-kbatch/v1';

/** Variable inyectada por Vite en build-time (via define en vite.config.ts) */
declare const __KBATCH_ENV__: string;

/** Key para persistir la selección en sessionStorage */
const SESSION_STORAGE_KEY = 'kbatch_selected_environment';

// =============================================================================
// PARSEO DE LA VARIABLE kbatch_selector_enviroments
// =============================================================================

/**
 * Lee kbatch_selector_enviroments con esta prioridad:
 * 1. window.kbatch_selector_enviroments (index.html / runtime injection / preview)
 * 2. __KBATCH_ENV__ (inyectado por Vite en build-time desde .env o variable de sistema)
 */
function parseEnvironments(): EnvironmentMap {
  try {
    // Fuente 1: window (index.html para preview, o inyección en runtime para prod)
    let raw: any = (window as any).kbatch_selector_enviroments;

    // Fuente 2: Vite build-time (desde .env.local o variable de sistema en CI/CD)
    if (!raw) {
      try { raw = __KBATCH_ENV__; } catch { /* No estamos en un build de Vite */ }
    }

    if (!raw) {
      console.warn('[EnvironmentContext] kbatch_selector_enviroments no está configurada.');
      return {};
    }

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const validated: EnvironmentMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      const env = value as any;
      if (env && typeof env.api_url === 'string') {
        validated[key] = {
          api_url: env.api_url,
          auth_user: env.auth_user ?? '',
          auth_password: env.auth_password ?? '',
        };
      } else {
        console.warn(`[EnvironmentContext] Ambiente "${key}" ignorado: falta api_url.`);
      }
    }

    return validated;
  } catch (error) {
    console.error('[EnvironmentContext] Error parseando kbatch_selector_enviroments:', error);
    return {};
  }
}

// =============================================================================
// CONTEXTO
// =============================================================================

const EnvironmentContext = createContext<EnvironmentState | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface EnvironmentProviderProps {
  children: React.ReactNode;
}

export const EnvironmentProvider: React.FC<EnvironmentProviderProps> = ({ children }) => {
  const environments = useMemo(() => parseEnvironments(), []);
  const envKeys = useMemo(() => Object.keys(environments), [environments]);

  const getInitialEnv = useCallback((): string => {
    if (envKeys.length === 0) return '';
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && environments[stored]) return stored;
    return envKeys[0];
  }, [envKeys, environments]);

  const [selectedEnv, setSelectedEnvInternal] = useState<string>(getInitialEnv);
  const [environmentVersion, setEnvironmentVersion] = useState<number>(0);

  const setSelectedEnv = useCallback((envName: string) => {
    if (environments[envName]) {
      setSelectedEnvInternal(envName);
      sessionStorage.setItem(SESSION_STORAGE_KEY, envName);
      setEnvironmentVersion(v => v + 1);
    } else {
      console.warn(`[EnvironmentContext] Ambiente "${envName}" no existe en la configuración.`);
    }
  }, [environments]);

  useEffect(() => {
    if (selectedEnv) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, selectedEnv);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const config: EnvironmentConfig = useMemo(() => {
    if (!selectedEnv || !environments[selectedEnv]) {
      return { api_url: '', auth_user: '', auth_password: '' };
    }
    return environments[selectedEnv];
  }, [selectedEnv, environments]);

  const apiBaseUrl = useMemo(() => {
    if (!config.api_url) return '';
    const base = config.api_url.replace(/\/+$/, '');
    return `${base}${API_PATH_SUFFIX}`;
  }, [config.api_url]);

  const state: EnvironmentState = useMemo(() => ({
    selectedEnv,
    config,
    apiBaseUrl,
    environments,
    setSelectedEnv,
    environmentVersion,
  }), [selectedEnv, config, apiBaseUrl, environments, setSelectedEnv, environmentVersion]);

  return (
    <EnvironmentContext.Provider value={state}>
      {children}
    </EnvironmentContext.Provider>
  );
};

// =============================================================================
// HOOKS
// =============================================================================

export function useEnvironment(): EnvironmentState {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment debe usarse dentro de un <EnvironmentProvider>');
  }
  return context;
}

export function useApiBaseUrl(): string {
  const { apiBaseUrl } = useEnvironment();
  return apiBaseUrl;
}

/** Retorna el contador de versión del ambiente; cambia cada vez que se selecciona otro ambiente */
export function useEnvironmentVersion(): number {
  const { environmentVersion } = useEnvironment();
  return environmentVersion;
}
