import React, { useState, useEffect, useRef } from 'react';
import {
  FileDown,
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
  History,
  Clock,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  UserPlus,
  ExternalLink,
  FileSpreadsheet,
  FileJson,
  Table,
  Plus,
  Minus,
  Copy,
  Send,
  Database,
  Settings,
  Columns,
  Shield,
  FileType,
  Link2,
  Upload
} from 'lucide-react';
import { View } from '../types';
import { useApiBaseUrl, useEnvironmentVersion } from './EnvironmentContext';

// =============================================================================
// TIPOS
// =============================================================================
interface ColumnConfig {
  columnName: string;
  required: boolean;
  format?: string;
}

interface ProcessTypeConfig {
  entityType?: string;
  fileType: 'TXT' | 'CSV' | 'XLSX';
  columns: Record<string, ColumnConfig>;
}

interface ProcessType {
  id: number;
  publicId: string;
  name: string;
  description: string;
  type: 1 | 2;
  config: {
    config: ProcessTypeConfig;
  };
}

interface ExportResult {
  total: number;
  validatedColumns: Array<{
    key: string;
    columnName: string;
    required: boolean;
  }>;
  fileUrl: string;
  file: string;
  userProcessConfig: {
    id: number;
    identificationId: string;
    processTypeId: number;
    fileId: number;
  };
  message: string;
  entityType?: string;
}

interface ExportHistory {
  id: string;
  processTypeName: string;
  fileName: string;
  fileType: string;
  totalRecords: number;
  exportedAt: string;
  fileUrl: string;
  entityType?: string;
  userId?: string;
}

// Tipos de formato soportados
const SUPPORTED_FORMATS = [
  { value: 'email', label: 'Email', example: 'usuario@example.com' },
  { value: 'number', label: 'Número', example: '123, 123.45' },
  { value: 'date', label: 'Fecha', example: '2024-01-15' },
  { value: 'phone', label: 'Teléfono', example: '+51987654321' },
  { value: 'url', label: 'URL', example: 'https://example.com' },
  { value: 'boolean', label: 'Booleano', example: 'true, false, 1, 0' },
  { value: 'dni', label: 'DNI (8 dígitos)', example: '12345678' },
  { value: 'postal_code', label: 'Código Postal', example: '15001' },
  { value: 'currency', label: 'Moneda', example: '150.50' },
  { value: 'percentage', label: 'Porcentaje', example: '50, 99.5' },
  { value: 'alphanumeric', label: 'Alfanumérico', example: 'ABC123' },
  { value: 'json', label: 'JSON', example: '{"key": "value"}' },
  { value: 'uuid', label: 'UUID', example: '550e8400-e29b-...' },
  { value: 'time', label: 'Hora', example: '14:30, 14:30:00' },
  { value: 'datetime', label: 'Fecha y Hora', example: '2024-01-15T14:30:00Z' },
  { value: 'ip', label: 'Dirección IP', example: '192.168.1.1' },
  { value: 'mac_address', label: 'Dirección MAC', example: '00:1B:44:11:3A:B7' },
  { value: 'credit_card', label: 'Tarjeta de Crédito', example: '4532015112830366' },
  { value: 'iban', label: 'IBAN', example: 'ES9121000418450200051332' }
];

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  TXT: <FileText className="h-5 w-5" />,
  CSV: <Table className="h-5 w-5" />,
  XLSX: <FileSpreadsheet className="h-5 w-5" />
};

const FILE_TYPE_COLORS: Record<string, string> = {
  TXT: 'bg-blue-100 text-blue-600',
  CSV: 'bg-green-100 text-green-600',
  XLSX: 'bg-purple-100 text-purple-600'
};

const HISTORY_STORAGE_KEY = 'kbatch_export_history';

/**
 * Obtiene la configuración interna de un ProcessType de forma segura.
 * La API puede devolver: config.config.fileType o config.fileType
 * Maneja ambas estructuras para evitar defaults incorrectos.
 */
