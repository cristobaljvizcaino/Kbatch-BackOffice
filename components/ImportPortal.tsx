import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Download,
  AlertCircle,
  FileText,
  Loader2,
  HelpCircle,
  Sparkles,
  Package,
  X,
  Check,
  Info,
  CloudUpload,
  Cog,
  FileCheck,
  History,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  ExternalLink
} from 'lucide-react';
import { View } from '../types';
import { useApiBaseUrl, useEnvironmentVersion } from './EnvironmentContext';

// =============================================================================
// TIPOS
// =============================================================================
interface ProcessType {
  id: number;
  publicId: string;
  name: string;
  description: string;
  type: 1 | 2;
  config: {
    config: {
      fileType: string;
      validations?: Record<string, { jsonName: string; required: boolean; format?: string }>;
      maxRowsPerBlock?: number;
    };
  };
}

interface ProcessStatus {
  processId: string;
  status: string;
  message?: string;
  progress: {
    currentStep: string;
    percentage: number;
    blocks: {
      total: number;
      pending: number;
      sent: number;
      received: number;
      processedExternal: number;
      completed: number;
      error: number;
    };
  };
  startTime?: string;
  endTime?: string;
}

interface ProcessResult {
  file?: {
    id?: number;
    publicId?: string;
    fileName?: string;
    fileUrl?: string;
  };
  process?: {
    id?: number;
    publicId?: string;
    createdAt?: string;
  };
  blocks?: {
    total: number;
    processed: number;
  };
  processedBlocks?: {
    total: number;
    sent: number;
    error: number;
    details?: Array<{
      workerId: number;
      publicId: string;
      blockNumber: number;
      jsonUrl: string;
      status: string;
      message: string;
      // Campos adicionales del payload enviado a la API externa
      callBackUrl?: string;
      identificationId?: string;
      timestamp?: string;
      [key: string]: unknown;
    }>;
  };
}

// Tipo para historial de procesos
interface ProcessHistory {
  id: string;
  processId: string;
  filePublicId: string;
  fileName: string;
  processTypeName: string;
  completedAt: string;
  blocksTotal: number;
  blocksSuccess: number;
  blocksError: number;
  result: ProcessResult;
  userId?: string;
}

const HISTORY_STORAGE_KEY = 'kbatch_process_history';

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
interface ImportPortalProps {
  onNavigate?: (view: string) => void;
  isActive?: boolean;
}

// =============================================================================
// CONTENIDO DE AYUDA CONTEXTUAL POR PASO
// =============================================================================
const HELP_CONTENT: Record<number, { title: string; sections: Array<{ subtitle: string; content: string }> }> = {
  1: {
    title: '¿Cómo funciona la selección de proceso?',
    sections: [
      {
        subtitle: '¿Qué es un Tipo de Proceso?',
        content: 'Un tipo de proceso es una plantilla predefinida que le dice al sistema cómo interpretar tu archivo. Cada proceso tiene columnas específicas que debe tener tu archivo para ser procesado correctamente.'
      },
      {
        subtitle: '¿Cómo elegir el proceso correcto?',
        content: 'Busca el proceso que coincida con el tipo de datos que quieres importar. Por ejemplo, si vas a cargar una lista de clientes, selecciona un proceso de tipo "Clientes". Fíjate en las columnas requeridas (marcadas con *) - tu archivo DEBE tenerlas.\n\nSobre mayúsculas y minúsculas: No importa si escribes "MONTO" o "monto", el sistema lo reconocerá igual. Lo importante es que el nombre sea exactamente igual. Por ejemplo, si definiste "user_id" y tu archivo tiene "user id" (con espacio en vez de guión bajo), eso sí dará error.'
      },
      {
        subtitle: '¿Qué significan las etiquetas?',
        content: '• IMPORT: Indica que es un proceso de importación de datos.\n• XLSX/CSV: Formato de archivo que acepta.\n• Columnas con *: Son obligatorias en tu archivo.\n• Columnas sin *: Son opcionales.'
      },
      {
        subtitle: '¿No encuentras el proceso que necesitas?',
        content: 'Puedes crear un nuevo tipo de proceso desde "Configuración de Procesos". Ahí podrás definir las columnas, formatos de validación y el nombre del proceso según tus necesidades específicas.'
      },
      {
        subtitle: 'Formatos de archivo soportados',
        content: 'KBatch acepta archivos Excel (.xlsx), CSV (.csv), JSON (.json) y texto plano (.txt). El sistema validará automáticamente que tu archivo coincida con el formato configurado en el proceso.'
      }
    ]
  },
  2: {
    title: '¿Cómo preparar tu archivo?',
    sections: [
      {
        subtitle: 'Arrastra o selecciona tu archivo',
        content: 'Puedes arrastrar tu archivo directamente a la zona indicada o hacer clic para buscarlo en tu computadora. El archivo debe coincidir con el formato del proceso seleccionado (Excel, CSV, etc.).'
      },
      {
        subtitle: 'Estructura del archivo',
        content: 'Tu archivo debe tener una fila de encabezados (nombres de columnas) en la primera fila. Los nombres deben coincidir con las columnas del proceso seleccionado. No importa el orden de las columnas, el sistema las encuentra automáticamente.'
      },
      {
        subtitle: '¿Qué pasa si faltan columnas?',
        content: 'Si tu archivo no tiene las columnas obligatorias (marcadas con *), el sistema te lo indicará y no podrás continuar. Las columnas opcionales pueden faltar sin problema.'
      },
      {
        subtitle: 'Validación de datos',
        content: 'El sistema valida el formato de cada celda según la configuración (email, número, fecha, etc.). Los registros con errores se separan automáticamente y podrás ver un reporte detallado al final.'
      },
      {
        subtitle: 'Límite de tamaño',
        content: 'Puedes subir archivos de cualquier tamaño. Archivos grandes se dividen automáticamente en bloques para procesamiento eficiente. La URL de carga es válida por 1 hora.'
      },
      {
        subtitle: 'Usuario asociado (opcional)',
        content: 'Puedes asociar un usuario al proceso para tener trazabilidad completa de quién realizó cada importación. Escribe el ID del usuario en el campo correspondiente.'
      }
    ]
  },
  3: {
    title: '¿Qué está pasando ahora?',
    sections: [
      {
        subtitle: 'Subida segura a la nube',
        content: 'Tu archivo se está subiendo de forma segura a Amazon S3 (la nube de AWS). Usamos URLs prefirmadas que garantizan que solo tú puedes subir este archivo específico.'
      },
      {
        subtitle: '¿Por qué puede demorar?',
        content: 'El tiempo de subida depende del tamaño de tu archivo y tu conexión a internet. Archivos grandes pueden tomar varios minutos. No cierres esta ventana hasta que termine.'
      },
      {
        subtitle: 'Modo manual (si hay problemas)',
        content: 'Si la subida automática falla, el sistema te mostrará una URL para que puedas subir el archivo manualmente usando herramientas como Postman o cURL. Esto puede pasar por restricciones de seguridad del navegador.'
      },
      {
        subtitle: '¿Qué sigue después?',
        content: 'Una vez subido el archivo, el sistema iniciará automáticamente el procesamiento. Tu archivo será validado, dividido en bloques y enviado para procesar.'
      }
    ]
  },
  4: {
    title: '¿Cómo funciona el procesamiento?',
    sections: [
      {
        subtitle: 'Procesamiento en segundo plano',
        content: 'Tu archivo está siendo procesado de forma asíncrona en nuestros servidores. Esto significa que el trabajo pesado se hace en la nube mientras tú esperas el resultado.'
      },
      {
        subtitle: 'Etapas del procesamiento',
        content: '1. VALIDATING: Verificando estructura del archivo\n2. SPLITTING_BLOCKS: Dividiendo en bloques manejables\n3. PROCESSING_BLOCKS: Validando y procesando cada bloque\n4. COMPLETED: Todo listo'
      },
      {
        subtitle: '¿Qué se está validando?',
        content: 'El sistema verifica: que existan las columnas requeridas, que los formatos sean correctos (emails válidos, números, fechas, etc.), y prepara los datos para enviarlos al sistema externo correspondiente.'
      },
      {
        subtitle: 'División en bloques',
        content: 'Archivos grandes se dividen automáticamente en bloques (típicamente de 500 registros). Cada bloque se procesa independientemente, lo que permite manejar archivos muy grandes sin problemas de memoria.'
      },
      {
        subtitle: '¿Qué pasa con los errores?',
        content: 'Los registros con errores de validación se separan automáticamente. Al final podrás ver exactamente qué registros fallaron, en qué fila están y cuál fue el problema específico.'
      },
      {
        subtitle: 'Porcentaje de progreso',
        content: 'El porcentaje muestra cuántos bloques han sido completados. Un bloque se considera completo cuando ha sido validado y procesado, ya sea exitosamente o con errores identificados.'
      }
    ]
  },
  5: {
    title: '¿Cómo interpretar los resultados?',
    sections: [
      {
        subtitle: 'Resumen del procesamiento',
        content: 'Verás un resumen con: total de registros procesados, cuántos fueron exitosos, cuántos tuvieron errores, y el estado final del proceso.'
      },
      {
        subtitle: 'Bloques válidos vs errores',
        content: '• Bloques válidos: Registros que pasaron todas las validaciones y fueron enviados al sistema externo.\n• Bloques con errores: Registros que fallaron alguna validación (formato incorrecto, datos faltantes, etc.).'
      },
      {
        subtitle: 'Descargar archivos JSON',
        content: 'Puedes descargar los archivos JSON generados:\n• block_X_valid.json: Datos procesados exitosamente\n• block_X_errors.json: Detalle de errores con fila y mensaje específico'
      },
      {
        subtitle: 'Estados finales',
        content: '• COMPLETED: Todo procesado correctamente\n• IN_PROGRESS: Bloques enviados, esperando confirmación externa\n• PROCESSED_EXTERNAL: Sistema externo procesó los datos\n• REJECTED: Error grave que impidió procesar'
      },
      {
        subtitle: '¿Qué hacer con los errores?',
        content: 'Revisa el archivo de errores para ver exactamente qué registros fallaron y por qué. Corrige los datos en tu archivo original y vuelve a importar solo los registros corregidos.'
      },
      {
        subtitle: 'Historial de importaciones',
        content: 'Todas tus importaciones quedan registradas. Puedes ver el historial en "Gestión de Usuarios y Procesos" para consultar importaciones anteriores y sus resultados.'
      }
    ]
  }
};

