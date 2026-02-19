import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, UserPlus, Search, Filter, RefreshCw,
  Eye, Mail, CheckCircle, XCircle, Building2,
  Clock, ChevronLeft, ChevronRight, User, FileText,
  Upload, Download, AlertCircle, X, Loader2, Globe,
  Calendar, Activity, ExternalLink, LayoutList, Layers, Trash2,
  HelpCircle, BookOpen, ArrowRight, Info, Zap, Shield, Database
} from 'lucide-react';
import { useApiBaseUrl, useEnvironmentVersion, useEnvironment } from './EnvironmentContext';

// =============================================================================
// TIPOS E INTERFACES (basados en documentación de Kbatch)
// =============================================================================

interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  code: string;
  message: string;
  error?: string;
  warnings?: string[];
}

/**
 * Usuario sincronizado en KBatch
 * Respuesta de GET /user-sync/:userPublicId
 */
interface SyncedUser {
  id: number;
  public_id: string;
  company_id: string;
  user_name: string;
  user_email: string;
  metadata: {
    sourceService?: string;
    application?: string;
  } | null;
  created_at: string;
}

/**
 * Request para sincronizar usuario
 * Body de POST /user-sync
 */
interface SyncUserRequest {
  userPublicId: string;
  userName: string;
  userEmail: string;
  companyId: string;
  serviceName?: string;
  application?: string;
}

/**
 * Proceso/archivo
 * Elemento del array processes en GET /process-sync
 */
interface ProcessItem {
  fileName: string;
  createdAt: string;
  fileUrl: string;
  filePublicId: string;
  type: 'import' | 'export' | null;
  userName: string;
  userEmail: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PROCESSED_EXTERNAL' | 'COMPLETED' | 'REJECTED';
}

/**
 * Compañía con sus procesos
 * Elemento del array companies en GET /process-sync (modo todos/application)
 */
interface CompanyWithProcesses {
  companyId: string;
  application: string | null;
  processes: ProcessItem[];
}

/**
 * Información de paginación
 */
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/**
 * Respuesta de GET /process-sync (modo todos o por application)
 */
interface ProcessSyncResponseAll {
  companies: CompanyWithProcesses[];
  pagination: PaginationInfo;
}

/**
 * Respuesta de GET /process-sync (modo por company)
 */
interface ProcessSyncResponseCompany {
  companyId: string;
  application: string | null;
  processes: ProcessItem[];
  pagination: PaginationInfo;
}

// Tipo unificado para la vista en tabla
interface FlattenedProcess {
  companyId: string;
  application: string | null;
  fileName: string;
  createdAt: string;
  fileUrl: string;
  filePublicId: string;
  type: 'import' | 'export' | null;
  userName: string;
  userEmail: string;
  status: string;
}

// =============================================================================
// SERVICIO DE API - INTEGRACIÓN CON KBATCH
// =============================================================================

const createUserSyncService = (API_BASE_URL: string) => ({
  /**
   * Sincronizar un usuario en KBatch
   * POST /user-sync
   */
  async syncUser(data: SyncUserRequest): Promise<SyncedUser> {
    const response = await fetch(`${API_BASE_URL}/user-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<{
      userId: string;
      companyId: string;
      userEmail: string;
      userName: string;
      serviceName?: string;
      application?: string;
    }> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Error al sincronizar usuario');
    }

    return {
      id: 0,
      public_id: result.data.userId,
      company_id: result.data.companyId,
      user_name: result.data.userName,
      user_email: result.data.userEmail,
      metadata: result.data.serviceName ? {
        sourceService: result.data.serviceName,
        application: result.data.application
      } : null,
      created_at: new Date().toISOString()
    };
  },

  /**
   * Consultar si un usuario está sincronizado
   * GET /user-sync/:userPublicId
   */
  async getUser(userPublicId: string): Promise<SyncedUser> {
    const response = await fetch(`${API_BASE_URL}/user-sync/${userPublicId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result: ApiResponse<SyncedUser> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Usuario no encontrado');
    }

    return result.data;
  },

  /**
   * Obtener todos los procesos con filtros flexibles
   * GET /process-sync
   */
  async getProcesses(params?: { 
    application?: string; 
    company?: string;
    page?: number; 
    limit?: number 
  }): Promise<{ 
    data: ProcessSyncResponseAll | ProcessSyncResponseCompany;
    isCompanyMode: boolean;
    warnings?: string[];
  }> {
    const queryParams = new URLSearchParams();
    if (params?.application) queryParams.append('application', params.application);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE_URL}/process-sync${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result: ApiResponse<ProcessSyncResponseAll | ProcessSyncResponseCompany> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Error al obtener procesos');
    }

    // Determinar si es modo company (tiene companyId directo) o modo all/application (tiene companies array)
    const isCompanyMode = 'companyId' in result.data && !('companies' in result.data);

    return {
      data: result.data,
      isCompanyMode,
      warnings: result.warnings
    };
  }
});

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

/**
 * Badge de estado del proceso
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
    PROCESSED_EXTERNAL: 'bg-purple-100 text-purple-700 border-purple-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200'
  };

  const icons: Record<string, any> = {
    COMPLETED: CheckCircle,
    IN_PROGRESS: Activity,
    PROCESSED_EXTERNAL: Globe,
    PENDING: Clock,
    REJECTED: XCircle
  };

  const labels: Record<string, string> = {
    COMPLETED: 'Completado',
    IN_PROGRESS: 'En Proceso',
    PROCESSED_EXTERNAL: 'Procesado Ext.',
    PENDING: 'Pendiente',
    REJECTED: 'Rechazado'
  };

  const Icon = icons[status] || Clock;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status] || styles.PENDING}`}>
      <Icon className="h-3 w-3 mr-1" />
      {labels[status] || status}
    </span>
  );
};

/**
 * Badge de tipo de proceso
 */