const getInnerConfig = (item: ProcessType | null | undefined): ProcessTypeConfig => {
  const defaults: ProcessTypeConfig = {
    fileType: 'XLSX',
    columns: {}
  };

  if (!item || !item.config) return defaults;

  // Estructura esperada: config.config anidado
  if (item.config.config && typeof item.config.config === 'object') {
    return item.config.config;
  }

  // Fallback: config directo (por si la API devuelve config.fileType en vez de config.config.fileType)
  const directConfig = item.config as unknown as Record<string, unknown>;
  if (directConfig.fileType) {
    return directConfig as unknown as ProcessTypeConfig;
  }

  return defaults;
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================
interface ExportPortalProps {
  onNavigate?: (view: string) => void;
  isActive?: boolean;
}

// =============================================================================
// CONTENIDO DE AYUDA CONTEXTUAL POR PASO - EXPORTACIÓN
// =============================================================================
const EXPORT_HELP_CONTENT: Record<number, { title: string; sections: Array<{ subtitle: string; content: string }> }> = {
  1: {
    title: '¿Cómo funciona la exportación?',
    sections: [
      {
        subtitle: '¿Qué es un Tipo de Exportación?',
        content: 'Un tipo de exportación es una plantilla que define cómo se generará tu archivo. Cada tipo tiene columnas específicas y un formato de salida (Excel, CSV o TXT).'
      },
      {
        subtitle: '¿Cómo elegir el proceso correcto?',
        content: 'Selecciona el proceso que coincida con el tipo de datos que quieres exportar. Por ejemplo, si quieres exportar una lista de deudores, selecciona un proceso tipo "Deudores". Las columnas configuradas determinarán la estructura de tu archivo.'
      },
      {
        subtitle: '¿Qué significan las etiquetas?',
        content: '• EXPORT: Indica que es un proceso de exportación de datos.\n• TXT/CSV/XLSX: Formato del archivo que se generará.\n• Columnas con *: Son obligatorias - debes proporcionar estos datos.\n• Columnas sin *: Son opcionales.'
      },
      {
        subtitle: '¿Qué es el Entity Type?',
        content: 'Es una etiqueta descriptiva que identifica el tipo de entidad que estás exportando (ej: "Debtors", "Customers"). Ayuda a categorizar y organizar tus exportaciones para auditoría y trazabilidad.'
      },
      {
        subtitle: 'Validación de formatos (opcional)',
        content: 'Si el proceso tiene validación de formatos configurada (email, número, fecha, etc.), el sistema verificará que tus datos cumplan con estos formatos antes de generar el archivo.'
      },
      {
        subtitle: '¿No encuentras el proceso que necesitas?',
        content: 'Puedes crear un nuevo tipo de proceso desde "Configuración de Procesos". Ahí podrás definir las columnas, formatos de validación y el tipo de archivo de salida según tus necesidades.'
      }
    ]
  },
  2: {
    title: '¿Cómo ingresar los datos?',
    sections: [
      {
        subtitle: 'Dos formas de ingresar datos',
        content: 'Puedes elegir entre:\n• Editor JSON: Para copiar y pegar datos en formato JSON directo.\n• Editor Visual: Para crear filas de datos de forma visual, como una hoja de cálculo.'
      },
      {
        subtitle: 'Formato JSON requerido',
        content: 'Los datos deben ser un ARRAY de objetos JSON planos. Ejemplo:\n[\n  {"nombre": "Juan", "email": "juan@email.com"},\n  {"nombre": "Ana", "email": "ana@email.com"}\n]\n\nNO se aceptan objetos anidados en el nivel raíz.'
      },
      {
        subtitle: 'Editor Visual (Tabla)',
        content: 'Usa el editor visual para agregar filas de datos de forma intuitiva:\n• Cada fila es un registro\n• Agrega filas con el botón (+)\n• Elimina filas con el botón (-)\n• Las columnas se muestran según la configuración del proceso'
      },
      {
        subtitle: 'Columnas requeridas',
        content: 'Las columnas marcadas como obligatorias (*) deben tener valor en TODOS los registros. Si algún registro no tiene una columna requerida, recibirás un error.'
      },
      {
        subtitle: 'Validación de datos',
        content: 'El sistema puede validar formatos si están configurados:\n• email: Debe ser un email válido\n• number: Debe ser un número\n• date: Debe ser una fecha válida\n• phone: Número telefónico\n• currency: Formato moneda\n• Y 14 formatos más...'
      },
      {
        subtitle: 'Subir archivo JSON (IMPORTANTE)',
        content: 'Para datasets grandes, puedes preparar un archivo JSON con tus datos y subirlo directamente. El archivo debe contener un array de objetos JSON planos.'
      }
    ]
  },
  3: {
    title: '¿Cómo configurar la exportación?',
    sections: [
      {
        subtitle: 'Nombre del archivo',
        content: 'Puedes especificar un nombre personalizado para tu archivo. La extensión debe coincidir con el formato configurado (.txt, .csv, .xlsx). Si lo dejas vacío, se generará automáticamente como "export-{timestamp}.{extension}".'
      },
      {
        subtitle: 'ID de Usuario (Obligatorio)',
        content: 'Debes proporcionar el ID del usuario que realiza la exportación. Esto es necesario para:\n• Trazabilidad completa de la operación\n• Asociar la exportación a una organización\n• Auditoría y cumplimiento\n\nEl usuario debe estar sincronizado previamente en el sistema.'
      },
      {
        subtitle: 'Resumen de datos',
        content: 'Antes de exportar, verás un resumen:\n• Total de registros a exportar\n• Formato de archivo de salida\n• Tipo de entidad (si está configurado)\n• Vista previa de algunos registros'
      },
      {
        subtitle: '¿Qué pasa al exportar?',
        content: 'Al hacer clic en "Generar Archivo":\n1. Se validan las columnas requeridas\n2. Se validan los formatos (si están configurados)\n3. Se genera el archivo en el formato especificado\n4. Se sube a la nube automáticamente\n5. Se crea el registro para trazabilidad'
      },
      {
        subtitle: 'Proceso síncrono',
        content: 'A diferencia de la importación, la exportación es SÍNCRONA. Esto significa que recibirás el enlace de descarga inmediatamente después de que el archivo se genere. No hay necesidad de esperar ni consultar estado.'
      }
    ]
  },
  4: {
    title: '¿Qué está pasando ahora?',
    sections: [
      {
        subtitle: 'Generación del archivo',
        content: 'El sistema está:\n1. Validando que existan las columnas requeridas\n2. Validando formatos de datos (si están configurados)\n3. Transformando los nombres de columnas\n4. Generando el archivo en el formato especificado'
      },
      {
        subtitle: 'Formatos de salida',
        content: '• TXT: Columnas alineadas con espacios, ideal para sistemas legacy\n• CSV: Formato estándar RFC 4180, compatible con Excel y otras herramientas\n• XLSX: Excel con headers estilizados y formato profesional'
      },
      {
        subtitle: 'Subida a la nube',
        content: 'Una vez generado, el archivo se sube automáticamente a Amazon S3. El proceso es rápido y seguro, usando conexiones encriptadas.'
      },
      {
        subtitle: '¿Por qué puede demorar?',
        content: 'El tiempo depende de:\n• Cantidad de registros\n• Si hay validación de formatos\n• Formato de salida (XLSX toma más tiempo que CSV)\n\nGeneralmente toma solo unos segundos.'
      }
    ]
  },
  5: {
    title: '¿Cómo usar los resultados?',
    sections: [
      {
        subtitle: 'Descarga tu archivo',
        content: 'Haz clic en "Descargar Archivo" para obtener tu archivo exportado. El enlace es válido y puedes descargarlo las veces que necesites.'
      },
      {
        subtitle: 'Información del resultado',
        content: 'Verás:\n• Total de registros exportados\n• Columnas incluidas en el archivo\n• URL del archivo en la nube\n• ID del archivo para referencia futura'
      },
      {
        subtitle: 'Historial de exportaciones',
        content: 'Todas tus exportaciones quedan registradas. Puedes ver el historial en "Gestión de Usuarios y Procesos" para consultar exportaciones anteriores y descargarlas nuevamente.'
      },
      {
        subtitle: 'Nueva exportación',
        content: 'Puedes iniciar una nueva exportación manteniendo los datos actuales o comenzar desde cero con el botón "Nueva Exportación".'
      },
      {
        subtitle: 'Si hubo errores',
        content: 'Si el sistema detectó errores de validación:\n• No se genera el archivo\n• Verás el detalle de qué columnas o registros fallaron\n• Corrige los datos y vuelve a intentar'
      },
      {
        subtitle: 'Encoding y compatibilidad',
        content: 'Los archivos TXT y CSV incluyen BOM UTF-8 para correcta visualización de tildes y caracteres especiales en cualquier programa.'
      }
    ]
  }
};

// Componente Modal de Ayuda para Export
const ExportHelpModal: React.FC<{ step: number; onClose: () => void }> = ({ step, onClose }) => {
  const content = EXPORT_HELP_CONTENT[step];
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
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
            <div key={idx} className="border-l-4 border-green-200 pl-4">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
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
            Paso {step} de 5 • Portal de Exportación
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// Botón de ayuda reutilizable para Export
const ExportHelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="ml-3 p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
    title="Ver ayuda"
  >
    <HelpCircle className="h-5 w-5" />
  </button>
);

const ExportPortal: React.FC<ExportPortalProps> = ({ onNavigate, isActive }) => {
  const API_BASE_URL = useApiBaseUrl();
  const environmentVersion = useEnvironmentVersion();
  // Estado del modal de ayuda
  const [showHelp, setShowHelp] = useState(false);
  
  // Estados del wizard
  const [step, setStep] = useState(1);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [selectedProcessType, setSelectedProcessType] = useState<ProcessType | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  // Estados de datos
  const [inputMethod, setInputMethod] = useState<'json' | 'file'>('json');
  const [jsonData, setJsonData] = useState<Record<string, unknown>[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [fileJsonData, setFileJsonData] = useState<Record<string, unknown>[]>([]); // Datos del archivo subido (separados de JSON escrito)
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de procesamiento
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ type: string; items: string[] } | null>(null);
  
  // Estado para usuario (trazabilidad)
  const [userId, setUserId] = useState<string>('');

  // Estados para historial
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ExportHistory | null>(null);

  // Editor de datos manual
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);

  // Datos activos según el método de entrada seleccionado por el usuario
  // Si está en la vista "Subir Archivo" → usa los datos del archivo
  // Si está en la vista "Escribir JSON" → usa los datos escritos manualmente
  const activeData = inputMethod === 'file' ? fileJsonData : jsonData;

  // Pasos del wizard
  const STEPS = [
    { num: 1, label: 'Tipo de Exportación', icon: Package },
    { num: 2, label: 'Preparar Datos', icon: Database },
    { num: 3, label: 'Configurar', icon: Settings },
    { num: 4, label: 'Exportando', icon: Send },
    { num: 5, label: 'Resultado', icon: Download }
  ];

  // Cargar tipos de proceso (solo exportación - type=2)
  const fetchProcessTypes = async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/process-type?type=2&limit=50`);
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
      setJsonData([]);
      setJsonText('');
      setFileJsonData([]);
      setJsonFile(null);
      setFileName('');
      setExportResult(null);
      setError(null);
      setErrorDetails(null);
    }
  }, [environmentVersion]);

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setExportHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, []);

  // Guardar en historial
  const saveToHistory = (result: ExportResult, processType: ProcessType) => {
    const ptConfig = getInnerConfig(processType);
    const generatedFileName = fileName || `export-${Date.now()}.${ptConfig.fileType.toLowerCase()}`;
    const historyItem: ExportHistory = {
      id: `exp_${Date.now()}`,
      processTypeName: processType.name,
      fileName: generatedFileName,
      fileType: ptConfig.fileType,
      totalRecords: result.total,
      exportedAt: new Date().toISOString(),
      fileUrl: result.fileUrl,
      entityType: result.entityType,
      userId: userId || undefined
    };

    setExportHistory(prev => {
      const updated = [historyItem, ...prev].slice(0, 20);
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
    setExportHistory(prev => {
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

  // Limpiar historial
  const clearHistory = () => {
    setExportHistory([]);
    setSelectedHistoryItem(null);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Parsear JSON del textarea
  const parseJsonInput = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        setError('Los datos deben ser un array de objetos JSON');
        return false;
      }
      if (parsed.length === 0) {
        setError('El array no puede estar vacío');
        return false;
      }
      if (!parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        setError('Todos los elementos deben ser objetos JSON válidos');
        return false;
      }
      setJsonData(parsed);
      setError(null);
      return true;
    } catch (e) {
      setError('JSON inválido. Verifica la sintaxis.');
      return false;
    }
  };

  // Manejar archivo JSON
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.json')) {
      setError('Solo se permiten archivos .json');
      return;
    }
    
    setJsonFile(file);
    
    // Leer contenido para preview — guardar en fileJsonData (separado del JSON escrito)
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setFileJsonData(parsed);
        setError(null);
      } else {
        setError('El archivo debe contener un array de objetos JSON');
      }
    } catch (e) {
      setError('Error al leer el archivo JSON');
    }
  };

  // Obtener columnas del ProcessType (usa helper seguro)
  const getColumns = () => {
    const innerConfig = getInnerConfig(selectedProcessType);
    if (!innerConfig?.columns) return [];
    return Object.entries(innerConfig.columns).map(([key, config]) => ({
      key,
      ...config
    }));
  };

  // Validar datos antes de exportar
  const validateData = (): boolean => {
    // Validar User ID (OBLIGATORIO)
    if (!userId.trim()) {
      setError('El User ID es obligatorio para crear una exportación. Ve a "Gestión de Usuarios" para obtener uno.');
      return false;
    }

    if (activeData.length === 0) {
      setError('No hay datos para exportar');
      return false;
    }

    const columns = getColumns();
    const requiredColumns = columns.filter(col => col.required).map(col => col.key);
    
    // Verificar columnas requeridas en el primer objeto
    const firstRow = activeData[0];
    const firstRowKeys = Object.keys(firstRow).map(k => k.toLowerCase());
    
    const missingColumns = requiredColumns.filter(
      col => !firstRowKeys.includes(col.toLowerCase())
    );
    
    if (missingColumns.length > 0) {
      setError(`Faltan columnas requeridas: ${missingColumns.join(', ')}`);
      return false;
    }

    return true;
  };

  // Ejecutar exportación
  const handleExport = async () => {
    if (!selectedProcessType || !validateData()) return;

    setStep(4);
    setExporting(true);
    setError(null);
    setErrorDetails(null);

    try {
      const innerConfig = getInnerConfig(selectedProcessType);
      const generatedFileName = fileName || `export-${Date.now()}.${innerConfig.fileType.toLowerCase()}`;

      let response;
      
      if (inputMethod === 'json' || !jsonFile) {
        // Formato 1: JSON directo (usa datos según el método activo)
        const body: Record<string, unknown> = {
          processTypeId: selectedProcessType.publicId,
          fileName: generatedFileName,
          userId: userId.trim(), // OBLIGATORIO
          data: activeData
        };

        response = await fetch(`${API_BASE_URL}/file/start-export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        // Formato 2: FormData con archivo
        const formData = new FormData();
        formData.append('processTypeId', selectedProcessType.publicId);
        formData.append('fileName', generatedFileName);
        formData.append('userId', userId.trim()); // OBLIGATORIO
        formData.append('dataFile', jsonFile);

        response = await fetch(`${API_BASE_URL}/file/start-export`, {
          method: 'POST',
          body: formData
        });
      }

      const result = await response.json();
      
      if (result.isSuccess) {
        setExportResult(result.data);
        saveToHistory(result.data, selectedProcessType);
        setStep(5);
      } else {
        // Extraer mensaje descriptivo de la respuesta del API
        const apiError = result.error || '';
        const apiMessage = result.message || '';
        const apiCode = result.code || '';

        // Detectar errores de validación de formato
        if (apiCode === 'VALIDATION_ERROR' || apiMessage.toLowerCase().includes('formato inválido')) {
          // Parsear mensaje agrupado: "email inválido: 20 registros, monto inválido: 15 registros"
          const validationParts = apiMessage
            .replace(/^Datos con formato inválido\.\s*/i, '')
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
          
          setError('Algunos campos no cumplen con el formato esperado');
          setErrorDetails({
            type: 'validation',
            items: validationParts.length > 0 ? validationParts : [apiMessage]
          });
        } else if (apiMessage.includes('propiedades requeridas') || apiMessage.includes('columnas requeridas')) {
          // Columnas faltantes
          setError('Faltan columnas obligatorias en los datos enviados');
          setErrorDetails({
            type: 'missing_columns',
            items: [apiMessage]
          });
        } else if (apiMessage.includes('Usuario') && apiMessage.includes('no encontrado')) {
          setError('El usuario no está registrado en KBatch');
          setErrorDetails({
            type: 'user',
            items: ['El User ID proporcionado no existe. Primero debes sincronizar el usuario en la sección "Gestión de Usuarios y Procesos".']
          });
        } else if (apiMessage.includes('fileType') || apiMessage.includes('extensión')) {
          setError('El formato del archivo no coincide con la configuración');
          setErrorDetails({
            type: 'config',
            items: [apiError || apiMessage]
          });
        } else {
          // Error genérico: usar el campo más descriptivo disponible
          const friendlyMessage = apiError || (apiMessage !== 'Error al realizar la consulta' ? apiMessage : '');
          setError(friendlyMessage || 'Ocurrió un error al procesar la exportación. Intenta nuevamente.');
          setErrorDetails(null);
        }
        setStep(3);
      }
    } catch (err) {
      console.error('Error exporting:', err);
      setError(
        err instanceof Error && err.message.includes('Failed to fetch')
          ? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
          : err instanceof Error 
            ? err.message 
            : 'Ocurrió un error inesperado. Intenta nuevamente.'
      );
      setErrorDetails(null);
      setStep(3);
    } finally {
      setExporting(false);
    }
  };

  // Reiniciar wizard
  const handleReset = () => {
    setStep(1);
    setSelectedProcessType(null);
    setInputMethod('json');
    setJsonData([]);
    setJsonText('');
    setFileJsonData([]);
    setJsonFile(null);
    setFileName('');
    setExportResult(null);
    setError(null);
    setErrorDetails(null);
    setExporting(false);
    setUserId('');
    setShowDataEditor(false);
  };

  // Agregar fila de ejemplo
  const addSampleRow = () => {
    const columns = getColumns();
    const newRow: Record<string, unknown> = {};
    columns.forEach(col => {
      newRow[col.key] = '';
    });
    const updated = [...jsonData, newRow];
    setJsonData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Eliminar fila
  const removeRow = (index: number) => {
    const updated = jsonData.filter((_, i) => i !== index);
    setJsonData(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Actualizar valor de celda
  const updateCell = (rowIndex: number, key: string, value: string) => {
    const updated = [...jsonData];
    updated[rowIndex] = { ...updated[rowIndex], [key]: value };
    setJsonData(updated);
    // Mantener jsonText sincronizado para que Vista JSON siempre refleje los cambios
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Sincronizar datos al cambiar entre Editor Visual y Vista JSON
  const toggleDataEditor = () => {
    if (showDataEditor) {
      // Cambiando de Editor Visual → Vista JSON: actualizar jsonText con datos actuales
      if (jsonData.length > 0) {
        setJsonText(JSON.stringify(jsonData, null, 2));
      }
    } else {
      // Cambiando de Vista JSON → Editor Visual: parsear jsonText a jsonData
      if (jsonText.trim()) {
        parseJsonInput(jsonText);
      }
    }
    setShowDataEditor(!showDataEditor);
  };

  // Copiar JSON al portapapeles
  const copyJsonToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(activeData, null, 2));
  };

  // =============================================================================
  // RENDERIZADO
  // =============================================================================
  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <Sparkles className="h-7 w-7 mr-3 text-green-600" />
            Portal de Exportación de Datos
          </h1>
          <p className="text-slate-500 mt-2">
            Genera archivos TXT, CSV o Excel a partir de tus datos de forma sencilla.
          </p>
        </div>
        
        {/* Botón Historial */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
            showHistory 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="h-5 w-5 mr-2" />
          Exportaciones Recientes
          {exportHistory.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
              showHistory ? 'bg-white text-green-600' : 'bg-green-600 text-white'
            }`}>
              {exportHistory.length}
            </span>
          )}
          {showHistory ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </button>
      </div>

      {/* Panel de Historial */}
      {showHistory && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-bold text-slate-800">Historial de Exportaciones</h3>
            </div>
            {exportHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm text-red-500 hover:text-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar historial
              </button>
            )}
          </div>
          
          {exportHistory.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay exportaciones recientes</p>
              <p className="text-slate-400 text-sm mt-1">Las exportaciones completadas aparecerán aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {exportHistory.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    selectedHistoryItem?.id === item.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${FILE_TYPE_COLORS[item.fileType] || 'bg-slate-100'}`}>
                          {FILE_TYPE_ICONS[item.fileType] || <FileDown className="h-5 w-5" />}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{item.fileName}</span>
                          <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            {item.processTypeName}
                          </span>
                          {item.entityType && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                              {item.entityType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-slate-500 ml-12">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(item.exportedAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        <span className="mx-2">•</span>
                        <span className="text-green-600 font-medium">{item.totalRecords} registros</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Descargar archivo"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => setSelectedHistoryItem(
                          selectedHistoryItem?.id === item.id ? null : item
                        )}
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
                  
                  {selectedHistoryItem?.id === item.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 ml-12">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">Tipo de Archivo</p>
                          <p className="font-medium text-slate-800">{item.fileType}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">Registros Exportados</p>
                          <p className="font-medium text-slate-800">{item.totalRecords}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-1">URL del Archivo</p>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={item.fileUrl}
                            readOnly
                            className="flex-1 px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600 truncate"
                          />
                          <button
                            onClick={() => navigator.clipboard.writeText(item.fileUrl)}
                            className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step >= s.num 
                    ? step === s.num 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
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

      {/* Error Message - Descriptivo y amigable */}
      {error && (
        <div className="mb-6 bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header del error */}
          <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-red-100 rounded-lg mr-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-red-800 font-semibold text-sm">
                  {errorDetails?.type === 'validation' 
                    ? 'Error de validación de formato' 
                    : errorDetails?.type === 'missing_columns'
                      ? 'Columnas faltantes'
                      : errorDetails?.type === 'user'
                        ? 'Usuario no encontrado'
                        : errorDetails?.type === 'config'
                          ? 'Error de configuración'
                          : 'No se pudo completar la exportación'}
                </p>
                <p className="text-red-600 text-xs mt-0.5">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => { setError(null); setErrorDetails(null); }} 
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Detalles del error (si hay) */}
          {errorDetails && errorDetails.items.length > 0 && (
            <div className="px-4 py-3">
              {errorDetails.type === 'validation' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Campos con errores de formato:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {errorDetails.items.map((item, idx) => {
                      // Parsear: "email inválido: 20 registros"
                      const match = item.match(/^(.+?)\s+inválido:\s*(\d+)\s+registros?$/i);
                      return (
                        <div key={idx} className="flex items-center bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                          <div className="w-2 h-2 rounded-full bg-red-400 mr-2.5 flex-shrink-0" />
                          {match ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm text-red-800 font-medium capitalize">{match[1]}</span>
                              <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold ml-2">{match[2]} registros</span>
                            </div>
                          ) : (
                            <span className="text-sm text-red-700">{item}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-start">
                    <Info className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    Revisa que los datos cumplan con el formato configurado para cada columna (ej: email válido, formato de moneda, etc.)
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {errorDetails.items.map((item, idx) => (
                    <div key={idx} className="flex items-start text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                      <div className="w-2 h-2 rounded-full bg-red-400 mr-2.5 mt-1.5 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sugerencia de acción */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {errorDetails?.type === 'validation' 
                ? 'Corrige los datos y vuelve a intentar la exportación.'
                : errorDetails?.type === 'user'
                  ? 'Sincroniza el usuario primero y luego intenta exportar.'
                  : 'Si el problema persiste, contacta al equipo de soporte.'}
            </p>
            <button 
              onClick={() => { setError(null); setErrorDetails(null); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* Modal de Ayuda */}
      {showHelp && <ExportHelpModal step={step} onClose={() => setShowHelp(false)} />}

      {/* PASO 1: Seleccionar Tipo de Exportación */}
      {/* ============================================================= */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg mr-4">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">¿Qué tipo de datos quieres exportar?</h2>
                <p className="text-slate-500 text-sm">Selecciona el proceso de exportación que define el formato de tu archivo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProcessTypes}
                disabled={loadingTypes}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all disabled:opacity-50"
                title="Refrescar tipos de proceso"
              >
                <RefreshCw className={`h-4 w-4 ${loadingTypes ? 'animate-spin' : ''}`} />
              </button>
              <ExportHelpButton onClick={() => setShowHelp(true)} />
            </div>
          </div>

          {loadingTypes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
              <span className="ml-3 text-slate-500">Cargando opciones...</span>
            </div>
          ) : processTypes.length === 0 ? (
            <div className="text-center py-12">
              <FileDown className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 mb-4">No hay procesos de exportación configurados</p>
              <p className="text-slate-400 text-sm">
                Para crear uno, ve a <strong>Configuración de Procesos</strong> y crea un ProcessType con type = 2
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-h-[500px] overflow-auto pr-2">
              {processTypes.map((pt) => {
                const config = getInnerConfig(pt);
                const columns = config?.columns ? Object.entries(config.columns) : [];
                const requiredCount = columns.filter(([_, c]) => (c as ColumnConfig).required).length;
                const hasFormatValidation = columns.some(([_, c]) => (c as ColumnConfig).format);
                
                return (
                  <div
                    key={pt.publicId}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedProcessType?.publicId === pt.publicId
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => setSelectedProcessType(pt)}
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          <div className={`p-2 rounded-lg ${FILE_TYPE_COLORS[config?.fileType || 'XLSX']}`}>
                            {FILE_TYPE_ICONS[config?.fileType || 'XLSX']}
                          </div>
                          <h3 className="font-bold text-slate-800">{pt.name}</h3>
                          {/* Etiqueta EXPORT */}
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">
                            EXPORT
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FILE_TYPE_COLORS[config?.fileType || 'XLSX']}`}>
                            {config?.fileType || 'XLSX'}
                          </span>
                          {config?.entityType && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {config.entityType}
                            </span>
                          )}
                          {hasFormatValidation && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              Validación
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm mt-2 ml-10">{pt.description || 'Sin descripción'}</p>
                        
                        {columns.length > 0 && (
                          <div className="mt-3 ml-10">
                            <p className="text-xs text-slate-400 mb-2 flex items-center">
                              <Columns className="h-3 w-3 mr-1" />
                              {columns.length} campos ({requiredCount} obligatorios)
                            </p>
                            <p className="text-xs text-slate-500 mb-1">Campos que debes enviar en tu JSON:</p>
                            <div className="flex flex-wrap gap-1">
                              {columns.slice(0, 8).map(([key, colConfig]) => {
                                const col = colConfig as ColumnConfig;
                                return (
                                  <span 
                                    key={key} 
                                    className={`px-2 py-0.5 rounded text-xs ${
                                      col.required 
                                        ? 'bg-green-100 text-green-700 font-medium' 
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                    title={col.format ? `Formato: ${col.format}` : undefined}
                                  >
                                    {key}
                                    {col.required && ' *'}
                                    {col.format && <Shield className="h-2.5 w-2.5 ml-1 inline" />}
                                  </span>
                                );
                              })}
                              {columns.length > 8 && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-xs rounded">
                                  +{columns.length - 8} más
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Botón para ver más detalles */}
                        <div className="mt-3 ml-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navegar a Configuration pasando el publicId del proceso
                              if (onNavigate) {
                                onNavigate(`CONFIGURATION:${pt.publicId}`);
                              }
                            }}
                            className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center"
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Ver configuración completa del proceso
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                      </div>
                      <div 
                        onClick={() => setSelectedProcessType(pt)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 cursor-pointer ${
                          selectedProcessType?.publicId === pt.publicId
                            ? 'border-green-500 bg-green-500'
                            : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {selectedProcessType?.publicId === pt.publicId && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedProcessType}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-200"
            >
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 2: Preparar Datos */}
      {/* ============================================================= */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg mr-4">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Prepara tus datos</h2>
                <p className="text-slate-500 text-sm">
                  Proceso: <span className="font-medium text-green-700">{selectedProcessType?.name}</span>
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-bold">EXPORT</span>
                </p>
              </div>
            </div>
            <ExportHelpButton onClick={() => setShowHelp(true)} />
          </div>

          {/* Selector de método de entrada */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">¿Cómo quieres proporcionar los datos?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setInputMethod('json')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  inputMethod === 'json'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${inputMethod === 'json' ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <FileJson className={`h-5 w-5 ${inputMethod === 'json' ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Escribir JSON</h3>
                    <p className="text-slate-500 text-xs">Pega o escribe tus datos directamente</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setInputMethod('file')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  inputMethod === 'file'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${inputMethod === 'file' ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Upload className={`h-5 w-5 ${inputMethod === 'file' ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Subir Archivo</h3>
                    <p className="text-slate-500 text-xs">Sube un archivo .json con tus datos</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Info de columnas esperadas */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <Columns className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-800 font-medium mb-2">Columnas esperadas en tus datos:</p>
                <div className="flex flex-wrap gap-2">
                  {getColumns().map(col => (
                    <span 
                      key={col.key}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center ${
                        col.required 
                          ? 'bg-green-100 text-green-800 font-medium border border-green-300' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className="font-mono text-xs mr-2 text-slate-400">{col.key}</span>
                      → {col.columnName}
                      {col.required && <span className="text-green-600 ml-1 font-bold">*</span>}
                      {col.format && (
                        <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          {col.format}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">* Columnas obligatorias</p>
              </div>
            </div>
          </div>

          {/* Área de entrada de datos */}
          {inputMethod === 'json' ? (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">
                  Datos en formato JSON (array de objetos)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={toggleDataEditor}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Table className="h-4 w-4 mr-1" />
                    {showDataEditor ? 'Vista JSON' : 'Editor Visual'}
                  </button>
                  {jsonData.length > 0 && (
                    <button
                      onClick={copyJsonToClipboard}
                      className="text-sm text-slate-500 hover:text-slate-700 flex items-center"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </button>
                  )}
                </div>
              </div>
              
              {showDataEditor ? (
                /* Editor Visual tipo tabla */
                <div className="border border-green-200 rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm bg-white">
                      <thead className="bg-green-50">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-medium text-green-700 w-12">#</th>
                          {getColumns().map(col => (
                            <th key={col.key} className="px-2 py-2 text-left text-xs font-medium text-green-800 min-w-[120px]">
                              <span className="font-mono">{col.key}</span>
                              {col.required && <span className="text-red-500 ml-1">*</span>}
                            </th>
                          ))}
                          <th className="px-2 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100 bg-white">
                        {jsonData.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-green-50 bg-white">
                            <td className="px-2 py-1 text-slate-500 text-xs bg-white">{rowIdx + 1}</td>
                            {getColumns().map(col => (
                              <td key={col.key} className="px-1 py-1 bg-white">
                                <input
                                  type="text"
                                  value={String(row[col.key] ?? '')}
                                  onChange={(e) => updateCell(rowIdx, col.key, e.target.value)}
                                  className="w-full px-2 py-1 text-sm text-slate-800 bg-white border border-slate-200 hover:border-green-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded outline-none"
                                  placeholder={col.format || '...'}
                                />
                              </td>
                            ))}
                            <td className="px-1 py-1 bg-white">
                              <button
                                onClick={() => removeRow(rowIdx)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3 bg-green-50 border-t border-green-200">
                    <button
                      onClick={addSampleRow}
                      className="flex items-center text-sm text-green-700 hover:text-green-800 font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar fila
                    </button>
                  </div>
                </div>
              ) : (
                /* Textarea JSON */
                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    // Intentar parsear en tiempo real para mantener jsonData sincronizado
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
                        setJsonData(parsed);
                        setError(null);
                      }
                    } catch {
                      // JSON incompleto mientras el usuario escribe — se parseará al cambiar de vista o hacer blur
                    }
                  }}
                  onBlur={() => {
                    if (jsonText.trim() === '') {
                      // Si el usuario borró todo, limpiar datos y no mostrar error
                      setJsonData([]);
                      setError(null);
                    } else {
                      parseJsonInput(jsonText);
                    }
                  }}
                  className="w-full h-64 px-4 py-3 border border-green-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none bg-white text-slate-800"
                  placeholder={`[\n  {\n    "${getColumns()[0]?.key || 'columna1'}": "valor1",\n    "${getColumns()[1]?.key || 'columna2'}": "valor2"\n  }\n]`}
                />
              )}
              
              {/* Ejemplo de formato */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-2 font-medium">Ejemplo de formato esperado:</p>
                <pre className="text-xs font-mono text-slate-600 overflow-x-auto">
{`[
  { ${getColumns().slice(0, 3).map(c => `"${c.key}": "valor"`).join(', ')}${getColumns().length > 3 ? ', ...' : ''} },
  { ${getColumns().slice(0, 3).map(c => `"${c.key}": "valor"`).join(', ')}${getColumns().length > 3 ? ', ...' : ''} }
]`}
                </pre>
              </div>
            </div>
          ) : (
            /* Subir archivo JSON */
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileSelect}
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  jsonFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                }`}
              >
                {jsonFile ? (
                  <div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-medium text-slate-800">{jsonFile.name}</p>
                    <p className="text-slate-500 text-sm mt-1">
                      {fileJsonData.length} registros encontrados
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setJsonFile(null); setFileJsonData([]); }}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="font-medium text-slate-700">Haz clic para seleccionar un archivo</p>
                    <p className="text-slate-400 text-sm mt-1">Solo archivos .json</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview de datos */}
          {activeData.length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">
                  {activeData.length} registros listos para exportar
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => { setStep(1); setJsonData([]); setJsonText(''); setFileJsonData([]); setJsonFile(null); }}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <button
              onClick={() => {
                if (inputMethod === 'json' && jsonText && !jsonData.length) {
                  parseJsonInput(jsonText);
                }
                if (activeData.length > 0) {
                  setStep(3);
                } else {
                  setError('Proporciona al menos un registro para exportar');
                }
              }}
              disabled={activeData.length === 0 && !(inputMethod === 'json' && jsonText)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-green-200"
            >
              Continuar
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 3: Configurar Exportación */}
      {/* ============================================================= */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg mr-4">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Configura tu exportación</h2>
                <p className="text-slate-500 text-sm">Revisa los detalles antes de generar el archivo</p>
              </div>
            </div>
            <ExportHelpButton onClick={() => setShowHelp(true)} />
          </div>

          {/* Resumen del proceso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-500">Tipo de Proceso</span>
              </div>
              <p className="font-bold text-slate-800">{selectedProcessType?.name}</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <div className="flex items-center mb-2">
                <FileType className="h-5 w-5 text-slate-500 mr-2" />
                <span className="text-sm text-slate-500">Formato de Salida</span>
              </div>
              <div className="flex items-center">
                <span className={`p-1.5 rounded mr-2 ${FILE_TYPE_COLORS[getInnerConfig(selectedProcessType).fileType]}`}>
                  {FILE_TYPE_ICONS[getInnerConfig(selectedProcessType).fileType]}
                </span>
                <p className="font-bold text-slate-800">{getInnerConfig(selectedProcessType).fileType}</p>
              </div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <Database className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-green-600">Registros a Exportar</span>
              </div>
              <p className="font-bold text-green-700 text-2xl">{activeData.length}</p>
            </div>
          </div>

          {/* Sección de Usuario (OBLIGATORIO) */}
          <div className={`mb-6 p-4 rounded-lg border ${
            userId.trim() 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${userId.trim() ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Users className={`h-5 w-5 ${userId.trim() ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-bold ${userId.trim() ? 'text-green-800' : 'text-red-800'}`}>
                    User ID <span className="text-red-500">*</span> (Obligatorio)
                  </label>
                  <p className={`text-xs ${userId.trim() ? 'text-green-600' : 'text-red-600'}`}>
                    ID del usuario sincronizado en KBatch - Requerido para crear la exportación
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <input 
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm focus:ring-2 outline-none bg-white ${
                    userId.trim() 
                      ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                      : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  }`}
                  placeholder="Ej: usr_d1_9PpNyjMTXpCG..."
                />
              </div>
            </div>
            
            {!userId.trim() && (
              <div className="mt-3 p-4 bg-white border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="p-2 bg-red-100 rounded-lg mr-3 flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-bold">
                      ¡User ID es obligatorio!
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Para crear una exportación, <strong>debes proporcionar un User ID válido</strong>. 
                      Si no tienes uno, primero debes sincronizar un usuario en <strong>"Gestión de Usuarios"</strong>.
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
            
            {userId.trim() && (
              <div className="mt-2 flex items-center text-green-700 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                User ID configurado correctamente
              </div>
            )}
          </div>

          {/* Nombre del archivo (opcional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre del archivo (opcional)
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder={`export-${Date.now()}.${getInnerConfig(selectedProcessType).fileType.toLowerCase()}`}
              />
              <span className="ml-3 text-slate-400 text-sm">
                Si no lo defines, se generará automáticamente
              </span>
            </div>
          </div>

          {/* Preview de columnas que se exportarán */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
              <Columns className="h-4 w-4 mr-2" />
              Campos que debes enviar y cómo aparecerán en el archivo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Campo que envías *</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Cómo aparece en archivo</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-slate-500">Obligatorio</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Validación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getColumns().map(col => (
                    <tr key={col.key} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-mono text-slate-600">{col.key}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium">{col.columnName}</td>
                      <td className="px-4 py-2 text-center">
                        {col.required ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {col.format ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            {col.format}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">Sin validación</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview de datos */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Vista previa de los primeros registros
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">#</th>
                    {getColumns().slice(0, 5).map(col => (
                      <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                        {col.columnName}
                      </th>
                    ))}
                    {getColumns().length > 5 && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">...</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeData.slice(0, 3).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400 text-xs">{idx + 1}</td>
                      {getColumns().slice(0, 5).map(col => (
                        <td key={col.key} className="px-3 py-2 text-slate-700 truncate max-w-[150px]">
                          {String(row[col.key] ?? '—')}
                        </td>
                      ))}
                      {getColumns().length > 5 && (
                        <td className="px-3 py-2 text-slate-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeData.length > 3 && (
                <div className="px-3 py-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
                  ... y {activeData.length - 3} registros más
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 flex items-center"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>
            <div className="flex items-center gap-3">
              {!userId.trim() && (
                <span className="text-red-500 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Ingresa un User ID para continuar
                </span>
              )}
              <button
                onClick={handleExport}
                disabled={!userId.trim()}
                className={`px-8 py-3 rounded-lg font-medium flex items-center shadow-lg transition-all ${
                  userId.trim()
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-200'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <Send className="h-5 w-5 mr-2" />
                Exportar Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 4: Exportando */}
      {/* ============================================================= */}
      {step === 4 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Header con botón de ayuda */}
          <div className="flex justify-end mb-2">
            <ExportHelpButton onClick={() => setShowHelp(true)} />
          </div>
          
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Generando tu archivo...
            </h2>
            <p className="text-slate-500 mb-8">
              Estamos procesando {activeData.length} registros y creando tu archivo {getInnerConfig(selectedProcessType).fileType}.
            </p>

            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center text-sm text-slate-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Validando datos
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <div className="flex items-center text-blue-600">
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Generando archivo
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                  <div className="flex items-center text-slate-400">
                    <Upload className="h-4 w-4 mr-1" />
                    Subiendo a S3
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 5: Resultado */}
      {/* ============================================================= */}
      {step === 5 && exportResult && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {/* Header con botón de ayuda */}
          <div className="flex justify-end mb-2">
            <ExportHelpButton onClick={() => setShowHelp(true)} />
          </div>
          
          <div className="text-center py-4 mb-6 border-b border-slate-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              ¡Exportación Exitosa!
            </h2>
            <p className="text-slate-500">
              Tu archivo ha sido generado y está listo para descargar
            </p>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg text-center border border-green-200">
              <Database className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-700">{exportResult.total}</div>
              <div className="text-sm text-green-600">Registros exportados</div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200">
              <Columns className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-700">{exportResult.validatedColumns.length}</div>
              <div className="text-sm text-blue-600">Columnas incluidas</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg text-center border border-purple-200">
              <div className={`mx-auto mb-2 w-10 h-10 rounded-lg flex items-center justify-center ${FILE_TYPE_COLORS[getInnerConfig(selectedProcessType).fileType]}`}>
                {FILE_TYPE_ICONS[getInnerConfig(selectedProcessType).fileType]}
              </div>
              <div className="text-xl font-bold text-purple-700">{getInnerConfig(selectedProcessType).fileType}</div>
              <div className="text-sm text-purple-600">Formato</div>
            </div>
          </div>

          {/* URL del archivo */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Link2 className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">URL del Archivo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(exportResult.fileUrl)}
                  className="px-3 py-1.5 text-sm text-green-700 hover:bg-green-100 rounded-lg flex items-center"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </button>
                <a
                  href={exportResult.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center shadow-md"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </a>
              </div>
            </div>
            <input
              type="text"
              value={exportResult.fileUrl}
              readOnly
              className="w-full px-3 py-2 bg-white border border-green-200 rounded-lg text-sm font-mono text-slate-600"
            />
          </div>

          {/* Detalles adicionales */}
          <div className="mb-6">
            <h3 className="font-medium text-slate-700 mb-3">Columnas validadas:</h3>
            <div className="flex flex-wrap gap-2">
              {exportResult.validatedColumns.map(col => (
                <span
                  key={col.key}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    col.required 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {col.columnName}
                  {col.required && <CheckCircle className="h-3 w-3 ml-1 inline" />}
                </span>
              ))}
            </div>
          </div>

          {/* Info de trazabilidad */}
          {exportResult.userProcessConfig && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700 mb-3 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Información de Trazabilidad
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">File ID:</span>
                  <p className="font-mono text-slate-700">{exportResult.file}</p>
                </div>
                <div>
                  <span className="text-slate-400">Organization:</span>
                  <p className="font-mono text-slate-700 truncate">{exportResult.userProcessConfig.identificationId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Process Type ID:</span>
                  <p className="font-mono text-slate-700">{exportResult.userProcessConfig.processTypeId}</p>
                </div>
                {exportResult.entityType && (
                  <div>
                    <span className="text-slate-400">Entity Type:</span>
                    <p className="font-medium text-purple-700">{exportResult.entityType}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón para nueva exportación */}
          <div className="flex justify-center">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center shadow-lg shadow-green-200"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Nueva Exportación
            </button>
          </div>
        </div>
      )}

      {/* Ayuda */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg">
        <div className="flex items-start">
          <HelpCircle className="h-5 w-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">¿Cómo funciona?</p>
            <p>
              Este portal te permite exportar datos en formato JSON a archivos TXT, CSV o Excel.
              Selecciona el tipo de exportación, proporciona tus datos en formato JSON, y nosotros 
              generamos el archivo con las columnas configuradas. El archivo se sube automáticamente 
              a S3 y recibes la URL de descarga.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="flex items-center text-slate-500">
                <FileText className="h-4 w-4 mr-1 text-blue-500" />
                <span>TXT: Columnas alineadas con espacios</span>
              </div>
              <div className="flex items-center text-slate-500">
                <Table className="h-4 w-4 mr-1 text-green-500" />
                <span>CSV: Formato RFC 4180</span>
              </div>
              <div className="flex items-center text-slate-500">
                <FileSpreadsheet className="h-4 w-4 mr-1 text-purple-500" />
                <span>XLSX: Excel con estilos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPortal;