// Componente Modal de Ayuda
const HelpModal: React.FC<{ step: number; onClose: () => void }> = ({ step, onClose }) => {
  const content = HELP_CONTENT[step];
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            <h2 className="text-lg font-bold">{content.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {content.sections.map((section, idx) => (
            <div key={idx} className="border-l-4 border-blue-200 pl-4">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                  {idx + 1}
                </span>
                {section.subtitle}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Paso {step} de 5 • Portal de Importación
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// Botón de ayuda reutilizable
const HelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="ml-3 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
    title="Ver ayuda"
  >
    <HelpCircle className="h-5 w-5" />
  </button>
);

const ImportPortal: React.FC<ImportPortalProps> = ({ onNavigate, isActive }) => {
  const API_BASE_URL = useApiBaseUrl();
  const environmentVersion = useEnvironmentVersion();
  // Estado del modal de ayuda
  const [showHelp, setShowHelp] = useState(false);
  
  // Estados del wizard - Ahora son 5 pasos
  const [step, setStep] = useState(1);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [selectedProcessType, setSelectedProcessType] = useState<ProcessType | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  // Estados de archivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de procesamiento
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [filePublicId, setFilePublicId] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processStatus, setProcessStatus] = useState<ProcessStatus | null>(null);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para modo manual (cuando CORS falla)
  const [manualUploadMode, setManualUploadMode] = useState(false);
  const [manualUploadUrl, setManualUploadUrl] = useState<string | null>(null);
  const [manualFileId, setManualFileId] = useState<string | null>(null);

  // Estado para usuario (trazabilidad)
  const [userId, setUserId] = useState<string>('');

  // Estados para historial de procesos
  const [processHistory, setProcessHistory] = useState<ProcessHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ProcessHistory | null>(null);

  // Estado para bloque expandido (ver detalle del payload enviado a la API externa)
  const [expandedBlockIdx, setExpandedBlockIdx] = useState<number | null>(null);
  const [historyExpandedBlockIdx, setHistoryExpandedBlockIdx] = useState<number | null>(null);
  const [workerDetail, setWorkerDetail] = useState<Record<string, unknown> | null>(null);
  const [loadingWorkerDetail, setLoadingWorkerDetail] = useState(false);

  // Fetch detalle completo de un worker/bloque desde GET /file/worker/info/:publicId
  const [workerDetailError, setWorkerDetailError] = useState(false);
  const fetchWorkerDetail = async (publicId: string) => {
    setLoadingWorkerDetail(true);
    setWorkerDetail(null);
    setWorkerDetailError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/file/worker/info/${publicId}`);
      const result = await response.json();
      if (result.isSuccess && result.data?.block) {
        setWorkerDetail(result.data.block);
      } else {
        setWorkerDetailError(true);
      }
    } catch (err) {
      console.error('Error fetching worker detail:', err);
      setWorkerDetailError(true);
    } finally {
      setLoadingWorkerDetail(false);
    }
  };

  // Los 5 pasos del wizard
  const STEPS = [
    { num: 1, label: 'Tipo de Proceso', icon: Package },
    { num: 2, label: 'Preparar Archivo', icon: FileText },
    { num: 3, label: 'Subiendo', icon: CloudUpload },
    { num: 4, label: 'Procesando', icon: Cog },
    { num: 5, label: 'Resultados', icon: FileCheck }
  ];

  // Cargar tipos de proceso (solo importación)
  const fetchProcessTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/process-type?type=1&limit=50`);
      const result = await response.json();
      if (result.isSuccess) {
        const freshTypes = result.data.processTypes || [];
        setProcessTypes(freshTypes);
        // Sincronizar selectedProcessType con datos frescos (por si se editó en Configuración)
        if (selectedProcessType) {
          const updated = freshTypes.find((pt: ProcessType) => pt.publicId === selectedProcessType.publicId);
          if (updated) {
            setSelectedProcessType(updated);
          }
        }
      }
    } catch (err) {
      console.error('Error loading process types:', err);
    } finally {
      setLoadingTypes(false);
    }
  };

  // Cargar datos cuando la sección se vuelve visible (auto-refresh al navegar)
  // También recargar cuando cambia el ambiente (environmentVersion)
  useEffect(() => {
    if (isActive) fetchProcessTypes();
  }, [isActive, environmentVersion]);

  // Reset del wizard al cambiar de ambiente para evitar estados inválidos
  useEffect(() => {
    if (environmentVersion > 0) {
      setStep(1);
      setSelectedProcessType(null);
      setSelectedFile(null);
      setFilePublicId(null);
      setProcessId(null);
      setProcessStatus(null);
      setProcessResult(null);
      setError(null);
      setManualUploadMode(false);
      setManualUploadUrl(null);
      setManualFileId(null);
      setWorkerDetail(null);
    }
  }, [environmentVersion]);

  // Cargar historial desde localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setProcessHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, []);

  // Guardar proceso en historial
  const saveToHistory = (result: ProcessResult) => {
    const historyItem: ProcessHistory = {
      id: `hist_${Date.now()}`,
      processId: processId || '',
      filePublicId: filePublicId || '',
      fileName: result.file?.fileName || selectedFile?.name || 'Archivo',
      processTypeName: selectedProcessType?.name || 'Proceso',
      completedAt: new Date().toISOString(),
      blocksTotal: result.processedBlocks?.total || 0,
      blocksSuccess: result.processedBlocks?.sent || 0,
      blocksError: result.processedBlocks?.error || 0,
      result: result,
      // Usuario para trazabilidad
      userId: userId || undefined
    };

    setProcessHistory(prev => {
      // Mantener máximo 20 procesos en el historial
      const updated = [historyItem, ...prev].slice(0, 20);
      // Guardar en localStorage
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving history:', err);
      }
      return updated;
    });
  };

  // Eliminar del historial
  const removeFromHistory = (id: string) => {
    setProcessHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving history:', err);
      }
      return updated;
    });
    if (selectedHistoryItem?.id === id) {
      setSelectedHistoryItem(null);
    }
  };

  // Limpiar todo el historial
  const clearHistory = () => {
    setProcessHistory([]);
    setSelectedHistoryItem(null);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Ref para controlar si el polling debe detenerse
  const stopPollingRef = useRef(false);

  // ============================================================
  // PASO 4: Polling con /process/{processId}/status SOLAMENTE
  // Cuando estado = IN_PROGRESS → ir a paso 5
  // ============================================================
  useEffect(() => {
    if (!processId || step !== 4) return;
    
    stopPollingRef.current = false;
    let intervalId: NodeJS.Timeout | null = null;

    const checkStatus = async () => {
      if (stopPollingRef.current) return;
      
      try {
        console.log('[Paso 4] Consultando /process/{processId}/status...');
        const response = await fetch(`${API_BASE_URL}/file/process/${processId}/status`);
        const result = await response.json();
        console.log('Status:', result.data?.status, result.data?.progress?.currentStep);
        
        if (result.isSuccess && result.data) {
          setProcessStatus(result.data);
          const status = result.data.status;
          
          // IN_PROGRESS, COMPLETED, REJECTED, PROCESSED_EXTERNAL = PROCESO TERMINADO
          if (status === 'IN_PROGRESS' || status === 'COMPLETED' || 
              status === 'REJECTED' || status === 'PROCESSED_EXTERNAL') {
            console.log('✅ PROCESO TERMINADO:', status, '→ Ir a paso 5');
            
            // Detener polling
            stopPollingRef.current = true;
            if (intervalId) clearInterval(intervalId);
            
            setProcessing(false);
            setError(null);
            setStep(5); // IR AL PASO 5
          }
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    checkStatus(); // Primera llamada
    intervalId = setInterval(checkStatus, 2000); // Cada 2 segundos

    return () => {
      stopPollingRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [processId, step]);

  // ============================================================
  // PASO 5: Obtener resultados con /file/result/{fileId}
  // ============================================================
  const [loadingResults, setLoadingResults] = useState(false);
  
  useEffect(() => {
    if (step !== 5 || !filePublicId || processResult) return;
    
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        console.log('[Paso 5] Obteniendo resultados con /file/result/', filePublicId);
        const response = await fetch(`${API_BASE_URL}/file/result/${filePublicId}`);
        const result = await response.json();
        console.log('Results:', result);
        
        // La API devuelve { success: true, data: { file, processedBlocks, ... } }
        if ((result.success || result.isSuccess) && result.data) {
          // Guardar result.data directamente (contiene file, processedBlocks, etc.)
          setProcessResult(result.data);
          setError(null);
          // Guardar en historial
          saveToHistory(result.data);
        } else {
          setError(result.message || 'Error al obtener resultados');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al obtener los resultados');
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [step, filePublicId, processResult]);

  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!selectedProcessType) return;
    
    const allowedExtensions = ['xlsx', 'csv', 'json', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      setError('Solo se permiten archivos Excel (.xlsx), CSV, JSON o TXT');
      return;
    }

    const expectedType = selectedProcessType.config?.config?.fileType?.toLowerCase();
    if (expectedType && extension !== expectedType) {
      setError(`Este proceso espera archivos .${expectedType}, pero seleccionaste un .${extension}`);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  // Obtener MIME type
  const getMimeType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'json': 'application/json',
      'txt': 'text/plain'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  // PASO 3: Subir archivo a S3
  const handleUploadToS3 = async () => {
    if (!selectedFile || !selectedProcessType) return;

    setStep(3); // Ir al paso de subida
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Paso 3.1: Obtener URL prefirmada
      setUploadProgress(10);
      console.log('Obteniendo URL prefirmada...');
      
      // Construir body con userId opcional
      const requestBody: Record<string, unknown> = {
        fileName: selectedFile.name,
        fileType: getMimeType(selectedFile.name),
        processType: selectedProcessType.publicId,
        type: 1
      };
      
      // Agregar userId si está definido (para trazabilidad)
      if (userId.trim()) {
        requestBody.userId = userId.trim();
      }
      
      const presignedResponse = await fetch(`${API_BASE_URL}/file/generate-presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const presignedResult = await presignedResponse.json();
      console.log('Presigned URL Response:', presignedResult);
      
      if (!presignedResult.isSuccess) {
        throw new Error(presignedResult.message || 'Error al preparar la subida');
      }

      const presignedData = presignedResult.data?.presignedUrl;
      if (!presignedData?.dataUrl?.presignedUrl) {
        throw new Error('Respuesta inesperada del servidor');
      }

      const uploadUrl = presignedData.dataUrl.presignedUrl;
      const fileId = presignedData.file;
      setFilePublicId(fileId);
      setUploadProgress(30);
      
      // Guardar para modo manual en caso de error CORS
      setManualUploadUrl(uploadUrl);
      setManualFileId(fileId);

      // Paso 3.2: Subir archivo a S3
      console.log('Subiendo archivo a S3...');
      console.log('Upload URL:', uploadUrl);
      
      // IMPORTANTE: La presigned URL tiene X-Amz-SignedHeaders=host
      // NO debemos enviar headers adicionales que no estén firmados
      // Usamos fetch con mode: 'cors' sin headers adicionales
      
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          mode: 'cors',
          body: selectedFile
          // NO enviamos Content-Type porque no está en los SignedHeaders
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => '');
          console.error('Error en subida S3:', uploadResponse.status, errorText);
          throw new Error(`Error al subir archivo: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        console.log('Archivo subido exitosamente a S3');
        setUploadProgress(95);
      } catch (uploadError) {
        console.error('Error de red en subida:', uploadError);
        
        // Si falla con fetch, intentar con XMLHttpRequest sin headers
        console.log('Reintentando con XMLHttpRequest...');
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 60) + 30;
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              console.log('Archivo subido exitosamente (XMLHttpRequest)');
              setUploadProgress(95);
              resolve();
            } else {
              console.error('Error en subida XHR:', xhr.status, xhr.statusText, xhr.responseText);
              reject(new Error(`Error al subir: ${xhr.status} - ${xhr.responseText || xhr.statusText}`));
            }
          });

          xhr.addEventListener('error', () => {
            console.error('Error de red XHR:', xhr.statusText);
            reject(new Error('Error de conexión. Verifica la configuración CORS del bucket S3.'));
          });

          xhr.open('PUT', uploadUrl);
          // NO enviamos Content-Type
          xhr.send(selectedFile);
        });
      }

      setUploadProgress(100);
      setUploading(false);

      // Paso 3.3: Iniciar procesamiento automáticamente
      console.log('Iniciando procesamiento...');
      await startProcessing(fileId);

    } catch (err) {
      console.error('Error en subida:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      
      // Si tenemos la URL y el fileId, activar modo manual
      if (manualUploadUrl && manualFileId) {
        console.log('Activando modo manual debido a error de CORS');
        setManualUploadMode(true);
        setUploading(false);
        setError(null); // Limpiar error porque vamos a modo manual
      } else {
        setError(errorMessage);
        setUploading(false);
        setStep(2);
      }
    }
  };

  // PASO 4: Iniciar procesamiento
  const startProcessing = async (fileId: string) => {
    setStep(4);
    setProcessing(true);
    setError(null); // Limpiar errores previos

    try {
      console.log('Llamando start-processing para:', fileId);
      const processResponse = await fetch(`${API_BASE_URL}/file/start-processing/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const processResultData = await processResponse.json();
      console.log('Start processing response:', processResultData);
      
      if (!processResultData.isSuccess) {
        // Capturar el mensaje de error más específico
        const errorMessage = processResultData.error || processResultData.message || 'Error al iniciar el procesamiento';
        throw new Error(errorMessage);
      }

      if (!processResultData.data?.processId) {
        throw new Error('No se recibió el ID del proceso');
      }

      setProcessId(processResultData.data.processId);
      // El polling se activará automáticamente por el useEffect

    } catch (err) {
      console.error('Error al iniciar procesamiento:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al procesar el archivo';
      setError(errorMessage);
      setProcessing(false);
    }
  };

  // Reiniciar wizard
  const handleReset = () => {
    setStep(1);
    setSelectedProcessType(null);
    setSelectedFile(null);
    setManualUploadMode(false);
    setManualUploadUrl(null);
    setManualFileId(null);
    setFilePublicId(null);
    setProcessId(null);
    setProcessStatus(null);
    setProcessResult(null);
    setError(null);
    setUploading(false);
    setUploadProgress(0);
    setProcessing(false);
    setExpandedBlockIdx(null);
    setHistoryExpandedBlockIdx(null);
    setWorkerDetail(null);
    setWorkerDetailError(false);
    // Limpiar userId
    setUserId('');
  };

  // Obtener columnas requeridas (muestra el jsonName que es lo que debe tener el archivo)
  const getRequiredColumns = (pt: ProcessType | null) => {
    if (!pt?.config?.config?.validations) return [];
    return Object.entries(pt.config.config.validations)
      .filter(([_, v]) => (v as { required?: boolean }).required)
      .map(([key, v]) => (v as { jsonName?: string }).jsonName || key);
  };

  // =============================================================================
  // RENDERIZADO
  // =============================================================================
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Sparkles className="h-7 w-7 mr-3 text-blue-600" />
            Portal de Importación de Archivos
          </h1>
          <p className="text-slate-500 mt-2">
            Sube tus archivos de forma fácil y segura. Te guiaremos paso a paso.
          </p>
        </div>
        {/* Botón Historial */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
            showHistory 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="h-5 w-5 mr-2" />
          Procesos Recientes
          {processHistory.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
              showHistory ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
            }`}>
              {processHistory.length}
            </span>
          )}
          {showHistory ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </button>
      </div>

      {/* Panel de Historial */}
      {showHistory && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-slate-500 mr-2" />
              <h3 className="font-bold text-slate-800">Historial de Procesos</h3>
            </div>
            {processHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm text-red-500 hover:text-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar historial
              </button>
            )}
          </div>
          
          {processHistory.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay procesos recientes</p>
              <p className="text-slate-400 text-sm mt-1">Los procesos completados aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {processHistory.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    selectedHistoryItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-5 w-5 text-slate-400 mr-2" />
                        <span className="font-medium text-slate-800">{item.fileName}</span>
                        <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          {item.processTypeName}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-slate-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(item.completedAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        <span className="mx-2">•</span>
                        <span className="text-green-600 font-medium">{item.blocksSuccess} enviados</span>
                        {item.blocksError > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-red-500 font-medium">{item.blocksError} errores</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedHistoryItem(selectedHistoryItem?.id === item.id ? null : item);
                          setHistoryExpandedBlockIdx(null);
                          setWorkerDetail(null);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeFromHistory(item.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Detalles expandidos */}
                  {selectedHistoryItem?.id === item.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-slate-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-slate-800">{item.blocksTotal}</div>
                          <div className="text-xs text-slate-500">Total bloques</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{item.blocksSuccess}</div>
                          <div className="text-xs text-slate-500">Enviados</div>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-red-600">{item.blocksError}</div>
                          <div className="text-xs text-slate-500">Errores</div>
                        </div>
                      </div>
                      
                      {/* Lista de bloques con detalle expandible */}
                      {item.result.processedBlocks?.details && item.result.processedBlocks.details.length > 0 && (
                        <div className="max-h-[350px] overflow-auto">
                          <p className="text-sm font-medium text-slate-700 mb-2">Detalle de bloques:</p>
                          <div className="space-y-1">
                            {item.result.processedBlocks.details.map((block, idx) => {
                              const isHistBlockExpanded = historyExpandedBlockIdx === idx;
                              return (
                                <div key={idx} className={`rounded-lg border overflow-hidden transition-all ${
                                  block.status === 'ERROR' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                                }`}>
                                  <div className="p-2 text-sm flex items-center justify-between">
                                    <div className="flex items-center flex-1 min-w-0">
                                      {block.status === 'ERROR' ? (
                                        <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                      )}
                                      <span>Bloque {block.blockNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                      {block.jsonUrl && (
                                        <a 
                                          href={block.jsonUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-700 flex items-center p-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                      )}
                                      <button
                                        onClick={() => {
                                          if (isHistBlockExpanded) {
                                            setHistoryExpandedBlockIdx(null);
                                            setWorkerDetail(null);
                                          } else {
                                            setHistoryExpandedBlockIdx(idx);
                                            const wId = block.publicId || String(block.workerId);
                                            if (wId) fetchWorkerDetail(wId);
                                          }
                                        }}
                                        className={`text-xs flex items-center px-1.5 py-0.5 rounded transition-colors ${
                                          isHistBlockExpanded 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                        title="Ver información completa del bloque"
                                      >
                                        <Info className="h-3 w-3 mr-0.5" />
                                        {isHistBlockExpanded ? 'Ocultar' : 'Ver más'}
                                        {isHistBlockExpanded ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Panel expandible del historial */}
                                  {isHistBlockExpanded && (
                                    <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3">
                                      {loadingWorkerDetail ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
                                          <span className="text-xs text-slate-500">Cargando detalle del bloque...</span>
                                        </div>
                                      ) : workerDetail ? (() => {
                                        const wd = workerDetail as Record<string, unknown>;
                                        const meta = wd.metadata as Record<string, unknown> | undefined;
                                        const statusObj = wd.status as Record<string, unknown> | undefined;
                                        const config = wd.configuration as Record<string, unknown> | undefined;
                                        const statusName = String(statusObj?.name || '');
                                        const isError = statusName === 'ERROR';
                                        const formattedDate = meta?.createdAt 
                                          ? new Date(String(meta.createdAt)).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                          : '—';
                                        return (
                                          <div className="space-y-2.5">
                                            {/* Resumen rápido en cards */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                              <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-sm">
                                                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Bloque</div>
                                                <div className="text-base font-bold text-slate-800">{String(wd.blockNumber ?? block.blockNumber)}</div>
                                              </div>
                                              <div className={`rounded-lg border p-2 text-center shadow-sm ${isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Estado</div>
                                                <div className={`text-xs font-bold ${isError ? 'text-red-600' : 'text-green-600'}`}>
                                                  {statusName === 'SENT' ? 'Enviado' : statusName === 'ERROR' ? 'Error' : statusName === 'COMPLETED' ? 'Completado' : statusName || '—'}
                                                </div>
                                              </div>
                                              <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-sm">
                                                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Registros</div>
                                                <div className="text-base font-bold text-slate-800">{String(meta?.lineCount ?? '—')}</div>
                                              </div>
                                              <div className="bg-white rounded-lg border border-slate-200 p-2 text-center shadow-sm">
                                                <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Rango</div>
                                                <div className="text-xs font-bold text-slate-800">{String(meta?.blockRange || '—')}</div>
                                              </div>
                                            </div>

                                            {/* Mensaje del proceso */}
                                            {wd.processMessage && (
                                              <div className={`rounded-lg border px-3 py-2 text-xs ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                <div className="flex items-start">
                                                  <Info className={`h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 ${isError ? 'text-red-400' : 'text-blue-400'}`} />
                                                  <span>{String(wd.processMessage)}</span>
                                                </div>
                                              </div>
                                            )}

                                            {statusObj?.description && !wd.processMessage && (
                                              <div className={`rounded-lg border px-3 py-2 text-xs ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                                <div className="flex items-start">
                                                  <Info className={`h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 ${isError ? 'text-red-400' : 'text-green-400'}`} />
                                                  <span>{String(statusObj.description)}</span>
                                                </div>
                                              </div>
                                            )}

                                            {/* Errores de registros */}
                                            {meta?.failedRecords != null && Number(meta.failedRecords) > 0 && (
                                              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                                                <div className="flex items-center mb-1">
                                                  <AlertCircle className="h-3.5 w-3.5 text-red-500 mr-1" />
                                                  <span className="text-[11px] font-semibold text-red-700">Registros con error: {String(meta.failedRecords)}</span>
                                                </div>
                                                {meta.partialErrorMessage && <p className="text-[11px] text-red-600 mb-0.5">{String(meta.partialErrorMessage)}</p>}
                                                {meta.failedRecordIndices && <p className="text-[10px] text-red-500 font-mono break-all">Posiciones: {JSON.stringify(meta.failedRecordIndices)}</p>}
                                              </div>
                                            )}

                                            {/* Detalles del procesamiento */}
                                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                                                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Detalle del procesamiento</span>
                                              </div>
                                              <div className="divide-y divide-slate-100">
                                                <div className="flex items-center px-3 py-2">
                                                  <span className="text-[11px] text-slate-500 w-36 flex-shrink-0">Fecha de creación</span>
                                                  <span className="text-[11px] font-medium text-slate-700">{formattedDate}</span>
                                                </div>
                                                <div className="flex items-center px-3 py-2">
                                                  <span className="text-[11px] text-slate-500 w-36 flex-shrink-0">ID de identificación</span>
                                                  <span className="text-[11px] font-medium text-slate-700">{String(wd.identificationId || 'No asignado')}</span>
                                                </div>
                                                {config && (
                                                  <>
                                                    <div className="flex items-center px-3 py-2">
                                                      <span className="text-[11px] text-slate-500 w-36 flex-shrink-0">Máximo por bloque</span>
                                                      <span className="text-[11px] font-medium text-slate-700">{String(config.maxRowsPerBlock ?? '—')} registros</span>
                                                    </div>
                                                    <div className="flex items-center px-3 py-2">
                                                      <span className="text-[11px] text-slate-500 w-36 flex-shrink-0">Tamaño del bloque</span>
                                                      <span className="text-[11px] font-medium text-slate-700">{String(config.blockSize ?? '—')} registros</span>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            </div>

                                            {/* Datos técnicos (colapsable) */}
                                            <details className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group">
                                              <summary className="px-3 py-2 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wide list-none">
                                                <span className="flex items-center">
                                                  <ExternalLink className="h-3 w-3 mr-1" />
                                                  Datos técnicos (API)
                                                </span>
                                                <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                                              </summary>
                                              <div className="p-2.5 space-y-2">
                                                <div className="flex justify-end">
                                                  <button 
                                                    onClick={() => {
                                                      const payload = {
                                                        jsonUrl: wd.urlFile || block.jsonUrl || null,
                                                        workerId: wd.publicId || block.publicId || null,
                                                        callBackUrl: `${API_BASE_URL}/file/worker/status/${wd.publicId || block.publicId}`,
                                                        identificationId: wd.identificationId || null,
                                                        timestamp: meta?.createdAt || null,
                                                        blockNumber: wd.blockNumber || block.blockNumber
                                                      };
                                                      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                                                    }}
                                                    className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 font-medium"
                                                  >
                                                    Copiar JSON
                                                  </button>
                                                </div>
                                                <div className="divide-y divide-slate-100 text-[10px]">
                                                  <div className="flex items-start py-1">
                                                    <span className="text-slate-400 w-32 flex-shrink-0 font-medium">Archivo de datos</span>
                                                    <span className="text-blue-600 break-all">{String(wd.urlFile || block.jsonUrl || '—')}</span>
                                                  </div>
                                                  <div className="flex items-start py-1">
                                                    <span className="text-slate-400 w-32 flex-shrink-0 font-medium">ID Worker</span>
                                                    <span className="text-slate-700 font-mono">{String(wd.publicId || '—')}</span>
                                                  </div>
                                                  <div className="flex items-start py-1">
                                                    <span className="text-slate-400 w-32 flex-shrink-0 font-medium">URL de respuesta</span>
                                                    <span className="text-blue-600 break-all">{`${API_BASE_URL}/file/worker/status/${wd.publicId || block.publicId}`}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </details>
                                          </div>
                                        );
                                      })() : (
                                        <div className="py-2">
                                          {/* Fallback: datos básicos del bloque + reintentar */}
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                                            <div className="bg-white rounded-lg border border-slate-200 p-2 text-center">
                                              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Bloque</div>
                                              <div className="text-base font-bold text-slate-800">{String(block.blockNumber)}</div>
                                            </div>
                                            <div className={`rounded-lg border p-2 text-center ${block.status === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                              <div className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">Estado</div>
                                              <div className={`text-xs font-bold ${block.status === 'ERROR' ? 'text-red-600' : 'text-green-600'}`}>{block.status}</div>
                                            </div>
                                          </div>
                                          <div className="divide-y divide-slate-100 text-[10px] bg-white rounded-lg border border-slate-200 p-2.5 mb-2">
                                            <div className="flex items-start py-1">
                                              <span className="text-slate-400 w-32 flex-shrink-0 font-medium">Archivo de datos</span>
                                              <span className="text-blue-600 break-all">{String(block.jsonUrl || '—')}</span>
                                            </div>
                                            <div className="flex items-start py-1">
                                              <span className="text-slate-400 w-32 flex-shrink-0 font-medium">ID Worker</span>
                                              <span className="text-slate-700 font-mono">{String(block.publicId || block.workerId || '—')}</span>
                                            </div>
                                          </div>
                                          {workerDetailError && (
                                            <button
                                              onClick={() => {
                                                const wId = block.publicId || String(block.workerId);
                                                if (wId) fetchWorkerDetail(wId);
                                              }}
                                              className="mx-auto flex items-center text-[11px] text-blue-600 hover:text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors font-medium"
                                            >
                                              <RefreshCw className="h-3 w-3 mr-1" />
                                              Reintentar carga completa
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Steps - 5 pasos */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.num 
                    ? step === s.num 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > s.num ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium text-center max-w-[80px] ${step >= s.num ? 'text-slate-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 rounded ${step > s.num ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Ha ocurrido un problema</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* ============================================================= */}
      {/* Modal de Ayuda */}
      {showHelp && <HelpModal step={step} onClose={() => setShowHelp(false)} />}

      {/* PASO 1: Seleccionar Tipo de Proceso */}
      {/* ============================================================= */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg mr-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">¿Qué tipo de datos quieres importar?</h2>
                <p className="text-slate-500 text-sm">Selecciona el proceso que corresponde a tu archivo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProcessTypes}
                disabled={loadingTypes}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
                title="Refrescar tipos de proceso"
              >
                <RefreshCw className={`h-4 w-4 ${loadingTypes ? 'animate-spin' : ''}`} />
              </button>
              <HelpButton onClick={() => setShowHelp(true)} />
            </div>
          </div>

          {loadingTypes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <span className="ml-3 text-slate-500">Cargando opciones...</span>
            </div>
          ) : processTypes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>No hay procesos de importación configurados</p>
            </div>
          ) : (
            <div className="grid gap-4 max-h-[400px] overflow-auto pr-2">
              {processTypes.map((pt) => (
                <div
                  key={pt.publicId}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedProcessType?.publicId === pt.publicId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedProcessType(pt)}
                    >
                      <div className="flex items-center flex-wrap gap-2">
                        <FileSpreadsheet className={`h-5 w-5 ${
                          selectedProcessType?.publicId === pt.publicId ? 'text-blue-600' : 'text-slate-400'
                        }`} />
                        <h3 className="font-bold text-slate-800">{pt.name}</h3>
                        {/* Etiqueta IMPORT */}
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-bold">
                          IMPORT
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full uppercase">
                          {pt.config?.config?.fileType || 'XLSX'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1 ml-7">{pt.description || 'Sin descripción'}</p>
                      
                      {pt.config?.config?.validations && (
                        <div className="mt-3 ml-7">
                          <p className="text-xs text-slate-400 mb-1">Columnas que debe tener tu archivo:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(pt.config.config.validations).map(([col, configVal]) => {
                              const validation = configVal as { jsonName: string; required: boolean; format?: string; nameChange?: string };
                              // Mostrar el jsonName que es el campo que debe tener el archivo
                              const displayName = validation.jsonName || col;
                              return (
                                <span 
                                  key={col} 
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    validation.required 
                                      ? 'bg-blue-100 text-blue-700 font-medium' 
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {displayName} {validation.required && '*'}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Botón para ver más detalles */}
                      <div className="mt-3 ml-7">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigate) {
                              // Navegar a Configuration pasando el publicId del proceso
                              onNavigate(`CONFIGURATION:${pt.publicId}`);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center"
                        >
                          <Info className="h-3 w-3 mr-1" />
                          Ver configuración completa del proceso
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    </div>
                    <div 
                      onClick={() => setSelectedProcessType(pt)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        selectedProcessType?.publicId === pt.publicId
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 hover:border-blue-400'
                      }`}>
                      {selectedProcessType?.publicId === pt.publicId && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedProcessType}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-blue-200"
            >
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 2: Preparar Archivo */}
      {/* ============================================================= */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg mr-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Prepara tu archivo</h2>
                <p className="text-slate-500 text-sm">
                  Proceso: <span className="font-medium text-blue-700">{selectedProcessType?.name}</span>
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">IMPORT</span>
                </p>
              </div>
            </div>
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>

          {/* Sección de Usuario (Trazabilidad) */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-purple-800">
                    User ID (para trazabilidad)
                  </label>
                  <p className="text-purple-600 text-xs">
                    ID del usuario sincronizado en KBatch
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <input 
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                  placeholder="Ej: usr_d1_9PpNyjMTXpCG..."
                />
              </div>
            </div>
            
            {!userId.trim() && (
              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3 flex-shrink-0">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 font-bold">
                      ¿No tienes un User ID?
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Para tener <strong>trazabilidad completa</strong> de tus procesos, primero debes sincronizar 
                      un usuario en la sección <strong>"Gestión de Usuarios"</strong>.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Allí podrás crear un nuevo usuario y obtener su User ID para usarlo aquí.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 italic">
                      Si no necesitas trazabilidad, puedes continuar sin User ID.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('USER_MANAGEMENT')}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ir a Gestión de Usuarios
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info del proceso */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Requisitos del archivo:</p>
                <ul className="mt-2 text-blue-700 space-y-1">
                  <li>• Formato: <strong>.{selectedProcessType?.config?.config?.fileType?.toLowerCase() || 'xlsx'}</strong></li>
                  <li>• Columnas obligatorias: <strong>{getRequiredColumns(selectedProcessType).join(', ') || 'Ninguna'}</strong></li>
                  {selectedProcessType?.config?.config?.maxRowsPerBlock && (
                    <li>• Se procesará en bloques de {selectedProcessType.config.config.maxRowsPerBlock} registros</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Zona de Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.csv,.json,.txt"
              onChange={handleFileSelect}
            />
            
            {selectedFile ? (
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-slate-800">{selectedFile.name}</p>
                <p className="text-slate-500 text-sm mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className={`h-8 w-8 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-lg font-medium text-slate-700">
                  {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo aquí'}
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  o <span className="text-blue-600 font-medium">haz clic para seleccionar</span>
                </p>
                <p className="text-slate-400 text-xs mt-4">
                  Formatos aceptados: Excel (.xlsx), CSV, JSON, TXT
                </p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => { setStep(1); setSelectedFile(null); }}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <button
              onClick={handleUploadToS3}
              disabled={!selectedFile}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-200"
            >
              Subir e Iniciar
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 3: Subiendo a la Nube / Modo Manual */}
      {/* ============================================================= */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Header con botón de ayuda */}
          <div className="flex justify-end mb-2">
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>
          
          {/* MODO MANUAL - Cuando CORS falla */}
          {manualUploadMode && manualUploadUrl && manualFileId ? (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Subida Manual Requerida</h2>
                <p className="text-slate-500">
                  No pudimos subir el archivo automáticamente (error de CORS).<br/>
                  Usa el siguiente comando en Postman o cURL para subir el archivo.
                </p>
              </div>

              {/* Comando cURL */}
              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-xs font-medium">cURL / Postman</span>
                  <button
                    onClick={() => {
                      const curl = `curl -X PUT "${manualUploadUrl}" --data-binary "@${selectedFile?.name || 'tu_archivo.xlsx'}"`;
                      navigator.clipboard.writeText(curl);
                      alert('Comando copiado al portapapeles');
                    }}
                    className="text-blue-400 text-xs hover:text-blue-300 flex items-center"
                  >
                    Copiar comando
                  </button>
                </div>
                <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X PUT \\
  "${manualUploadUrl}" \\
  --data-binary "@${selectedFile?.name || 'tu_archivo.xlsx'}"`}
                </pre>
              </div>

              {/* Instrucciones para Postman */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-800 mb-2">Instrucciones para Postman:</h3>
                <ol className="text-blue-700 text-sm space-y-2">
                  <li><strong>1.</strong> Método: <code className="bg-blue-100 px-1 rounded">PUT</code></li>
                  <li><strong>2.</strong> URL: <code className="bg-blue-100 px-1 rounded text-xs break-all">{manualUploadUrl.substring(0, 80)}...</code></li>
                  <li><strong>3.</strong> Body → binary → Selecciona tu archivo: <strong>{selectedFile?.name}</strong></li>
                  <li><strong>4.</strong> No agregues headers adicionales</li>
                  <li><strong>5.</strong> Click en "Send" - Debe responder <code className="bg-green-100 text-green-700 px-1 rounded">200 OK</code></li>
                </ol>
              </div>

              {/* URL completa para copiar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">URL completa (para Postman):</label>
                <div className="flex">
                  <input
                    type="text"
                    value={manualUploadUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-l-lg bg-slate-50 text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(manualUploadUrl);
                      alert('URL copiada');
                    }}
                    className="px-4 py-2 bg-slate-600 text-white rounded-r-lg hover:bg-slate-700 text-sm"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* File ID */}
              <div className="mb-6 p-3 bg-slate-100 rounded-lg">
                <span className="text-slate-500 text-sm">File ID: </span>
                <code className="text-slate-800 font-mono">{manualFileId}</code>
              </div>

              {/* Botón para continuar */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setManualUploadMode(false);
                    setStep(2);
                  }}
                  className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setManualUploadMode(false);
                    startProcessing(manualFileId);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center shadow-lg shadow-green-200"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Ya subí el archivo, continuar
                </button>
              </div>
            </div>
          ) : (
            /* MODO AUTOMÁTICO - Subida normal */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CloudUpload className="h-10 w-10 text-blue-600 animate-pulse" />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2">Subiendo tu archivo</h2>
              <p className="text-slate-500 mb-8">
                Estamos transfiriendo tu archivo de forma segura a la nube...
              </p>

              {/* Barra de progreso */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">
                    {uploadProgress < 30 && 'Preparando...'}
                    {uploadProgress >= 30 && uploadProgress < 90 && 'Subiendo archivo...'}
                    {uploadProgress >= 90 && 'Finalizando...'}
                  </span>
                <span className="font-bold text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

              {/* Información del archivo */}
              <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-center text-sm text-slate-600">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-slate-400" />
                  <span className="font-medium">{selectedFile?.name}</span>
                  <span className="ml-2 text-slate-400">({(selectedFile?.size || 0) / 1024 / 1024 > 1 
                    ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`
                    : `${((selectedFile?.size || 0) / 1024).toFixed(0)} KB`})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 4: Procesando - Solo /process/{processId}/status */}
      {/* ============================================================= */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Header con botón de ayuda */}
          <div className="flex justify-end mb-2">
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>
          
          {/* MOSTRAR ERROR SI EXISTE */}
          {error ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Error en el procesamiento
              </h2>
              
              <p className="text-slate-500 mb-4">
                No se pudo procesar tu archivo. Por favor revisa el detalle del error.
              </p>

              {/* Detalle del error */}
              <div className="max-w-lg mx-auto mb-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-800 mb-1">Detalle del error:</h3>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sugerencias */}
              <div className="max-w-lg mx-auto mb-6 text-left">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    ¿Cómo solucionar este error?
                  </h3>
                  <ul className="text-amber-700 text-sm space-y-1">
                    <li>• Verifica que tu archivo tenga todas las columnas requeridas</li>
                    <li>• Revisa que los nombres de las columnas coincidan exactamente</li>
                    <li>• Asegúrate de que el formato del archivo sea correcto ({selectedProcessType?.config?.config?.fileType || 'XLSX'})</li>
                    <li>• Consulta la ayuda (?) para ver las columnas esperadas</li>
                  </ul>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <button
                  onClick={() => {
                    setError(null);
                    setStep(2); // Volver al paso de preparar archivo
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Volver a subir archivo
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 border border-slate-300 flex items-center justify-center"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Empezar de nuevo
                </button>
              </div>
            </div>
          ) : (
            /* ESTADO NORMAL - PROCESANDO */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cog className="h-10 w-10 text-purple-600 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Procesando tu archivo...
              </h2>
              
              <p className="text-slate-500 mb-6">
                Por favor espera mientras procesamos tu archivo.<br/>
                Esto puede tomar unos minutos.
              </p>

              {/* Indicador de estado actual */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex items-center justify-center text-slate-500 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Consultando estado del proceso...</span>
                </div>
                
                {processStatus && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estado:</span>
                        <span className="font-semibold text-purple-600">{processStatus.status}</span>
                      </div>
                      {processStatus.progress?.currentStep && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fase actual:</span>
                          <span className="font-medium">{processStatus.progress.currentStep}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <p className="text-xs text-slate-400 mt-4">
                Cuando el estado cambie a IN_PROGRESS, el proceso habrá terminado<br/>
                y se mostrarán los resultados automáticamente.
              </p>

              {/* Botón de Cancelar */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    // Detener el polling activo inmediatamente
                    stopPollingRef.current = true;
                    // Resetear todo y volver al inicio
                    handleReset();
                  }}
                  className="px-6 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 border border-red-200 transition-all flex items-center mx-auto"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancelar y Volver al Inicio
                </button>
                <p className="text-xs text-slate-400 mt-3">
                  El proceso continuará en segundo plano, pero podrás iniciar uno nuevo.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 5: Resultados - Usa /file/result/{fileId} */}
      {/* ============================================================= */}
      {step === 5 && (
        <>
          {/* Botón de ayuda flotante para Paso 5 */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors bg-white shadow-sm border border-slate-200"
              title="Ver ayuda"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          
          {/* Estado de carga */}
          {loadingResults && !processResult && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Obteniendo resultados...
                </h2>
                <p className="text-slate-500">
                  Estamos recuperando los detalles del procesamiento.
                </p>
              </div>
            </div>
          )}

          {/* Error al obtener resultados */}
          {!loadingResults && !processResult && error && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  Error al obtener resultados
                </h2>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center mx-auto"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Intentar de nuevo
                </button>
              </div>
            </div>
          )}

          {/* Resultados obtenidos */}
          {processResult && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="text-center py-4 mb-6 border-b border-slate-100">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  (processResult.processedBlocks?.error || 0) === 0 
                    ? 'bg-green-100' 
                    : 'bg-yellow-100'
                }`}>
                  {(processResult.processedBlocks?.error || 0) === 0 ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {(processResult.processedBlocks?.error || 0) === 0 
                    ? '¡Procesamiento exitoso!' 
                    : 'Procesamiento completado con observaciones'}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {processResult.file?.fileName || 'Archivo procesado'}
                </p>
              </div>

              {/* Resumen */}
              {processResult.processedBlocks && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-slate-800">
                      {processResult.processedBlocks.total || 0}
                    </div>
                    <div className="text-sm text-slate-500">Bloques procesados</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {(processResult.processedBlocks.sent || 0)}
                    </div>
                    <div className="text-sm text-slate-500">Enviados</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {processResult.processedBlocks.error || 0}
                    </div>
                    <div className="text-sm text-slate-500">Con errores</div>
                  </div>
                </div>
              )}

              {/* Detalles de bloques */}
              {processResult.processedBlocks?.details && processResult.processedBlocks.details.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-slate-800 mb-3">Detalle por bloque:</h3>
                  <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
                    {processResult.processedBlocks.details.map((block, idx: number) => {
                      const isExpanded = expandedBlockIdx === idx;
                      return (
                        <div key={idx} className={`rounded-lg border overflow-hidden transition-all ${
                          block.status === 'ERROR' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                        }`}>
                          {/* Fila principal del bloque */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                              {block.status === 'ERROR' ? (
                                <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-medium text-slate-800">Bloque {block.blockNumber}</span>
                                <span className="text-slate-500 text-sm ml-2">- {block.message}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                              {block.jsonUrl && (
                                <a 
                                  href={block.jsonUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Descargar
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedBlockIdx(null);
                                    setWorkerDetail(null);
                                  } else {
                                    setExpandedBlockIdx(idx);
                                    // Fetch detalle real desde la API
                                    const wId = block.publicId || String(block.workerId);
                                    if (wId) fetchWorkerDetail(wId);
                                  }
                                }}
                                className={`text-sm flex items-center px-2 py-1 rounded transition-colors ${
                                  isExpanded 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                                title="Ver información completa del bloque"
                              >
                                <Info className="h-4 w-4 mr-1" />
                                {isExpanded ? 'Ocultar' : 'Ver más'}
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Panel expandible: Detalle completo del bloque */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
                              {loadingWorkerDetail ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                                  <span className="text-sm text-slate-500">Cargando detalle del bloque...</span>
                                </div>
                              ) : workerDetail ? (() => {
                                const wd = workerDetail as Record<string, unknown>;
                                const meta = wd.metadata as Record<string, unknown> | undefined;
                                const statusObj = wd.status as Record<string, unknown> | undefined;
                                const config = wd.configuration as Record<string, unknown> | undefined;
                                const statusName = String(statusObj?.name || '');
                                const isError = statusName === 'ERROR';
                                const formattedDate = meta?.createdAt 
                                  ? new Date(String(meta.createdAt)).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                  : '—';
                                return (
                                  <div className="space-y-3">
                                    {/* Resumen rápido en cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div className="bg-white rounded-lg border border-slate-200 p-3 text-center shadow-sm">
                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Bloque</div>
                                        <div className="text-lg font-bold text-slate-800">{String(wd.blockNumber ?? block.blockNumber)}</div>
                                      </div>
                                      <div className={`rounded-lg border p-3 text-center shadow-sm ${isError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Estado</div>
                                        <div className={`text-sm font-bold ${isError ? 'text-red-600' : 'text-green-600'}`}>
                                          {statusName === 'SENT' ? 'Enviado' : statusName === 'ERROR' ? 'Error' : statusName === 'COMPLETED' ? 'Completado' : statusName || '—'}
                                        </div>
                                      </div>
                                      <div className="bg-white rounded-lg border border-slate-200 p-3 text-center shadow-sm">
                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Registros</div>
                                        <div className="text-lg font-bold text-slate-800">{String(meta?.lineCount ?? '—')}</div>
                                      </div>
                                      <div className="bg-white rounded-lg border border-slate-200 p-3 text-center shadow-sm">
                                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Rango</div>
                                        <div className="text-sm font-bold text-slate-800">{String(meta?.blockRange || '—')}</div>
                                      </div>
                                    </div>

                                    {/* Mensaje del proceso (destacado) */}
                                    {wd.processMessage && (
                                      <div className={`rounded-lg border px-4 py-3 text-sm ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                        <div className="flex items-start">
                                          <Info className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${isError ? 'text-red-400' : 'text-blue-400'}`} />
                                          <span>{String(wd.processMessage)}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Status description si existe */}
                                    {statusObj?.description && !wd.processMessage && (
                                      <div className={`rounded-lg border px-4 py-3 text-sm ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                        <div className="flex items-start">
                                          <Info className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${isError ? 'text-red-400' : 'text-green-400'}`} />
                                          <span>{String(statusObj.description)}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Errores de registros si existen */}
                                    {meta?.failedRecords != null && Number(meta.failedRecords) > 0 && (
                                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-center mb-2">
                                          <AlertCircle className="h-4 w-4 text-red-500 mr-1.5" />
                                          <span className="text-xs font-semibold text-red-700">Registros con error: {String(meta.failedRecords)}</span>
                                        </div>
                                        {meta.partialErrorMessage && (
                                          <p className="text-xs text-red-600 mb-1">{String(meta.partialErrorMessage)}</p>
                                        )}
                                        {meta.failedRecordIndices && (
                                          <p className="text-[11px] text-red-500 font-mono break-all">Posiciones: {JSON.stringify(meta.failedRecordIndices)}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Detalles del procesamiento */}
                                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Detalle del procesamiento</span>
                                      </div>
                                      <div className="divide-y divide-slate-100">
                                        <div className="flex items-center px-4 py-2.5">
                                          <span className="text-xs text-slate-500 w-40 flex-shrink-0">Fecha de creación</span>
                                          <span className="text-xs font-medium text-slate-700">{formattedDate}</span>
                                        </div>
                                        <div className="flex items-center px-4 py-2.5">
                                          <span className="text-xs text-slate-500 w-40 flex-shrink-0">ID de identificación</span>
                                          <span className="text-xs font-medium text-slate-700">{String(wd.identificationId || 'No asignado')}</span>
                                        </div>
                                        {config && (
                                          <>
                                            <div className="flex items-center px-4 py-2.5">
                                              <span className="text-xs text-slate-500 w-40 flex-shrink-0">Máximo por bloque</span>
                                              <span className="text-xs font-medium text-slate-700">{String(config.maxRowsPerBlock ?? '—')} registros</span>
                                            </div>
                                            <div className="flex items-center px-4 py-2.5">
                                              <span className="text-xs text-slate-500 w-40 flex-shrink-0">Tamaño del bloque</span>
                                              <span className="text-xs font-medium text-slate-700">{String(config.blockSize ?? '—')} registros</span>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Datos técnicos (colapsable) */}
                                    <details className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden group">
                                      <summary className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide list-none">
                                        <span className="flex items-center">
                                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                          Datos técnicos (API)
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 group-open:rotate-180 transition-transform" />
                                      </summary>
                                      <div className="p-3 space-y-3">
                                        {/* Botón copiar JSON */}
                                        <div className="flex justify-end">
                                          <button 
                                            onClick={() => {
                                              const payload = {
                                                jsonUrl: wd.urlFile || block.jsonUrl || null,
                                                workerId: wd.publicId || block.publicId || null,
                                                callBackUrl: `${API_BASE_URL}/file/worker/status/${wd.publicId || block.publicId}`,
                                                identificationId: wd.identificationId || null,
                                                timestamp: meta?.createdAt || null,
                                                blockNumber: wd.blockNumber || block.blockNumber
                                              };
                                              navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                                            }}
                                            className="text-[11px] text-blue-600 hover:text-blue-800 transition-colors px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-50 font-medium"
                                            title="Copiar payload como JSON"
                                          >
                                            Copiar JSON
                                          </button>
                                        </div>
                                        {/* Tabla de datos técnicos */}
                                        <div className="divide-y divide-slate-100 text-[11px]">
                                          <div className="flex items-start py-1.5">
                                            <span className="text-slate-400 w-36 flex-shrink-0 font-medium">Archivo de datos</span>
                                            <span className="text-blue-600 break-all">{String(wd.urlFile || block.jsonUrl || '—')}</span>
                                          </div>
                                          <div className="flex items-start py-1.5">
                                            <span className="text-slate-400 w-36 flex-shrink-0 font-medium">ID Worker</span>
                                            <span className="text-slate-700 font-mono">{String(wd.publicId || '—')}</span>
                                          </div>
                                          <div className="flex items-start py-1.5">
                                            <span className="text-slate-400 w-36 flex-shrink-0 font-medium">URL de respuesta</span>
                                            <span className="text-blue-600 break-all">{`${API_BASE_URL}/file/worker/status/${wd.publicId || block.publicId}`}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </details>
                                  </div>
                                );
                              })() : (
                                <div className="py-3">
                                  {/* Fallback: datos básicos del bloque + reintentar */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
                                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Bloque</div>
                                      <div className="text-lg font-bold text-slate-800">{String(block.blockNumber)}</div>
                                    </div>
                                    <div className={`rounded-lg border p-3 text-center ${block.status === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                      <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Estado</div>
                                      <div className={`text-sm font-bold ${block.status === 'ERROR' ? 'text-red-600' : 'text-green-600'}`}>{block.status}</div>
                                    </div>
                                  </div>
                                  <div className="divide-y divide-slate-100 text-[11px] bg-white rounded-lg border border-slate-200 p-3 mb-3">
                                    <div className="flex items-start py-1.5">
                                      <span className="text-slate-400 w-36 flex-shrink-0 font-medium">Archivo de datos</span>
                                      <span className="text-blue-600 break-all">{String(block.jsonUrl || '—')}</span>
                                    </div>
                                    <div className="flex items-start py-1.5">
                                      <span className="text-slate-400 w-36 flex-shrink-0 font-medium">ID Worker</span>
                                      <span className="text-slate-700 font-mono">{String(block.publicId || block.workerId || '—')}</span>
                                    </div>
                                  </div>
                                  {workerDetailError && (
                                    <button
                                      onClick={() => {
                                        const wId = block.publicId || String(block.workerId);
                                        if (wId) fetchWorkerDetail(wId);
                                      }}
                                      className="mx-auto flex items-center text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors font-medium"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                      Reintentar carga completa
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón para nueva importación */}
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center shadow-lg shadow-blue-200"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Nueva Importación
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ayuda */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg">
        <div className="flex items-start">
          <HelpCircle className="h-5 w-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">¿Necesitas ayuda?</p>
            <p>
              Este portal te permite importar datos de archivos Excel, CSV o JSON de forma sencilla.
              Solo selecciona el tipo de proceso, sube tu archivo y nosotros nos encargamos del resto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPortal;
