import { Configuration, LogLevel, BrowserCacheLocation } from '@azure/msal-browser';

interface MsalRuntimeConfig {
  clientId: string;
  authority: string;
}

function getRuntimeMsalConfig(): MsalRuntimeConfig {
  const cfg = (window as any).kbatch_msal_config;
  return {
    clientId: cfg?.clientId || '',
    authority: cfg?.authority || '',
  };
}

export function buildMsalConfig(): Configuration {
  const { clientId, authority } = getRuntimeMsalConfig();

  return {
    auth: {
      clientId,
      authority,
      redirectUri: '/',
      postLogoutRedirectUri: '/',
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback(_logLevel: LogLevel, message: string) {
          if (process.env.NODE_ENV === 'development') {
            console.debug('[MSAL]', message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  };
}

export const loginRequest = {
  scopes: ['User.Read'],
};