const TypeBadge: React.FC<{ type: 'import' | 'export' | null }> = ({ type }) => {
  if (!type) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
        <FileText className="h-3 w-3 mr-1" />
        N/A
      </span>
    );
  }

  const isImport = type === 'import';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
      isImport 
        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
        : 'bg-green-100 text-green-700 border border-green-200'
    }`}>
      {isImport ? <Upload className="h-3 w-3 mr-1" /> : <Download className="h-3 w-3 mr-1" />}
      {isImport ? 'Import' : 'Export'}
    </span>
  );
};

/**
 * Toast de notificaciones
 */
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${colors[type]} animate-in slide-in-from-right duration-300 max-w-md`}>
      <div className="flex items-start gap-3">
        <span className="flex-1">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// CONTENIDO DE AYUDA CONTEXTUAL PARA GESTIÓN DE USUARIOS Y PROCESOS
// =============================================================================

const USER_MANAGEMENT_HELP_TOPICS: Array<{
  id: string;
  icon: any;
  title: string;
  description: string;
  sections: Array<{ subtitle: string; content: string }>;
}> = [
  {
    id: 'overview',
    icon: BookOpen,
    title: '¿Qué es esta sección?',
    description: 'Visión general del panel',
    sections: [
      {
        subtitle: '¿Para qué sirve este panel?',
        content: 'Este es el panel central de "Gestión de Usuarios y Procesos". Aquí puedes ver en una sola vista TODOS los procesos de importación y exportación que se han realizado en KBatch, sin importar qué aplicación o usuario los haya creado.\n\nEs como un tablero de control que te muestra toda la actividad del sistema de procesamiento de archivos.'
      },
      {
        subtitle: '¿Qué información muestra?',
        content: 'La tabla principal muestra cada archivo procesado con:\n• Quién lo procesó (usuario y email)\n• A qué organización pertenece (Company ID)\n• Desde qué aplicación se creó (Payin, Payout, etc.)\n• El nombre del archivo\n• Si fue una importación o exportación\n• El estado actual del proceso\n• Cuándo se realizó'
      },
      {
        subtitle: 'Las tarjetas de estadísticas',
        content: 'En la parte superior hay 4 tarjetas que resumen:\n• Total Procesos: Cantidad total de archivos procesados\n• Compañías: Cuántas organizaciones diferentes han usado KBatch\n• Aplicaciones: Cuántas apps distintas están conectadas\n• Usuarios: Cuántas personas diferentes han realizado operaciones\n\nCuando aplicas filtros, estas tarjetas se actualizan para mostrar "X de Y" (filtrados de total).'
      },
      {
        subtitle: '¿Con qué frecuencia se actualiza?',
        content: 'Los datos NO se actualizan automáticamente. Para ver la información más reciente, usa el botón de refrescar (icono de flechas circulares) junto al texto "Última actualización". Esto recargará todos los datos desde el servidor.'
      }
    ]
  },
  {
    id: 'sync',
    icon: UserPlus,
    title: '¿Cómo funciona la sincronización?',
    description: 'Registrar usuarios en KBatch',
    sections: [
      {
        subtitle: '¿Qué significa "Sincronizar Usuario"?',
        content: 'Antes de que un usuario pueda importar o exportar archivos en KBatch, debe estar "registrado" (sincronizado) en el sistema. Es como crear una cuenta: le dices a KBatch quién es el usuario, a qué empresa pertenece y desde qué aplicación viene.'
      },
      {
        subtitle: '¿Por qué es necesario?',
        content: 'KBatch es un servicio centralizado que usan múltiples aplicaciones (Payin, Payout, KADMIN, etc.). La sincronización permite:\n• Saber quién hizo cada operación (trazabilidad)\n• Agrupar procesos por empresa y aplicación\n• Mantener un registro ordenado de la actividad\n• Asociar cada archivo a su dueño'
      },
      {
        subtitle: '¿Qué datos necesito?',
        content: 'Campos obligatorios (marcados con *):\n• Public ID: Identificador único del usuario en su sistema de origen\n• Nombre: Nombre completo del usuario\n• Email: Correo electrónico (debe ser válido)\n• Company ID: Identificador de la organización\n\nCampos opcionales pero recomendados:\n• Servicio de Origen: De dónde viene el usuario (ej: "KashioSec")\n• Aplicación: Qué app usa (ej: "Payin") - MUY recomendado para filtros'
      },
      {
        subtitle: '¿Qué pasa si sincronizo al mismo usuario dos veces?',
        content: 'No hay problema. El sistema es IDEMPOTENTE, es decir, si el usuario ya existe, simplemente retorna sus datos sin crear un duplicado. Puedes llamar la sincronización las veces que quieras de forma segura.'
      },
      {
        subtitle: '¿Y el campo "Aplicación"?',
        content: 'Aunque es técnicamente opcional, se recomienda SIEMPRE incluirlo. Sin este campo:\n• No podrás filtrar procesos por aplicación\n• Los procesos del usuario aparecerán sin aplicación identificable\n• Se dificulta la auditoría y reportes\n\nEjemplos: "Payin", "Payout", "KADMIN", "Billing", "Payments"'
      }
    ]
  },
  {
    id: 'table',
    icon: LayoutList,
    title: '¿Qué significa cada columna?',
    description: 'Entender la tabla de procesos',
    sections: [
      {
        subtitle: 'Columna: Usuario',
        content: 'Muestra el nombre y email del usuario que realizó el proceso. Las iniciales se muestran en un avatar circular. Este es el usuario que fue sincronizado previamente en "Sincronizar Nuevo Usuario".'
      },
      {
        subtitle: 'Columna: Company ID',
        content: 'Es el identificador de la organización/empresa a la que pertenece el usuario. Ejemplo: "org_kashio_123" o "cus_q2_ASbJ5HLr". Cada empresa puede tener múltiples usuarios y procesos.'
      },
      {
        subtitle: 'Columna: Aplicación',
        content: 'Indica desde qué aplicación se creó el proceso. Ejemplos:\n• Payin: Procesos de pagos entrantes\n• Payout: Procesos de pagos salientes\n• KADMIN: Administración\n\nSi aparece un guión (-) significa que no se especificó la aplicación al sincronizar el usuario.'
      },
      {
        subtitle: 'Columna: Archivo',
        content: 'Nombre del archivo que se procesó. Puede ser:\n• Un archivo subido para importación (ej: "datos_clientes.xlsx")\n• Un archivo generado por exportación (ej: "export-1770413164130.xlsx")\n\nLos nombres de exportación se generan automáticamente con un timestamp si no se especifica uno.'
      },
      {
        subtitle: 'Columna: Tipo',
        content: '• Import (azul): El usuario subió un archivo para que KBatch lo procese y envíe los datos a un sistema externo\n• Export (verde): El usuario pidió a KBatch que genere un archivo con datos para descargar'
      },
      {
        subtitle: 'Columna: Fecha',
        content: 'Muestra cuándo se creó el proceso. El formato es:\n• "Hoy, HH:MM" si fue hoy\n• "DD Mes YYYY" para otros días\n\nLos procesos se ordenan de más reciente a más antiguo.'
      },
      {
        subtitle: 'Columna: Acciones',
        content: 'El icono de enlace externo permite abrir/descargar el archivo asociado al proceso directamente desde Amazon S3.'
      }
    ]
  },
  {
    id: 'status',
    icon: Activity,
    title: '¿Qué significan los estados?',
    description: 'Estados de los procesos',
    sections: [
      {
        subtitle: 'Pendiente (amarillo)',
        content: 'El proceso fue creado pero aún no se ha iniciado el procesamiento. Esto puede significar:\n• El archivo fue subido pero no se ha llamado a "iniciar procesamiento"\n• El proceso está en cola esperando ser atendido\n\nAcción: Si lleva mucho tiempo en pendiente, puede que el procesamiento no se haya iniciado correctamente.'
      },
      {
        subtitle: 'En Proceso (azul)',
        content: 'El sistema está procesando activamente el archivo. Para importaciones:\n• El archivo fue dividido en bloques\n• Todos los bloques fueron enviados al sistema externo\n• Se está esperando la respuesta\n\nEsto puede tomar desde segundos hasta varios minutos dependiendo del tamaño del archivo.'
      },
      {
        subtitle: 'Procesado Ext. (morado)',
        content: '"Procesado Externamente" significa que el sistema externo (API de destino) ya procesó todos los datos enviados. Es un paso intermedio antes de "Completado". Los datos fueron recibidos y procesados por el sistema de destino.'
      },
      {
        subtitle: 'Completado (verde)',
        content: 'El proceso terminó exitosamente.\n• Para importaciones: Todos los bloques fueron procesados y confirmados\n• Para exportaciones: El archivo fue generado y está disponible para descarga\n\nEste es el estado final deseado.'
      },
      {
        subtitle: 'Rechazado (rojo)',
        content: 'El proceso no pudo completarse debido a errores de validación. Esto ocurre cuando:\n• El archivo no tiene las columnas requeridas\n• Los datos no cumplen con los formatos esperados\n• Hay errores graves que impiden el procesamiento\n\nAcción: Revisa los errores, corrige el archivo y vuelve a intentar desde el Portal de Importación.'
      },
      {
        subtitle: 'Diferencia entre Import y Export',
        content: 'IMPORTACIÓN: Proceso asíncrono con múltiples estados:\nPendiente → En Proceso → Procesado Ext. → Completado\n(o Rechazado si hay errores de validación)\n\nEXPORTACIÓN: Proceso síncrono e inmediato:\nSe genera el archivo → Completado\n(El estado pasa directamente a Completado porque la generación es instantánea)'
      }
    ]
  },
  {
    id: 'filters',
    icon: Search,
    title: '¿Cómo usar los filtros?',
    description: 'Búsqueda y filtrado de datos',
    sections: [
      {
        subtitle: 'Búsqueda instantánea',
        content: 'Todos los filtros funcionan en TIEMPO REAL mientras escribes. No necesitas presionar Enter ni hacer clic en un botón de buscar. La tabla se actualiza instantáneamente con cada letra que tecleas.'
      },
      {
        subtitle: 'Filtro por Aplicación',
        content: 'Escribe el nombre parcial o completo de una aplicación. Ejemplos:\n• "pay" → mostrará Payin, Payout, Payments\n• "payin" → solo mostrará Payin\n• "kadmin" → solo KADMIN\n\nLa búsqueda es case-insensitive (no distingue mayúsculas/minúsculas).'
      },
      {
        subtitle: 'Filtro por Company ID',
        content: 'Filtra por el identificador de la organización. Puedes escribir una parte del ID:\n• "org_kashio" → todas las compañías que contienen "org_kashio"\n• "cus_" → todas las que empiezan con "cus_"\n\nÚtil para ver todos los procesos de una empresa específica.'
      },
      {
        subtitle: 'Buscar Usuario',
        content: 'Busca por nombre O email del usuario. Ejemplos:\n• "Juan" → usuarios que se llaman Juan\n• "kashio.net" → todos los usuarios con email de kashio.net\n• "perez" → cualquier usuario con "perez" en nombre o email'
      },
      {
        subtitle: 'Combinar filtros',
        content: 'Puedes usar varios filtros a la vez. Por ejemplo:\n• Aplicación "payin" + Usuario "Juan" → solo procesos de Payin hechos por Juan\n• Company "org_kashio" + Tipo visible "import" → importaciones de org_kashio\n\nLas tarjetas de estadísticas se actualizan mostrando "X de Y" para reflejar el filtro activo.'
      },
      {
        subtitle: 'Limpiar filtros',
        content: 'Cuando hay filtros activos, aparece un botón rojo "Limpiar" que borra todos los filtros de una vez y muestra todos los registros nuevamente. También se muestra el contador "Mostrando X de Y registros".'
      }
    ]
  },
  {
    id: 'flow',
    icon: Zap,
    title: '¿Cuál es el flujo completo?',
    description: 'Cómo funciona KBatch de inicio a fin',
    sections: [
      {
        subtitle: 'Paso 1: Sincronizar Usuario',
        content: 'Antes de cualquier operación, el usuario debe estar registrado en KBatch. Esto se hace una sola vez por usuario usando el botón "Sincronizar Nuevo Usuario" o mediante la API (POST /user-sync).\n\nEs como "crear una cuenta" en KBatch.'
      },
      {
        subtitle: 'Paso 2a: Importar Archivos',
        content: 'Para IMPORTAR (subir datos al sistema):\n1. Ir a "Importar Archivos" en el menú lateral\n2. Seleccionar el tipo de proceso\n3. Subir el archivo (Excel, CSV, etc.)\n4. El sistema valida, divide en bloques y procesa\n5. Ver resultados con detalle de éxitos y errores'
      },
      {
        subtitle: 'Paso 2b: Exportar Archivos',
        content: 'Para EXPORTAR (generar archivos de descarga):\n1. Ir a "Exportar Archivos" en el menú lateral\n2. Seleccionar el tipo de exportación\n3. Proporcionar los datos a exportar\n4. El sistema genera el archivo inmediatamente\n5. Descargar el archivo generado'
      },
      {
        subtitle: 'Paso 3: Monitorear',
        content: 'Volver a esta sección ("Gestión de Usuarios y Procesos") para:\n• Ver el estado de todos los procesos\n• Filtrar por aplicación, empresa o usuario\n• Descargar archivos procesados\n• Verificar que todo se completó correctamente'
      },
      {
        subtitle: 'Diagrama simplificado',
        content: 'SINCRONIZAR → IMPORTAR/EXPORTAR → MONITOREAR\n\n1. Sincronizar usuario (una vez)\n   ↓\n2. Importar archivos (subir datos)\n   → Pendiente → En Proceso → Completado\n   ↓\n   Exportar archivos (generar archivos)\n   → Completado (inmediato)\n   ↓\n3. Ver resultados aquí en el panel'
      },
      {
        subtitle: 'Configuración previa',
        content: 'Para que todo funcione, primero se deben crear los "Tipos de Proceso" en la sección "Configuración de Procesos". Estos definen qué columnas espera cada proceso, qué formatos se validan y cómo se generan los archivos.\n\nSin configuración previa, no habrá tipos de proceso disponibles para importar o exportar.'
      }
    ]
  },
  {
    id: 'synced-users',
    icon: Shield,
    title: 'Usuarios sincronizados (sección verde)',
    description: 'El historial local de sincronizaciones',
    sections: [
      {
        subtitle: '¿Qué es la sección verde?',
        content: 'Cuando sincronizas un usuario desde este portal, se guarda un registro LOCAL en tu navegador (no en el servidor). Esta lista verde muestra los usuarios que TÚ has sincronizado desde este navegador para tu referencia rápida.'
      },
      {
        subtitle: '¿Es diferente a la tabla principal?',
        content: 'Sí. La tabla principal muestra los PROCESOS (archivos importados/exportados). La sección verde muestra los USUARIOS que has sincronizado. Un usuario puede tener cero o muchos procesos.\n\nPor ejemplo, puedes sincronizar un usuario y aún no aparecerá en la tabla principal hasta que ese usuario realice una importación o exportación.'
      },
      {
        subtitle: '¿Se pierde al cerrar el navegador?',
        content: 'No. El historial se guarda en el almacenamiento local del navegador (localStorage). Permanecerá disponible mientras no limpies los datos del navegador o uses el botón "Limpiar historial".'
      },
      {
        subtitle: 'Limpiar historial',
        content: 'El botón "Limpiar historial" (rojo) borra SOLO el registro local de tu navegador. NO elimina los usuarios del servidor. Los usuarios seguirán existiendo en KBatch y podrán seguir realizando operaciones normalmente.'
      }
    ]
  }
];

// =============================================================================
// COMPONENTE: Modal de Ayuda para Gestión de Usuarios
// =============================================================================

const UserManagementHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const topic = USER_MANAGEMENT_HELP_TOPICS[selectedTopic];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Centro de Ayuda</h2>
              <p className="text-blue-100 text-xs">Gestión de Usuarios y Procesos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(85vh-140px)]">
          {/* Sidebar - Topics */}
          <div className="md:w-64 flex-shrink-0 bg-slate-50 border-r border-slate-200 overflow-y-auto">
            <div className="p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Temas de Ayuda</p>
              {USER_MANAGEMENT_HELP_TOPICS.map((t, idx) => {
                const TopicIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all text-sm flex items-start gap-2.5 ${
                      selectedTopic === idx
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <TopicIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      selectedTopic === idx ? 'text-blue-600' : 'text-slate-400'
                    }`} />
                    <div>
                      <div className="font-medium text-xs leading-tight">{t.title}</div>
                      <div className={`text-[10px] mt-0.5 ${
                        selectedTopic === idx ? 'text-blue-500' : 'text-slate-400'
                      }`}>{t.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                {React.createElement(topic.icon, { className: 'h-6 w-6 mr-2 text-blue-600' })}
                {topic.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
            </div>

            <div className="space-y-5">
              {topic.sections.map((section, idx) => (
                <div key={idx} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                      {idx + 1}
                    </span>
                    {section.subtitle}
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            {selectedTopic + 1} de {USER_MANAGEMENT_HELP_TOPICS.length} temas
          </p>
          <div className="flex items-center gap-2">
            {selectedTopic > 0 && (
              <button
                onClick={() => setSelectedTopic(prev => prev - 1)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                Anterior
              </button>
            )}
            {selectedTopic < USER_MANAGEMENT_HELP_TOPICS.length - 1 ? (
              <button
                onClick={() => setSelectedTopic(prev => prev + 1)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Entendido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Modal de Sincronizar Usuario
// =============================================================================

interface SyncUserModalProps {
  onClose: () => void;
  onSuccess: (user: SyncedUser) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const SyncUserModal: React.FC<SyncUserModalProps> = ({ onClose, onSuccess, showToast }) => {
  const apiBaseUrl = useApiBaseUrl();
  const userSyncService = useMemo(() => createUserSyncService(apiBaseUrl), [apiBaseUrl]);
  const [formData, setFormData] = useState<SyncUserRequest>({
    userPublicId: '',
    userName: '',
    userEmail: '',
    companyId: '',
    serviceName: '',
    application: ''
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.userPublicId.trim()) {
      newErrors.userPublicId = 'El Public ID es requerido';
    }
    if (!formData.userName.trim()) {
      newErrors.userName = 'El nombre es requerido';
    }
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'El email es requerido';
    } else if (!validateEmail(formData.userEmail)) {
      newErrors.userEmail = 'El formato del email no es válido';
    }
    if (!formData.companyId.trim()) {
      newErrors.companyId = 'El Company ID es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const user = await userSyncService.syncUser(formData);
      showToast('Usuario sincronizado exitosamente', 'success');
      onSuccess(user);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al sincronizar usuario';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            Sincronizar Usuario
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-700 flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Nota:</strong> Este endpoint es idempotente. Si el usuario ya existe, 
              se retornarán sus datos sin crear un duplicado.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Public ID del Usuario *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={formData.userPublicId}
                onChange={(e) => setFormData({ ...formData, userPublicId: e.target.value })}
                className={`w-full pl-9 pr-4 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400 ${
                  errors.userPublicId ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Ej: usr_d1_9PpNyjMTXpCGAgwe4F28VX"
              />
            </div>
            {errors.userPublicId && <p className="text-red-500 text-xs mt-1">{errors.userPublicId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre Completo *
            </label>
            <input 
              type="text" 
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className={`w-full px-4 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400 ${
                errors.userName ? 'border-red-300' : 'border-slate-300'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.userName && <p className="text-red-500 text-xs mt-1">{errors.userName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="email" 
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                className={`w-full pl-9 pr-4 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400 ${
                  errors.userEmail ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Ej: juan.perez@empresa.com"
              />
            </div>
            {errors.userEmail && <p className="text-red-500 text-xs mt-1">{errors.userEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company ID (Organización) *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className={`w-full pl-9 pr-4 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400 ${
                  errors.companyId ? 'border-red-300' : 'border-slate-300'
                }`}
                placeholder="Ej: org_kashio_123"
              />
            </div>
            {errors.companyId && <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Servicio de Origen
              </label>
              <input 
                type="text" 
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="Ej: KashioSec"
              />
              <p className="text-xs text-slate-400 mt-1">Opcional</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Aplicación
              </label>
              <input 
                type="text" 
                value={formData.application}
                onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="Ej: Payments"
              />
              <p className="text-xs text-slate-400 mt-1">Recomendado</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-300 rounded text-slate-600 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Sincronizar Usuario
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Modal de Detalle de Usuario
// =============================================================================

interface UserDetailModalProps {
  userPublicId: string;
  onClose: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ userPublicId, onClose, showToast }) => {
  const apiBaseUrl = useApiBaseUrl();
  const userSyncService = useMemo(() => createUserSyncService(apiBaseUrl), [apiBaseUrl]);
  const [user, setUser] = useState<SyncedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await userSyncService.getUser(userPublicId);
        setUser(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar usuario');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userPublicId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Detalle de Usuario
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Cargando...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {user && !loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {user.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{user.user_name}</h4>
                  <div className="flex items-center text-sm text-slate-500">
                    <Mail className="h-3 w-3 mr-1" />
                    {user.user_email}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">Public ID</span>
                  <div className="font-mono text-xs bg-slate-50 px-2 py-1 rounded mt-1 select-all">
                    {user.public_id}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Company ID</span>
                  <div className="font-mono text-xs bg-slate-50 px-2 py-1 rounded mt-1 select-all">
                    {user.company_id}
                  </div>
                </div>
                {user.metadata?.sourceService && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Servicio</span>
                    <span className="font-medium text-slate-800">{user.metadata.sourceService}</span>
                  </div>
                )}
                {user.metadata?.application && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Aplicación</span>
                    <span className="font-medium text-slate-800">{user.metadata.application}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Sincronizado</span>
                  <span className="text-slate-800">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded text-sm font-medium hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE PRINCIPAL: UserManagement
// =============================================================================

interface UserManagementProps {
  isActive?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ isActive }) => {
  const apiBaseUrl = useApiBaseUrl();
  const environmentVersion = useEnvironmentVersion();
  const { selectedEnv } = useEnvironment();
  const userSyncService = useMemo(() => createUserSyncService(apiBaseUrl), [apiBaseUrl]);
  const [data, setData] = useState<FlattenedProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverPagination, setServerPagination] = useState<PaginationInfo | null>(null);
  
  // Filtros (todos locales para búsqueda en tiempo real)
  const [filterApplication, setFilterApplication] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [searchUser, setSearchUser] = useState('');
  
  // Paginación local para resultados filtrados
  const [localPage, setLocalPage] = useState(1);
  const LOCAL_PAGE_SIZE = 50; // Mostrar 50 registros por página
  
  // Modals
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Lista de usuarios sincronizados (persistente en localStorage POR AMBIENTE)
  const getSyncedUsersStorageKey = useCallback(() => {
    return selectedEnv ? `kbatch_synced_users_${selectedEnv}` : 'kbatch_synced_users';
  }, [selectedEnv]);

  const [syncedUsers, setSyncedUsers] = useState<SyncedUser[]>(() => {
    // Cargar desde localStorage al iniciar (usando el ambiente actual)
    if (typeof window !== 'undefined') {
      const key = selectedEnv ? `kbatch_synced_users_${selectedEnv}` : 'kbatch_synced_users';
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Recargar usuarios sincronizados cuando cambie el ambiente
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEnv) {
      const key = getSyncedUsersStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setSyncedUsers(JSON.parse(saved));
        } catch {
          setSyncedUsers([]);
        }
      } else {
        setSyncedUsers([]);
      }
    }
  }, [selectedEnv, getSyncedUsersStorageKey]);

  // Guardar en localStorage cada vez que cambie la lista (usando key por ambiente)
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedEnv) {
      localStorage.setItem(getSyncedUsersStorageKey(), JSON.stringify(syncedUsers));
    }
  }, [syncedUsers, getSyncedUsersStorageKey, selectedEnv]);
  
  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ message, type });
  };

  // Cargar TODOS los datos (todas las páginas) para filtrado local
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allFlattened: FlattenedProcess[] = [];
      let currentPage = 1;
      let totalPages = 1;
      const PAGE_SIZE = 100; // Máximo que permite la API
      const MAX_RECORDS = 10000; // Límite máximo de registros a cargar

      // Cargar todas las páginas (hasta 10K registros)
      do {
        const params = { page: currentPage, limit: PAGE_SIZE };
        const result = await userSyncService.getProcesses(params);
        
        // Mostrar warnings solo en la primera página
        if (currentPage === 1 && result.warnings && result.warnings.length > 0) {
          showToast(result.warnings[0], 'warning');
        }

        if (result.isCompanyMode) {
          // Modo company
          const companyData = result.data as ProcessSyncResponseCompany;
          const pageFlattened = companyData.processes.map(p => ({
            companyId: companyData.companyId,
            application: companyData.application,
            ...p
          }));
          allFlattened = [...allFlattened, ...pageFlattened];
          totalPages = companyData.pagination?.totalPages || 1;
          setServerPagination(companyData.pagination);
        } else {
          // Modo all/application
          const allData = result.data as ProcessSyncResponseAll;
          allData.companies.forEach(company => {
            company.processes.forEach(p => {
              allFlattened.push({
                companyId: company.companyId,
                application: company.application,
                ...p
              });
            });
          });
          totalPages = allData.pagination?.totalPages || 1;
          setServerPagination(allData.pagination);
        }

        currentPage++;
      } while (currentPage <= totalPages && allFlattened.length < MAX_RECORDS);

      setData(allFlattened);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      
      // Si es un error 404 (no encontrado), mostrar lista vacía en lugar de error
      if (message.includes('no existe') || message.includes('no tiene') || message.includes('No hay')) {
        setData([]);
        setServerPagination(null);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [userSyncService]);

  // Última actualización
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Cargar datos solo al iniciar (no auto-refresh al navegar entre secciones)
  // También se re-ejecuta cuando cambia el ambiente (apiBaseUrl → userSyncService → fetchData)
  useEffect(() => {
    fetchData().then(() => setLastUpdate(new Date()));
  }, [fetchData]);

  // Reset de filtros y estado de UI al cambiar de ambiente
  useEffect(() => {
    if (environmentVersion > 0) {
      setFilterApplication('');
      setFilterCompany('');
      setSearchUser('');
      setLocalPage(1);
      setShowSyncModal(false);
      setSelectedUserForDetail(null);
      setError(null);
    }
  }, [environmentVersion]);

  // Resetear página local cuando cambien los filtros
  useEffect(() => {
    setLocalPage(1);
  }, [filterApplication, filterCompany, searchUser]);

  // Función para parsear fechas en formato del servidor
  // Formatos: "Hoy, HH:MM:SS", "DD Mon YYYY", "DD Mes YYYY"
  const parseServerDate = (dateStr: string): number => {
    if (!dateStr) return 0;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Formato "Hoy, HH:MM:SS"
    if (dateStr.toLowerCase().startsWith('hoy')) {
      const timeMatch = dateStr.match(/(\d{1,2}):(\d{2}):?(\d{2})?/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        return today.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000;
      }
      return today.getTime() + 86400000; // Si no hay hora, poner al final del día
    }
    
    // Mapa de meses en español e inglés
    const monthMap: Record<string, number> = {
      'ene': 0, 'enero': 0, 'jan': 0,
      'feb': 1, 'febrero': 1,
      'mar': 2, 'marzo': 2,
      'abr': 3, 'abril': 3, 'apr': 3,
      'may': 4, 'mayo': 4,
      'jun': 5, 'junio': 5,
      'jul': 6, 'julio': 6,
      'ago': 7, 'agosto': 7, 'aug': 7,
      'sep': 8, 'sept': 8, 'septiembre': 8,
      'oct': 9, 'octubre': 9,
      'nov': 10, 'noviembre': 10,
      'dic': 11, 'diciembre': 11, 'dec': 11
    };
    
    // Formato "DD Mon YYYY" o "DD Mes YYYY"
    const dateMatch = dateStr.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const monthStr = dateMatch[2].toLowerCase();
      const year = parseInt(dateMatch[3], 10);
      const month = monthMap[monthStr];
      
      if (month !== undefined) {
        return new Date(year, month, day, 23, 59, 59).getTime();
      }
    }
    
    // Intentar parseo estándar ISO como fallback
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.getTime();
    }
    
    return 0; // Si no se puede parsear
  };

  // Aplicar TODOS los filtros localmente (búsqueda en tiempo real)
  const filteredData = data
    .filter(item => {
      // Filtro por Aplicación (parcial, case-insensitive)
      if (filterApplication.trim()) {
        const appSearch = filterApplication.toLowerCase();
        const itemApp = (item.application || '').toLowerCase();
        if (!itemApp.includes(appSearch)) return false;
      }
      
      // Filtro por Company ID (parcial, case-insensitive)
      if (filterCompany.trim()) {
        const companySearch = filterCompany.toLowerCase();
        const itemCompany = (item.companyId || '').toLowerCase();
        if (!itemCompany.includes(companySearch)) return false;
      }
      
      // Filtro por Usuario (nombre o email, parcial, case-insensitive)
      if (searchUser.trim()) {
        const userSearch = searchUser.toLowerCase();
        const matchesName = item.userName.toLowerCase().includes(userSearch);
        const matchesEmail = item.userEmail.toLowerCase().includes(userSearch);
        if (!matchesName && !matchesEmail) return false;
      }
      
      return true;
    })
    // Ordenar por fecha: más recientes primero
    .sort((a, b) => {
      const dateA = parseServerDate(a.createdAt);
      const dateB = parseServerDate(b.createdAt);
      return dateB - dateA; // Descendente (más reciente primero)
    });
  
  // Paginación local sobre datos filtrados
  const localTotalPages = Math.ceil(filteredData.length / LOCAL_PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (localPage - 1) * LOCAL_PAGE_SIZE,
    localPage * LOCAL_PAGE_SIZE
  );

  // Obtener valores únicos para mostrar estadísticas
  // Totales (sin filtrar)
  const allCompanies = [...new Set(data.map(d => d.companyId))];
  // Aplicaciones únicas case-insensitive (Payin y payin = misma app)
  const allApplications = [...new Set(data.map(d => d.application?.toLowerCase()).filter(Boolean))];
  const allUsers = [...new Set(data.map(d => d.userEmail))];
  // Filtrados
  const uniqueCompanies = [...new Set(filteredData.map(d => d.companyId))];
  // Aplicaciones únicas case-insensitive
  const uniqueApplications = [...new Set(filteredData.map(d => d.application?.toLowerCase()).filter(Boolean))];
  const uniqueUsers = [...new Set(filteredData.map(d => d.userEmail))];
  // ¿Hay filtros activos?
  const hasActiveFilters = filterApplication || filterCompany || searchUser;

  const handleClearFilters = () => {
    setFilterApplication('');
    setFilterCompany('');
    setSearchUser('');
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-full bg-slate-50">
      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Help Modal */}
      {showHelp && <UserManagementHelpModal onClose={() => setShowHelp(false)} />}

      {/* Sync User Modal */}
      {showSyncModal && (
        <SyncUserModal
          onClose={() => setShowSyncModal(false)}
          onSuccess={(user) => {
            // Agregar a la lista de usuarios sincronizados
            setSyncedUsers(prev => [user, ...prev]);
            // Refrescar la tabla de procesos y actualizar timestamp
            fetchData().then(() => setLastUpdate(new Date()));
          }}
          showToast={showToast}
        />
      )}

      {/* User Detail Modal */}
      {selectedUserForDetail && (
        <UserDetailModal
          userPublicId={selectedUserForDetail}
          onClose={() => setSelectedUserForDetail(null)}
          showToast={showToast}
        />
      )}

      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              Gestión de Usuarios y Procesos
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Vista unificada de todos los procesos con filtros por aplicación y organización.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 text-right">
              <div>Última actualización:</div>
              <div className="font-medium text-slate-500">{lastUpdate.toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={() => {
                fetchData().then(() => setLastUpdate(new Date()));
              }}
              disabled={loading}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Actualizar ahora"
            >
              <RefreshCw className={`h-5 w-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowHelp(true)}
              className="p-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-500 hover:text-blue-700"
              title="Ver ayuda sobre esta sección"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowSyncModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Sincronizar Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {filteredData.length === data.length ? (
                  data.length
                ) : (
                  <span>{filteredData.length} <span className="text-sm font-normal text-slate-400">de {data.length}</span></span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Total Procesos</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {!hasActiveFilters ? (
                  allCompanies.length
                ) : (
                  <span>{uniqueCompanies.length} <span className="text-sm font-normal text-slate-400">de {allCompanies.length}</span></span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Compañías</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {!hasActiveFilters ? (
                  allApplications.length
                ) : (
                  <span>{uniqueApplications.length} <span className="text-sm font-normal text-slate-400">de {allApplications.length}</span></span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Aplicaciones</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
            <div className="p-3 rounded-full bg-orange-50 text-orange-600 mr-4">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {!hasActiveFilters ? (
                  allUsers.length
                ) : (
                  <span>{uniqueUsers.length} <span className="text-sm font-normal text-slate-400">de {allUsers.length}</span></span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Usuarios</div>
            </div>
          </div>
        </div>

        {/* Usuarios Sincronizados (Persistente) */}
        {syncedUsers.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-green-800 flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Usuarios Sincronizados a KBatch ({syncedUsers.length})
              </h3>
              <button 
                onClick={() => {
                  setSyncedUsers([]);
                  localStorage.removeItem(getSyncedUsersStorageKey());
                }}
                className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center px-2 py-1 rounded hover:bg-red-50 border border-red-200"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar historial
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {syncedUsers.map((user, idx) => (
                <div 
                  key={`${user.public_id}-${idx}`}
                  className="bg-white p-3 rounded-lg border border-green-100 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                      {user.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-800 text-sm">{user.user_name}</div>
                      <div className="text-xs text-slate-500 truncate">{user.user_email}</div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 uppercase">Public ID:</span>
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 rounded select-all truncate max-w-[150px]" title={user.public_id}>
                            {user.public_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 uppercase">Company:</span>
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 rounded select-all truncate max-w-[150px]" title={user.company_id}>
                            {user.company_id}
                          </span>
                        </div>
                        {user.metadata?.application && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-400 uppercase">App:</span>
                            <span className="text-[10px] font-medium text-purple-600">{user.metadata.application}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500">
                            {new Date(user.created_at).toLocaleString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                Aplicación
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={filterApplication}
                  onChange={(e) => setFilterApplication(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Ej: Pay, Payin, Payout..."
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                Company ID
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Ej: cus_, org_kashio..."
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                Buscar Usuario
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Nombre o email..."
                />
              </div>
            </div>
            {(filterApplication || filterCompany || searchUser) && (
              <button 
                onClick={handleClearFilters}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400 flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              Búsqueda instantánea mientras escribes (case-insensitive)
            </p>
            {(filterApplication || filterCompany || searchUser) && (
              <p className="text-xs text-blue-600 font-medium">
                Mostrando {filteredData.length} de {data.length} registros
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Cargando procesos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-red-800 font-medium mb-1">Error al cargar</h3>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
              >
                Reintentar
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-slate-800 font-medium mb-1">Sin resultados</h3>
              {(filterApplication || filterCompany || searchUser) ? (
                <div className="text-slate-500 text-sm space-y-1">
                  <p>No se encontraron coincidencias para:</p>
                  {filterApplication && (
                    <p>Aplicación: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">"{filterApplication}"</span></p>
                  )}
                  {filterCompany && (
                    <p>Company: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">"{filterCompany}"</span></p>
                  )}
                  {searchUser && (
                    <p>Usuario: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">"{searchUser}"</span></p>
                  )}
                  <button 
                    onClick={handleClearFilters}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">
                  Aún no hay procesos registrados en el sistema.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                      <th className="px-4 py-3 border-b border-slate-200">Usuario</th>
                      <th className="px-4 py-3 border-b border-slate-200">Company ID</th>
                      <th className="px-4 py-3 border-b border-slate-200">Aplicación</th>
                      <th className="px-4 py-3 border-b border-slate-200">Archivo</th>
                      <th className="px-4 py-3 border-b border-slate-200">Tipo</th>
                      <th className="px-4 py-3 border-b border-slate-200">Estado</th>
                      <th className="px-4 py-3 border-b border-slate-200">Fecha</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {paginatedData.map((item, idx) => (
                      <tr key={`${item.filePublicId}-${idx}`} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs mr-2 flex-shrink-0">
                              {item.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-800 text-sm">{item.userName}</div>
                              <div className="text-xs text-slate-500 font-mono">{item.userEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1.5 rounded select-all break-all max-w-[280px]">
                            {item.companyId}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.application ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              <Layers className="h-3 w-3 mr-1" />
                              {item.application}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="truncate max-w-[180px] text-sm" title={item.fileName}>
                            {item.fileName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={item.type} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center text-xs text-slate-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {item.createdAt}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.fileUrl && (
                              <a 
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Descargar archivo"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Solo mostrar si hay más de una página */}
              {localTotalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
                  <div className="text-slate-500">
                    Página {localPage} de {localTotalPages} 
                    <span className="ml-2">({filteredData.length} registros)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Ir a primera página */}
                    <button
                      onClick={() => setLocalPage(1)}
                      disabled={localPage <= 1}
                      className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      title="Ir a página 1"
                    >
                      « 1
                    </button>
                    {/* Página anterior */}
                    <button
                      onClick={() => setLocalPage(p => Math.max(1, p - 1))}
                      disabled={localPage <= 1}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {/* Página actual */}
                    <span className="px-3 py-1 bg-blue-600 text-white rounded font-medium min-w-[40px] text-center">
                      {localPage}
                    </span>
                    {/* Página siguiente */}
                    <button
                      onClick={() => setLocalPage(p => Math.min(localTotalPages, p + 1))}
                      disabled={localPage >= localTotalPages}
                      className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    {/* Ir a última página */}
                    <button
                      onClick={() => setLocalPage(localTotalPages)}
                      disabled={localPage >= localTotalPages}
                      className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
                      title={`Ir a página ${localTotalPages}`}
                    >
                      {localTotalPages} »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
