import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Search, User, Edit, Plus, Filter, 
  Trash2, Eye, Check, 
  ArrowLeft, X, Save, AlertCircle,
  Settings, LayoutList, Download, Upload, Globe, Loader2, RefreshCw,
  HelpCircle, Info, FileSpreadsheet, Database, Link, Columns,
  BookOpen, ArrowRight, Zap, Layers, Code, FileText,
  FileUp, Server, CheckCircle2, ArrowDownToLine, FileDown, ClipboardList
} from 'lucide-react';
import { useApiBaseUrl, useEnvironmentVersion } from './EnvironmentContext';

// =============================================================================
// SISTEMA DE AYUDA CONTEXTUAL - CONFIGURACIÓN DE PROCESOS
// =============================================================================

// AYUDA PARA IMPORTACIÓN
const IMPORT_HELP_CONTENT: Record<number, { title: string; sections: Array<{ subtitle: string; content: string }> }> = {
  1: {
    title: 'Crear proceso de Importación',
    sections: [
      {
        subtitle: '¿Qué es un proceso de Importación?',
        content: 'Te permite subir archivos (Excel, CSV, etc.) al sistema. KBatch los procesa, valida los datos y los envía automáticamente al sistema que indiques.'
      },
      {
        subtitle: 'Nombre del proceso',
        content: 'Dale un nombre descriptivo que identifique claramente para qué sirve.\n\nEjemplos:\n• "Importar Clientes"\n• "Cargar Órdenes de Pago"\n• "Subir Facturas Mensuales"'
      },
      {
        subtitle: 'Formatos de archivo',
        content: '• Excel (.xlsx): El más común, ideal para hojas de cálculo\n• CSV: Texto separado por comas, muy ligero\n• TXT: Texto plano simple\n• JSON: Datos estructurados'
      },
      {
        subtitle: '¿Qué son los "Registros por lote"?',
        content: 'Define cuántos registros se envían en cada petición al sistema destino.\n\nEjemplo: Si subes un archivo con 10,000 registros y configuras 1,000 registros por lote, el sistema hará 10 envíos al sistema destino, cada uno con 1,000 registros procesados.\n\nValor recomendado: 500-1000 registros por lote.'
      }
    ]
  },
  2: {
    title: 'Columnas del archivo',
    sections: [
      {
        subtitle: '¿Qué columnas debo definir?',
        content: 'Define las columnas que esperas recibir en los archivos que te suban. Cada columna representa un dato.\n\nEjemplos: email, monto, nombre, telefono'
      },
      {
        subtitle: '¿Qué es el "Nombre del campo"?',
        content: 'Es el nombre que identifica cada dato en tu proceso. Este nombre se usará para procesar y enviar la información al sistema destino.'
      },
      {
        subtitle: '¿Qué es el "Nombre en archivo"?',
        content: 'Es opcional. Si quieres que el dato aparezca con otro nombre en el resultado final, escríbelo aquí.\n\nEjemplo:\n• Campo: "email"\n• Nombre en archivo: "correo_cliente"\n• Resultado: El dato se enviará como "correo_cliente"'
      },
      {
        subtitle: 'Columnas obligatorias',
        content: 'Marca como obligatoria las columnas que SIEMPRE deben existir en el archivo que subes. Si falta alguna obligatoria, el registro será rechazado.'
      },
      {
        subtitle: 'Validación de formato',
        content: '• Correo electrónico: Valida que sea un email válido\n• Número: Solo valores numéricos\n• Fecha: Formato de fecha\n• Teléfono: Número telefónico, etc.'
      }
    ]
  },
  3: {
    title: 'Sistema destino',
    sections: [
      {
        subtitle: '¿Qué es el sistema destino?',
        content: 'Es el servicio que recibirá los datos procesados. Por ejemplo, si importas clientes, el sistema destino sería tu servicio de gestión de clientes.'
      },
      {
        subtitle: 'URL del sistema destino',
        content: 'Es la dirección web donde se enviarán los datos procesados o la respuesta final del proceso. Tu equipo técnico te proporcionará esta información.\n\nEjemplo: https://mi-empresa.com/api/clientes'
      }
    ]
  },
  4: {
    title: 'Revisar configuración',
    sections: [
      {
        subtitle: '¿Qué verificar?',
        content: '• Los nombres de las columnas sean correctos\n• Las columnas obligatorias estén marcadas\n• La URL del sistema destino sea correcta\n• Las validaciones de formato sean las adecuadas'
      },
      {
        subtitle: '¿Puedo modificar después?',
        content: 'Sí, puedes editar esta configuración cuando quieras. Los cambios aplicarán a nuevos procesos.'
      },
      {
        subtitle: '¿Qué sigue?',
        content: 'Una vez guardado, el proceso aparecerá en el portal de "Importar Archivos" listo para usar.'
      }
    ]
  }
};

// AYUDA PARA EXPORTACIÓN
const EXPORT_HELP_CONTENT: Record<number, { title: string; sections: Array<{ subtitle: string; content: string }> }> = {
  1: {
    title: 'Crear proceso de Exportación',
    sections: [
      {
        subtitle: '¿Qué es un proceso de Exportación?',
        content: 'Te permite generar archivos (Excel, CSV) a partir de datos que envías al sistema. Ideal para crear reportes o descargar información.'
      },
      {
        subtitle: 'Nombre del proceso',
        content: 'Dale un nombre descriptivo que identifique claramente para qué sirve.\n\nEjemplos:\n• "Exportar Reporte de Pagos"\n• "Generar Lista de Clientes"\n• "Descargar Transacciones"'
      },
      {
        subtitle: 'Formatos de archivo',
        content: '• Excel (.xlsx): El más común, ideal para reportes\n• CSV: Texto separado por comas, muy ligero\n• TXT: Texto plano simple'
      },
      {
        subtitle: 'Tipo de entidad (opcional)',
        content: 'Un identificador para categorizar tus exportaciones. Por ejemplo: "CLIENTES", "PAGOS", "FACTURAS".'
      }
    ]
  },
  2: {
    title: 'Columnas del archivo',
    sections: [
      {
        subtitle: '¿Qué columnas debo definir?',
        content: 'Define las columnas que tendrá el archivo generado. Cada columna representa un dato que aparecerá en el reporte.'
      },
      {
        subtitle: '¿Qué es el "Nombre del campo"?',
        content: 'Es el nombre del dato que enviarás para generar el archivo. Debe coincidir con los datos que mandas.\n\nEjemplo: Si envías {"payment_id": 123}, el nombre del campo sería "payment_id".'
      },
      {
        subtitle: '¿Qué es el "Nombre en archivo"?',
        content: 'Es cómo aparecerá la columna en el archivo generado. Úsalo para nombres más amigables.\n\nEjemplo:\n• Campo: "payment_id"\n• Nombre en archivo: "ID del Pago"\n• Resultado: La columna en Excel se llamará "ID del Pago"'
      },
      {
        subtitle: 'Columnas obligatorias',
        content: 'Marca como obligatoria las columnas que siempre deben aparecer en los datos que envías. Si falta alguna obligatoria, el registro será rechazado.'
      }
    ]
  },
  3: {
    title: 'Revisar configuración',
    sections: [
      {
        subtitle: '¿Qué verificar?',
        content: '• Los nombres de las columnas sean correctos\n• Los nombres en archivo sean descriptivos\n• Las columnas obligatorias estén marcadas'
      },
      {
        subtitle: '¿Puedo modificar después?',
        content: 'Sí, puedes editar esta configuración cuando quieras. Los cambios aplicarán a nuevas exportaciones.'
      },
      {
        subtitle: '¿Qué sigue?',
        content: 'Una vez guardado, el proceso aparecerá en el portal de "Exportar Archivos" listo para usar.'
      }
    ]
  }
};

// Modal de ayuda para Configuration
const ConfigHelpModal: React.FC<{ step: number; onClose: () => void; isImport: boolean; totalSteps: number }> = ({ step, onClose, isImport, totalSteps }) => {
  // Usar el contenido correcto según el tipo de proceso
  const helpContent = isImport ? IMPORT_HELP_CONTENT : EXPORT_HELP_CONTENT;
  const content = helpContent[step];
  
  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${isImport ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'} text-white px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-lg font-bold">{content.title}</h2>
              <span className="text-xs opacity-80">
                {isImport ? 'Proceso de Importación' : 'Proceso de Exportación'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] space-y-5">
          {content.sections.map((section, idx) => (
            <div 
              key={idx} 
              className={`border-l-4 pl-4 ${isImport ? 'border-blue-200' : 'border-green-200'}`}
            >
              <h3 className="font-semibold mb-2 flex items-center text-slate-800">
                <span className={`w-6 h-6 ${isImport ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center text-xs font-bold mr-2`}>
                  {idx + 1}
                </span>
                {section.subtitle}
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-600">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Paso {step} de {totalSteps} • {isImport ? 'Importación' : 'Exportación'}
          </p>
          <button
            onClick={onClose}
            className={`px-4 py-2 ${isImport ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg text-sm font-medium transition-colors`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// Botón de ayuda para Configuration
const ConfigHelpButton: React.FC<{ onClick: () => void; isImport?: boolean }> = ({ onClick, isImport = true }) => (
  <button
    onClick={onClick}
    className={`p-2 ${isImport ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'} rounded-lg transition-colors`}
    title="Ver ayuda"
  >
    <HelpCircle className="h-5 w-5" />
  </button>
);

// =============================================================================
// MODALES EXPLICATIVOS - IMPORTACIÓN, EXPORTACIÓN Y MODOS DE CREACIÓN
// =============================================================================

// Modal explicativo para IMPORTACIÓN
const ImportExplainerModal: React.FC<{ onClose: () => void; onSelect: () => void }> = ({ onClose, onSelect }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: FileUp,
      title: 'Usuario sube archivo',
      description: 'El usuario selecciona un archivo (Excel, CSV, TXT o JSON) con datos para procesar.',
      visual: (
        <div className="flex items-center justify-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl">
            <FileSpreadsheet className="h-12 w-12 text-blue-600" />
          </div>
          <ArrowRight className="h-6 w-6 text-slate-400 animate-pulse" />
          <div className="bg-slate-100 p-4 rounded-xl border-2 border-dashed border-slate-300">
            <Upload className="h-12 w-12 text-slate-400" />
          </div>
        </div>
      )
    },
    {
      icon: CheckCircle2,
      title: 'KBatch valida los datos',
      description: 'El sistema verifica que cada fila cumpla con las reglas: columnas correctas, formatos válidos, datos obligatorios.',
      visual: (
        <div className="flex items-center justify-center gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">email válido</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">monto numérico</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">fecha inválida</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Layers,
      title: 'Se divide en lotes',
      description: 'Los datos válidos se agrupan en lotes (ej: 500 registros por lote) para enviarlos de forma ordenada.',
      visual: (
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-700">Lote {i}</div>
              <div className="text-xs text-blue-500">500 registros</div>
            </div>
          ))}
          <span className="text-slate-400 text-sm">...</span>
        </div>
      )
    },
    {
      icon: Server,
      title: 'Se envían al sistema destino',
      description: 'Cada lote se envía automáticamente al servicio que configuraste (tu API, sistema de clientes, etc.).',
      visual: (
        <div className="flex items-center justify-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Layers className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex flex-col items-center">
            <ArrowRight className="h-5 w-5 text-blue-500" />
            <ArrowRight className="h-5 w-5 text-blue-500 -mt-1" />
            <ArrowRight className="h-5 w-5 text-blue-500 -mt-1" />
          </div>
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-xl shadow-lg">
            <Globe className="h-10 w-10 text-white" />
            <div className="text-[10px] text-slate-300 mt-1 text-center">Tu API</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">¿Qué es un proceso de Importación?</h2>
                <p className="text-blue-100 text-sm mt-0.5">Sube archivos y procesa datos automáticamente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Visual Steps Indicator */}
          <div className="flex items-center justify-center mb-6">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-col items-center transition-all ${isActive ? 'scale-110' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                      isPast ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                      Paso {idx + 1}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 transition-colors ${idx < currentStep ? 'bg-blue-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Step Content */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 min-h-[200px]">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{steps[currentStep].title}</h3>
              <p className="text-sm text-slate-600 mt-1">{steps[currentStep].description}</p>
            </div>
            <div className="flex justify-center py-4">{steps[currentStep].visual}</div>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-blue-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>

          {/* Examples */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <h4 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Ejemplos de uso
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Subir lista de clientes desde un Excel</li>
              <li>• Cargar pagos masivos desde un CSV</li>
              <li>• Importar catálogo de productos</li>
              <li>• Procesar facturas en lote</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
            Cerrar
          </button>
          <div className="flex items-center gap-3">
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => { onSelect(); onClose(); }}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Crear Importación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal explicativo para EXPORTACIÓN
const ExportExplainerModal: React.FC<{ onClose: () => void; onSelect: () => void }> = ({ onClose, onSelect }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: Database,
      title: 'Sistema envía datos',
      description: 'Tu aplicación o servicio envía los datos que quieres exportar (lista de clientes, reportes, transacciones, etc.).',
      visual: (
        <div className="flex items-center justify-center gap-4">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-xl shadow-lg">
            <Database className="h-10 w-10 text-white" />
            <div className="text-[10px] text-slate-300 mt-1 text-center">Tu Sistema</div>
          </div>
          <ArrowRight className="h-6 w-6 text-slate-400 animate-pulse" />
          <div className="bg-green-100 p-4 rounded-xl border-2 border-green-300">
            <Server className="h-10 w-10 text-green-600" />
            <div className="text-[10px] text-green-700 mt-1 text-center font-medium">KBatch</div>
          </div>
        </div>
      )
    },
    {
      icon: Columns,
      title: 'KBatch organiza las columnas',
      description: 'Los datos se estructuran según las columnas que configuraste. Puedes definir nombres amigables para cada columna.',
      visual: (
        <div className="flex items-center justify-center">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 text-xs">
              <div className="bg-green-600 text-white px-3 py-2 font-medium">ID Cliente</div>
              <div className="bg-green-600 text-white px-3 py-2 font-medium">Nombre</div>
              <div className="bg-green-600 text-white px-3 py-2 font-medium">Email</div>
              <div className="px-3 py-2 border-t border-l border-slate-200">001</div>
              <div className="px-3 py-2 border-t border-slate-200">Juan Pérez</div>
              <div className="px-3 py-2 border-t border-r border-slate-200">juan@email.com</div>
              <div className="px-3 py-2 border-t border-l border-b border-slate-200">002</div>
              <div className="px-3 py-2 border-t border-b border-slate-200">María López</div>
              <div className="px-3 py-2 border border-slate-200">maria@email.com</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: FileDown,
      title: 'Se genera el archivo',
      description: 'KBatch crea automáticamente el archivo en el formato elegido (Excel, CSV o TXT) listo para descargar.',
      visual: (
        <div className="flex items-center justify-center gap-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <Zap className="h-8 w-8 text-green-600" />
          </div>
          <ArrowRight className="h-6 w-6 text-green-500" />
          <div className="flex gap-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto" />
              <div className="text-[10px] text-green-700 mt-1 font-medium">.xlsx</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <FileText className="h-8 w-8 text-slate-500 mx-auto" />
              <div className="text-[10px] text-slate-600 mt-1">.csv</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: ArrowDownToLine,
      title: 'Usuario descarga',
      description: 'El archivo queda disponible para descargar inmediatamente. ¡Proceso instantáneo!',
      visual: (
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="bg-green-100 p-4 rounded-full animate-bounce">
            <ArrowDownToLine className="h-10 w-10 text-green-600" />
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
            reporte_clientes.xlsx
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">¿Qué es un proceso de Exportación?</h2>
                <p className="text-green-100 text-sm mt-0.5">Genera archivos descargables desde tus datos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Visual Steps Indicator */}
          <div className="flex items-center justify-center mb-6">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={`flex flex-col items-center transition-all ${isActive ? 'scale-110' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' :
                      isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-green-700' : 'text-slate-400'}`}>
                      Paso {idx + 1}
                    </span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 transition-colors ${idx < currentStep ? 'bg-green-400' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Step Content */}
          <div className="bg-slate-50 rounded-xl p-6 mb-6 min-h-[200px]">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">{steps[currentStep].title}</h3>
              <p className="text-sm text-slate-600 mt-1">{steps[currentStep].description}</p>
            </div>
            <div className="flex justify-center py-4">{steps[currentStep].visual}</div>
          </div>

          {/* Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentStep ? 'w-6 bg-green-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              />
            ))}
          </div>

          {/* Comparison with Import */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-slate-200">
            <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-600" />
              Diferencia con Importación
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                  <Download className="h-4 w-4" /> Exportación
                </div>
                <p className="text-slate-600 text-xs">Genera archivos desde datos que envías</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                  <Upload className="h-4 w-4" /> Importación
                </div>
                <p className="text-slate-600 text-xs">Procesa archivos que subes al sistema</p>
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <h4 className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Ejemplos de uso
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Generar reporte de ventas mensual en Excel</li>
              <li>• Exportar lista de clientes para enviar por email</li>
              <li>• Crear archivo CSV de transacciones</li>
              <li>• Descargar inventario actualizado</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
            Cerrar
          </button>
          <div className="flex items-center gap-3">
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => { onSelect(); onClose(); }}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-lg shadow-green-200 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Crear Exportación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal explicativo para JSON vs Paso a Paso
const CreationModeHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">¿Cómo crear una configuración?</h2>
                <p className="text-purple-100 text-sm mt-0.5">Dos formas de configurar tu proceso</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Two options comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* JSON Mode */}
            <div className="bg-gradient-to-br from-purple-50 to-slate-50 rounded-xl p-5 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-600 p-2.5 rounded-lg">
                  <Code className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-800">Modo JSON</h3>
                  <p className="text-xs text-purple-600">Para usuarios avanzados</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Pega una configuración completa de una vez</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Ideal si ya tienes el JSON preparado</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Más rápido para copiar configuraciones existentes</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Permite configuraciones más complejas</span>
                </div>
              </div>

              <div className="bg-purple-100 rounded-lg p-3">
                <p className="text-xs text-purple-700 font-medium mb-2">Ejemplo de uso:</p>
                <p className="text-xs text-purple-600">Tu equipo técnico te da un JSON de configuración y solo necesitas pegarlo aquí.</p>
              </div>
            </div>

            {/* Step by Step Mode */}
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-5 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-2.5 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">Modo Paso a Paso</h3>
                  <p className="text-xs text-blue-600">Para todos los usuarios</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Formulario guiado e intuitivo</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">No requiere conocimientos técnicos</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Ayuda contextual en cada paso</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">Validaciones automáticas</span>
                </div>
              </div>

              <div className="bg-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-2">Ejemplo de uso:</p>
                <p className="text-xs text-blue-600">Es tu primera vez configurando un proceso y prefieres que el sistema te guíe.</p>
              </div>
            </div>
          </div>

          {/* Visual comparison */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-600" />
              ¿Cuál elegir?
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Code className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Elige JSON si...</p>
                  <p className="text-xs text-slate-500">Ya tienes una configuración JSON lista, o quieres duplicar una existente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-white rounded-lg p-3 border border-slate-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Elige Paso a Paso si...</p>
                  <p className="text-xs text-slate-500">Es tu primera vez, o prefieres un formulario guiado con ayuda</p>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>Nota:</strong> Ambos modos crean el mismo tipo de configuración. El resultado final es idéntico, solo cambia la forma de introducir los datos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SISTEMA DE AYUDA GLOBAL - CENTRO DE AYUDA DE CONFIGURACIÓN
// =============================================================================

const CONFIGURATION_HELP_TOPICS: Array<{
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
        subtitle: '¿Para qué sirve esta sección?',
        content: 'Aquí se crean y administran las "Configuraciones de Proceso". Cada configuración le dice al sistema cómo debe procesar un tipo de archivo específico.\n\nPiensa en cada configuración como una plantilla o receta: define qué columnas esperas, qué validaciones aplicar y a dónde enviar los datos procesados.'
      },
      {
        subtitle: '¿Qué veo en la lista?',
        content: 'La lista muestra todas las configuraciones creadas. Cada tarjeta incluye:\n• Nombre y descripción del proceso\n• Tipo: Importación (azul) o Exportación (verde)\n• Formato de archivo (Excel, CSV, TXT, JSON)\n• Cantidad de columnas definidas\n• Registros por lote (solo importación)\n• Fecha de creación'
      },
      {
        subtitle: '¿Qué acciones puedo hacer?',
        content: '• Ver detalle: Inspeccionar la configuración completa\n• Editar: Modificar cualquier aspecto de la configuración\n• Eliminar: Borrar la configuración permanentemente\n• Nueva Configuración: Crear una desde cero usando el asistente paso a paso\n\nTambién puedes filtrar por tipo (Import/Export) y buscar por nombre.'
      },
      {
        subtitle: '¿Es necesario crear configuraciones antes de usar KBatch?',
        content: 'Sí. Sin al menos una configuración, no se podrán importar ni exportar archivos. Las configuraciones son el primer paso para que el sistema sepa cómo procesar cada tipo de archivo.\n\nUna vez creada, la configuración queda disponible en los portales de "Importar Archivos" y "Exportar Archivos".'
      }
    ]
  },
  {
    id: 'import',
    icon: Upload,
    title: 'Procesos de Importación',
    description: 'Subir archivos al sistema',
    sections: [
      {
        subtitle: '¿Qué es un proceso de Importación?',
        content: 'Un proceso de importación permite subir archivos (Excel, CSV, TXT o JSON) al sistema. KBatch toma el archivo, valida cada fila según las reglas que definiste, divide los datos en lotes y los envía automáticamente al sistema que configuraste como destino.'
      },
      {
        subtitle: '¿Cómo funciona paso a paso?',
        content: '1. Un usuario sube un archivo (ej: "clientes.xlsx")\n2. KBatch lee el archivo y verifica que tenga las columnas correctas\n3. Se valida cada fila según los formatos configurados (email, número, fecha, etc.)\n4. Los datos válidos se dividen en lotes del tamaño configurado\n5. Cada lote se envía al sistema destino para que los procese\n6. El sistema destino confirma si pudo procesarlos o si hubo errores'
      },
      {
        subtitle: '¿Qué pasa con las filas que tienen errores?',
        content: 'Las filas que no pasan la validación se separan automáticamente y se guardan aparte con un detalle del error. Esto permite que las filas correctas se procesen sin problemas mientras puedes revisar y corregir las que fallaron.'
      },
      {
        subtitle: 'Formatos de archivo soportados',
        content: '• Excel (.xlsx): El más común. Ideal para hojas de cálculo con datos tabulares\n• CSV: Texto separado por comas. Muy ligero y universal\n• TXT: Texto plano. Para datos simples separados por un delimitador\n• JSON: Datos estructurados. Para integraciones más técnicas'
      },
      {
        subtitle: 'Ejemplo práctico',
        content: 'Caso: "Importar lista de clientes"\n• Formato: Excel (.xlsx)\n• Columnas: nombre (obligatorio), email (obligatorio, formato email), teléfono (opcional)\n• Registros por lote: 500\n• Sistema destino: API del servicio de gestión de clientes\n\nEl usuario sube un Excel con 2,000 clientes → KBatch valida → Divide en 4 lotes de 500 → Envía cada lote al servicio de clientes.'
      }
    ]
  },
  {
    id: 'export',
    icon: Download,
    title: 'Procesos de Exportación',
    description: 'Generar archivos desde datos',
    sections: [
      {
        subtitle: '¿Qué es un proceso de Exportación?',
        content: 'Un proceso de exportación genera archivos descargables (Excel, CSV o TXT) a partir de datos que se envían al sistema. Es lo contrario de la importación: en vez de subir un archivo, lo generas.'
      },
      {
        subtitle: '¿Cómo funciona?',
        content: '1. Se envían datos al sistema (por ejemplo, una lista de pagos)\n2. KBatch toma esos datos y los organiza según las columnas que configuraste\n3. Se genera un archivo en el formato elegido (Excel, CSV o TXT)\n4. El archivo queda disponible para descargar\n\nLa generación es prácticamente instantánea.'
      },
      {
        subtitle: 'Diferencias con la Importación',
        content: '• La exportación NO requiere sistema destino (no hay API externa)\n• La exportación NO requiere registros por lote\n• La exportación genera un archivo, no lo recibe\n• La exportación es inmediata, la importación puede tomar más tiempo\n• La exportación usa "columnas" en vez de "validaciones"'
      },
      {
        subtitle: 'Formatos de archivo disponibles',
        content: '• Excel (.xlsx): Ideal para reportes con formato profesional\n• CSV: Texto separado por comas. Ligero y fácil de procesar\n• TXT: Texto plano. Para datos simples\n\nNota: JSON no está disponible para exportación.'
      },
      {
        subtitle: 'Tipo de entidad (opcional)',
        content: 'Es un identificador para categorizar tus exportaciones. Ejemplos:\n• "CLIENTES" para reportes de clientes\n• "PAGOS" para reportes de pagos\n• "FACTURAS" para reportes de facturación\n\nNo es obligatorio, pero ayuda a organizar cuando tienes muchos procesos de exportación.'
      }
    ]
  },
  {
    id: 'columns',
    icon: Columns,
    title: 'Columnas y Validaciones',
    description: 'Configurar la estructura de datos',
    sections: [
      {
        subtitle: '¿Qué son las columnas?',
        content: 'Las columnas definen qué datos esperas recibir (importación) o generar (exportación). Cada columna es un campo de información, como "nombre", "email", "monto", etc.\n\nEs como definir los encabezados de una hoja de cálculo: le dices al sistema exactamente qué datos debe buscar o crear.'
      },
      {
        subtitle: 'Nombre del campo',
        content: 'Para Importación:\nEs el nombre que identifica cada dato en tu proceso. Cuando el archivo se procesa, cada columna se asocia a este nombre.\n\nPara Exportación:\nEs el nombre del dato que enviarás para generar el archivo. Debe coincidir con los datos que mandas al sistema.'
      },
      {
        subtitle: 'Nombre en archivo (alias)',
        content: 'Es opcional. Permite que un dato aparezca con un nombre diferente en el resultado final.\n\nPara Importación:\nEjemplo: El campo se llama "email" internamente, pero quieres que se envíe como "correo_electronico" al sistema destino.\n\nPara Exportación:\nEjemplo: El campo se llama "payment_id" en los datos, pero quieres que la columna en Excel se llame "ID del Pago".'
      },
      {
        subtitle: 'Columna obligatoria vs opcional',
        content: 'Obligatoria (marcada con check): Si falta este dato en una fila, esa fila será rechazada por validación. Úsala para datos que son imprescindibles.\n\nOpcional (sin marcar): Si falta este dato, la fila se procesa igual. Úsala para datos complementarios que no siempre están disponibles.'
      },
      {
        subtitle: 'Formatos de validación disponibles',
        content: 'Al crear columnas de importación, puedes elegir un formato que valide automáticamente los datos:\n\n• Correo electrónico: Verifica que sea un email válido (ej: usuario@empresa.com)\n• Número: Solo valores numéricos (enteros o decimales)\n• Fecha: Formato de fecha reconocible\n• Teléfono: Número telefónico con formato válido\n• Enlace web (URL): Dirección web completa\n• DNI: Documento de identidad\n• Moneda: Valores monetarios\n• Porcentaje: Valores entre 0 y 100\n• Sí/No: Valores booleanos (true/false)\n• Alfanumérico: Solo letras y números\n• Identificador único: Formato UUID\n• Y más...\n\nSi no necesitas validación especial, deja "Sin validación específica".'
      }
    ]
  },
  {
    id: 'destination',
    icon: Globe,
    title: 'Sistema Destino',
    description: 'A dónde van los datos procesados',
    sections: [
      {
        subtitle: '¿Qué es el sistema destino?',
        content: 'Solo aplica para Importación. Es el servicio externo que recibirá y procesará los datos de tu archivo. Cuando KBatch termina de validar y dividir los datos en lotes, los envía a esta dirección.\n\nEjemplo: Si importas clientes, el sistema destino sería tu servicio de gestión de clientes. Si importas pagos, sería tu servicio de pagos.'
      },
      {
        subtitle: 'URL del sistema destino',
        content: 'Es la dirección web (URL) a la que KBatch enviará los datos procesados. Tu equipo técnico te proporcionará esta información.\n\nEjemplos:\n• https://api.miempresa.com/clientes/importar\n• https://api.miempresa.com/pagos/bulk\n• https://servicio-externo.com/v1/datos\n\nEsta URL varía según el servicio que vaya a consumir los datos.'
      },
      {
        subtitle: '¿Cómo es el flujo de envío?',
        content: 'Cuando un usuario sube un archivo:\n\n1. KBatch valida y divide en lotes\n2. Cada lote se pone en una cola de procesamiento\n3. Un servicio intermedio (Lambda) toma cada lote de la cola\n4. La Lambda envía el lote al sistema destino\n5. El sistema destino procesa los datos\n6. El sistema destino confirma el resultado a KBatch\n\nTodo esto sucede automáticamente. Solo necesitas configurar la URL correcta.'
      },
      {
        subtitle: 'URL de notificaciones (callback)',
        content: 'Esta URL se configura automáticamente y no necesitas modificarla. Es la dirección que usa el sistema destino para informar a KBatch si pudo procesar cada lote correctamente o si hubo errores.\n\nKBatch genera esta URL por ti según el ambiente en el que estés trabajando (desarrollo, producción, etc.).'
      },
      {
        subtitle: '¿Por qué la exportación no tiene sistema destino?',
        content: 'Porque en la exportación, KBatch genera un archivo directamente. No necesita enviar datos a ningún servicio externo. El resultado es un archivo descargable (Excel, CSV o TXT) que se almacena para que puedas descargarlo.'
      }
    ]
  },
  {
    id: 'batch-size',
    icon: Layers,
    title: 'Registros por lote',
    description: 'Cómo se dividen los datos',
    sections: [
      {
        subtitle: '¿Qué son los "Registros por lote"?',
        content: 'Solo aplica para Importación. Define cuántos registros se envían en cada envío al sistema destino.\n\nCuando subes un archivo con muchos registros (por ejemplo, 10,000 filas), KBatch no los envía todos de golpe. Los divide en porciones más pequeñas llamadas "lotes" o "bloques" para procesarlos de manera ordenada y eficiente.'
      },
      {
        subtitle: 'Ejemplo práctico',
        content: 'Si subes un archivo con 5,000 registros y configuras 1,000 registros por lote:\n• Se crearán 5 lotes de 1,000 registros cada uno\n• Cada lote se procesa de forma independiente\n• Si un lote falla, los demás siguen procesándose\n• Puedes ver el progreso lote por lote'
      },
      {
        subtitle: '¿Qué valor debo usar?',
        content: 'Recomendado: entre 500 y 1,000 registros por lote.\n\n• Valor bajo (100-300): Más lotes, procesamiento más granular. Útil cuando cada registro requiere mucho procesamiento.\n• Valor medio (500-1,000): Balance ideal entre velocidad y control. Recomendado para la mayoría de casos.\n• Valor alto (2,000-5,000): Menos lotes, envíos más grandes. Útil cuando el procesamiento por registro es ligero.'
      },
      {
        subtitle: 'Campo editable',
        content: 'Puedes cambiar este valor en cualquier momento. Los cambios solo afectan a los nuevos archivos que se procesen. Los archivos que ya fueron procesados anteriormente no se ven afectados.\n\nPara editar, simplemente borra el valor actual y escribe el nuevo. Si dejas el campo vacío, al salir se restaurará el valor por defecto (500).'
      }
    ]
  },
  {
    id: 'flow',
    icon: Zap,
    title: 'Flujo completo de KBatch',
    description: 'De inicio a fin',
    sections: [
      {
        subtitle: 'Paso 1: Crear Configuración (esta sección)',
        content: 'Todo empieza aquí. Antes de importar o exportar, necesitas crear una configuración que defina:\n• Qué tipo de archivo se va a procesar\n• Qué columnas debe tener\n• Qué validaciones aplicar\n• A dónde enviar los datos (solo importación)\n\nEs como crear una plantilla que el sistema usará cada vez que alguien suba o genere un archivo.'
      },
      {
        subtitle: 'Paso 2: Sincronizar Usuarios',
        content: 'Para que alguien pueda usar KBatch, primero debe estar registrado (sincronizado) en el sistema. Esto se hace desde la sección "Gestión de Usuarios".\n\nCada usuario se asocia a una organización y a una aplicación. Esto permite saber quién hizo cada operación.'
      },
      {
        subtitle: 'Paso 3a: Importar Archivos',
        content: 'Con la configuración creada y el usuario sincronizado, ya se pueden importar archivos:\n1. Ir a "Importar Archivos"\n2. Seleccionar la configuración (tipo de proceso)\n3. Subir el archivo\n4. KBatch valida, divide en lotes y envía\n5. Ver el resultado con detalle de éxitos y errores\n\nEstados del proceso: Pendiente → En Proceso → Procesado Ext. → Completado'
      },
      {
        subtitle: 'Paso 3b: Exportar Archivos',
        content: 'Para generar un archivo de descarga:\n1. Ir a "Exportar Archivos"\n2. Seleccionar la configuración de exportación\n3. Enviar los datos\n4. KBatch genera el archivo inmediatamente\n5. Descargar el archivo generado\n\nLa exportación es prácticamente instantánea.'
      },
      {
        subtitle: 'Paso 4: Monitorear',
        content: 'Volver a "Gestión de Usuarios y Procesos" para:\n• Ver el estado de todos los procesos\n• Filtrar por aplicación, empresa o usuario\n• Descargar archivos procesados\n• Verificar que todo se completó correctamente'
      },
      {
        subtitle: 'Diagrama simplificado',
        content: '1. CONFIGURAR (esta sección)\n   Crear plantilla de proceso\n   ↓\n2. SINCRONIZAR USUARIO\n   Registrar quién va a usar KBatch\n   ↓\n3. IMPORTAR / EXPORTAR\n   Subir o generar archivos\n   ↓\n4. MONITOREAR\n   Ver resultados y estados'
      }
    ]
  }
];

// Modal de ayuda global para Configuración de Procesos
const ConfigurationHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const topic = CONFIGURATION_HELP_TOPICS[selectedTopic];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <HelpCircle className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-lg font-bold">Centro de Ayuda</h2>
              <p className="text-slate-300 text-xs">Configuración de Procesos</p>
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
              {CONFIGURATION_HELP_TOPICS.map((t, idx) => {
                const TopicIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all text-sm flex items-start gap-2.5 ${
                      selectedTopic === idx
                        ? 'bg-slate-200 text-slate-800 font-medium shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <TopicIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      selectedTopic === idx ? 'text-slate-700' : 'text-slate-400'
                    }`} />
                    <div>
                      <div className="font-medium text-xs leading-tight">{t.title}</div>
                      <div className={`text-[10px] mt-0.5 ${
                        selectedTopic === idx ? 'text-slate-600' : 'text-slate-400'
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
                {React.createElement(topic.icon, { className: 'h-6 w-6 mr-2 text-slate-600' })}
                {topic.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
            </div>

            <div className="space-y-5">
              {topic.sections.map((section, idx) => (
                <div key={idx} className="border-l-4 border-slate-200 pl-4">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                    <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
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
            {selectedTopic + 1} de {CONFIGURATION_HELP_TOPICS.length} temas
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
            {selectedTopic < CONFIGURATION_HELP_TOPICS.length - 1 ? (
              <button
                onClick={() => setSelectedTopic(prev => prev + 1)}
                className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center"
              >
                Siguiente
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
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
// TIPOS E INTERFACES
// =============================================================================

interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  code: string;
  message: string;
  error?: string;
}

interface ProcessType {
  id: number;
  publicId: string;
  name: string;
  description: string;
  type: 1 | 2; // 1 = Import, 2 = Export
  config: {
    config: {
      fileType: string;
      sheetName?: string;
      delimiter?: string;
      maxRowsPerBlock?: number;
      validations?: Record<string, ValidationConfig>;
      columns?: Record<string, ColumnConfig>;
      entityType?: string;
    };
    externalApi?: {
      url: string;
      method: string;
      headers?: Record<string, string>;
    };
    callBackUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ValidationConfig {
  jsonName: string;
  required: boolean;
  format?: string;
  nameChange?: string;
}

interface ColumnConfig {
  columnName: string;
  required: boolean;
  format?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRecords: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProcessTypeListResponse {
  processTypes: ProcessType[];
  total: number;
  pagination?: PaginationInfo;
}

// Tipo para el formulario interno (más simple)
interface FormColumn {
  key: string;
  jsonName?: string;
  columnName?: string;
  nameChange?: string; // Nombre alternativo para el campo en el resultado
  required: boolean;
  format?: string;
}

interface FormData {
  name: string;
  description: string;
  type: 1 | 2;
  fileType: string;
  sheetName: string;
  maxRowsPerBlock: number;
  entityType: string;
  externalApiUrl: string;
  externalApiMethod: string;
}

// =============================================================================
// SERVICIO DE API - INTEGRACIÓN CON KBATCH
// =============================================================================

const createProcessTypeService = (API_BASE_URL: string) => ({
  /**
   * Obtener todos los ProcessTypes con paginación y filtros
   * GET /process-type?page=1&limit=10&type=1
   */
  async getAll(params?: { page?: number; limit?: number; type?: number }): Promise<ProcessTypeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type.toString());

    const url = `${API_BASE_URL}/process-type${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result: ApiResponse<ProcessTypeListResponse> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Error al obtener configuraciones');
    }

    return result.data;
  },

  /**
   * Obtener un ProcessType por su publicId
   * GET /process-type/:publicId
   */
  async getById(publicId: string): Promise<ProcessType> {
    const response = await fetch(`${API_BASE_URL}/process-type/${publicId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const result: ApiResponse<ProcessType> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Configuración no encontrada');
    }

    return result.data;
  },

  /**
   * Crear un nuevo ProcessType
   * POST /process-type
   */
  async create(data: CreateProcessTypeRequest): Promise<ProcessType> {
    const response = await fetch(`${API_BASE_URL}/process-type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<ProcessType> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Error al crear configuración');
    }

    return result.data;
  },

  /**
   * Actualizar un ProcessType existente
   * PUT /process-type/:publicId
   */
  async update(publicId: string, data: Partial<CreateProcessTypeRequest>): Promise<ProcessType> {
    const response = await fetch(`${API_BASE_URL}/process-type/${publicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result: ApiResponse<ProcessType> = await response.json();
    
    if (!result.isSuccess) {
      throw new Error(result.error || result.message || 'Error al actualizar configuración');
    }

    return result.data;
  },

  /**
   * Eliminar un ProcessType
   * DELETE /process-type/:publicId
   */
  async delete(publicId: string): Promise<void> {
    const url = `${API_BASE_URL}/process-type/${publicId}`;
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      // Manejar respuesta 204 No Content (sin body)
      if (response.status === 204) {
        return;
      }

      // Manejar respuesta 200 OK con body JSON
      if (response.ok) {
        try {
          const result = await response.json();
          
          // Si la API devuelve isSuccess, verificarlo
          if (result.isSuccess === false) {
            throw new Error(result.error || result.message || 'Error al eliminar configuración');
          }
          return;
        } catch {
          // Si no hay JSON válido pero el status es OK, considerarlo exitoso
          return;
        }
      }

      // Manejar errores HTTP
      let errorMessage = `Error HTTP ${response.status}`;
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorResult.message || errorMessage;
      } catch {
        // No hay JSON en el error
      }
      
      throw new Error(errorMessage);
      
    } catch (fetchError) {
      // Error de red o CORS
      
      if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
        throw new Error(
          'No se pudo conectar con el servidor. Esto puede deberse a un problema de CORS o de red. ' +
          'Verifica que el servidor permita solicitudes DELETE desde este origen.'
        );
      }
      
      throw fetchError;
    }
  }
});

// Tipo para crear/actualizar ProcessType (estructura que espera la API)
// ESTRUCTURA CORRECTA:
// {
//   name, description, type,
//   config: {
//     config: { fileType, validations, maxRowsPerBlock, ... },
//     externalApi: { url, method },
//     callBackUrl: "..."
//   }
// }
interface CreateProcessTypeRequest {
  name: string;
  description: string;
  type: 1 | 2;
  config: {
    // Config interno
    config: {
      fileType: string;
      sheetName?: string;
      delimiter?: string;
      maxRowsPerBlock?: number;
      validations?: Record<string, ValidationConfig>;
      columns?: Record<string, ColumnConfig>;
      entityType?: string;
    };
    // externalApi y callBackUrl van aquí, DENTRO de config pero FUERA de config.config
    externalApi?: {
      url: string;
      method?: string;
      headers?: Record<string, string>;
    };
    callBackUrl?: string;
  };
}

// =============================================================================
// CONSTANTES Y HELPERS
// =============================================================================

const FORMAT_OPTIONS = [
  { value: '', label: 'Sin validación específica' },
  { value: 'email', label: 'Correo electrónico' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'url', label: 'Enlace web (URL)' },
  { value: 'boolean', label: 'Sí/No' },
  { value: 'dni', label: 'DNI' },
  { value: 'currency', label: 'Moneda' },
  { value: 'percentage', label: 'Porcentaje' },
  { value: 'alphanumeric', label: 'Alfanumérico' },
  { value: 'uuid', label: 'Identificador único' },
  { value: 'time', label: 'Hora' },
  { value: 'datetime', label: 'Fecha y hora' },
  { value: 'ip', label: 'Dirección IP' },
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'iban', label: 'Cuenta bancaria' },
];

/** Se construye dinámicamente con el apiBaseUrl del ambiente activo */
const buildCallbackUrl = (apiBaseUrl: string) => `${apiBaseUrl}/file/worker/status`;

// =============================================================================
// HELPER: Acceso seguro a config (la API puede tener config anidado o no)
// =============================================================================

/**
 * Obtiene la configuración interna de un ProcessType de forma segura
 * La API puede devolver: config.config.fileType o config.fileType
 */
const getInnerConfig = (item: ProcessType | null | undefined) => {
  if (!item || !item.config) {
    return {
      fileType: 'XLSX',
      sheetName: 'Sheet1',
      delimiter: ',',
      maxRowsPerBlock: 500,
      validations: {},
      columns: {},
      entityType: ''
    };
  }
  
  // La API devuelve config.config anidado
  if (item.config.config) {
    return item.config.config;
  }
  
  // Fallback: config directo (por si acaso)
  return item.config as any;
};

/**
 * Obtiene externalApi de forma segura
 * Busca en múltiples ubicaciones posibles según la estructura de la API
 */
const getExternalApi = (item: ProcessType | null | undefined) => {
  const defaultApi = { url: '', method: 'POST', headers: {} as Record<string, string> };
  
  if (!item || !item.config) {
    return defaultApi;
  }
  
  // Buscar en config.externalApi (ubicación principal según documentación)
  if (item.config.externalApi?.url) {
    return item.config.externalApi;
  }
  
  // Buscar en config.config.externalApi (ubicación alternativa)
  const innerConfig = item.config.config as Record<string, unknown> | undefined;
  if (innerConfig?.externalApi) {
    return innerConfig.externalApi as { url: string; method?: string; headers?: Record<string, string> };
  }
  
  // Buscar directamente en el item (por si viene parseado diferente)
  const itemAny = item as unknown as Record<string, unknown>;
  if (itemAny.externalApi) {
    return itemAny.externalApi as { url: string; method?: string; headers?: Record<string, string> };
  }
  
  return defaultApi;
};

/**
 * Obtiene callBackUrl de forma segura
 * Busca en múltiples ubicaciones posibles
 */
const getCallBackUrl = (item: ProcessType | null | undefined): string => {
  if (!item || !item.config) {
    return '';
  }
  
  // Buscar en config.callBackUrl (ubicación principal)
  if (item.config.callBackUrl) {
    return item.config.callBackUrl;
  }
  
  // Buscar en config.config.callBackUrl (ubicación alternativa)
  const innerConfig = item.config.config as Record<string, unknown> | undefined;
  if (innerConfig?.callBackUrl) {
    return innerConfig.callBackUrl as string;
  }
  
  // Buscar directamente en el item
  const itemAny = item as unknown as Record<string, unknown>;
  if (itemAny.callBackUrl) {
    return itemAny.callBackUrl as string;
  }
  
  return '';
};

/**
 * Obtiene el número de columnas de forma segura
 */
const getColumnsCount = (item: ProcessType | null | undefined): number => {
  if (!item) return 0;
  const innerConfig = getInnerConfig(item);
  
  if (item.type === 1) {
    return Object.keys(innerConfig.validations || {}).length;
  }
  return Object.keys(innerConfig.columns || {}).length;
};

const FormatBadge = ({ format }: { format?: string }) => {
  const label = FORMAT_OPTIONS.find(f => f.value === format)?.label || format || 'Texto';
  return (
    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200">
      {label}
    </span>
  );
};

// =============================================================================
// COMPONENTE: Toast de Notificaciones
// =============================================================================

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
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
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${colors[type]} animate-in slide-in-from-right duration-300`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Lista de ProcessTypes
// =============================================================================

interface ProcessTypeListProps {
  onRefresh: () => void;
  onCreate: () => void;
  onView: (item: ProcessType) => void;
  onEdit: (item: ProcessType) => void;
  onDelete: (item: ProcessType) => void;
  onHelp: () => void;
  // Estado persistente (manejado por el padre para sobrevivir navegación)
  filterType: number | 'all';
  onFilterTypeChange: (value: number | 'all') => void;
  search: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const ProcessTypeList: React.FC<ProcessTypeListProps> = ({ 
  onRefresh, onCreate, onView, onEdit, onDelete, onHelp,
  filterType, onFilterTypeChange, search, onSearchChange, currentPage, onPageChange
}) => {
  const apiBaseUrl = useApiBaseUrl();
  const processTypeService = useMemo(() => createProcessTypeService(apiBaseUrl), [apiBaseUrl]);
  const [data, setData] = useState<ProcessType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Cargar datos desde la API
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { page?: number; limit?: number; type?: number } = {
        page: currentPage,
        limit: 10
      };
      
      if (filterType !== 'all') {
        params.type = filterType;
      }

      const result = await processTypeService.getAll(params);
      setData(result.processTypes);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar configuraciones');
      } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, processTypeService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrado local por búsqueda (el filtro por tipo ya va a la API)
  const filtered = data.filter((item) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Manejar cambio de filtro de tipo
  const handleFilterTypeChange = (value: string) => {
    onFilterTypeChange(value === 'all' ? 'all' : Number(value));
    onPageChange(1); // Reset a página 1 al cambiar filtro
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Cargando configuraciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-red-200">
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Configuraciones de Proceso</h2>
          <p className="text-sm text-slate-500">
            Gestiona cómo el sistema procesa archivos de importación y exportación.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onHelp}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Ver ayuda sobre esta sección"
          >
            <HelpCircle className="h-5 w-5 text-slate-500" />
          </button>
          <button 
            onClick={fetchData}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            title="Actualizar lista"
          >
            <RefreshCw className="h-5 w-5 text-slate-600" />
          </button>
          <button 
            onClick={onCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Configuración
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filtro de tipo con botones */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => handleFilterTypeChange('all')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                filterType === 'all' 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleFilterTypeChange('1')}
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 border-l border-slate-200 ${
                filterType === 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
            <button
              onClick={() => handleFilterTypeChange('2')}
              className={`px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 border-l border-slate-200 ${
                filterType === 2 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        {pagination && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              Mostrando {filtered.length} de {pagination.totalRecords} configuraciones
            </span>
            <div className="flex items-center gap-3">
              {/* Badge Import con tooltip */}
              <div className="relative group">
                <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium cursor-help">
                  <Upload className="h-3 w-3" />
                  {data.filter(d => d.type === 1).length} Import
                </span>
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="font-bold text-blue-300 mb-1">📥 Procesos de Importación</div>
                  <p className="text-slate-300">Reciben archivos, validan datos y los envían a APIs externas.</p>
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
              {/* Badge Export con tooltip */}
              <div className="relative group">
                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium cursor-help">
                  <Download className="h-3 w-3" />
                  {data.filter(d => d.type === 2).length} Export
                </span>
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="font-bold text-green-300 mb-1">📤 Procesos de Exportación</div>
                  <p className="text-slate-300">Generan archivos descargables a partir de datos del sistema.</p>
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filtered.map((item) => (
          <div 
            key={item.publicId} 
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border hover:shadow-md transition-shadow ${
              item.type === 1 
                ? 'border-l-blue-500 border-slate-200' 
                : 'border-l-green-500 border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`p-3 rounded-lg h-fit ${
                  item.type === 1 ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                }`}>
                  {item.type === 1 ? <Upload className="h-6 w-6" /> : <Download className="h-6 w-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                    {/* Badge de tipo Import/Export */}
                    <div className="relative group inline-block">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide cursor-help ${
                        item.type === 1 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {item.type === 1 ? '↑ Import' : '↓ Export'}
                      </span>
                      {/* Tooltip */}
                      <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {item.type === 1 ? (
                          <>
                            <div className="font-bold text-blue-300 mb-1 flex items-center">
                              <Upload className="h-3 w-3 mr-1" /> Proceso de Importación
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                              Sube archivos (Excel, CSV, TXT) al sistema. KBatch valida cada fila según las columnas configuradas y envía los datos a la API externa definida.
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-600 text-slate-400">
                              📁 Usuario sube archivo → ✅ Validación → 🚀 API Externa
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-green-300 mb-1 flex items-center">
                              <Download className="h-3 w-3 mr-1" /> Proceso de Exportación
                            </div>
                            <p className="text-slate-300 leading-relaxed">
                              Genera archivos (Excel, CSV, TXT) a partir de datos. Define las columnas de salida y el formato del archivo que se descargará.
                            </p>
                            <div className="mt-2 pt-2 border-t border-slate-600 text-slate-400">
                              📊 Datos → 🔧 Formateo → 📥 Archivo descargable
                            </div>
                          </>
                        )}
                        {/* Flecha del tooltip */}
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-3 max-w-2xl">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 items-center">
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono text-slate-600">
                      {getInnerConfig(item).fileType || 'N/A'}
                    </span>
                    {item.type === 1 && getInnerConfig(item).maxRowsPerBlock && (
                      <span className="flex items-center">
                        <Settings className="h-3 w-3 mr-1" />
                        {getInnerConfig(item).maxRowsPerBlock} registros/lote
                      </span>
                    )}
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>
                      {getColumnsCount(item)} columnas
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>Creado: {new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onView(item)} 
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                  title="Ver detalle"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onEdit(item)} 
                  className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" 
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDelete(item)} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
            <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <LayoutList className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-slate-800 font-medium mb-1">No se encontraron configuraciones</h3>
            <p className="text-slate-500 text-sm mb-4">
              {search ? 'Intenta ajustar los filtros o' : 'Aún no hay configuraciones.'} 
              {' '}Crea una nueva para comenzar.
            </p>
            <button 
              onClick={onCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Nueva Configuración
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 bg-white p-4 rounded-lg border border-slate-200">
          {/* Ir a primera página */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 border border-slate-300 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            title="Ir a página 1"
          >
            « Primera
          </button>
          {/* Página anterior */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            ‹ Anterior
          </button>
          {/* Indicador de página */}
          <div className="flex items-center gap-2 px-4">
            <span className="text-sm text-slate-500">Página</span>
            <span className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-sm min-w-[40px] text-center">
              {currentPage}
            </span>
            <span className="text-sm text-slate-500">de {pagination.totalPages}</span>
          </div>
          {/* Página siguiente */}
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage >= pagination.totalPages}
            className="px-4 py-2 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Siguiente ›
          </button>
          {/* Ir a última página */}
          <button
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={currentPage >= pagination.totalPages}
            className="px-3 py-2 border border-slate-300 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            title={`Ir a página ${pagination.totalPages}`}
          >
            Última »
          </button>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE: Detalle de ProcessType
// =============================================================================

interface ProcessTypeDetailProps {
  publicId: string;
  onBack: () => void;
  onEdit: (item: ProcessType) => void;
}

const ProcessTypeDetail: React.FC<ProcessTypeDetailProps> = ({ publicId, onBack, onEdit }) => {
  const apiBaseUrl = useApiBaseUrl();
  const processTypeService = useMemo(() => createProcessTypeService(apiBaseUrl), [apiBaseUrl]);
  const [data, setData] = useState<ProcessType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await processTypeService.getById(publicId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [publicId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Cargando detalle...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-red-200">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <h3 className="text-red-800 font-medium mb-1">Error al cargar</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button onClick={onBack} className="text-blue-600 hover:underline text-sm">
          Volver a la lista
        </button>
      </div>
    );
  }

  const innerConfig = getInnerConfig(data);
  const columns = data.type === 1 ? innerConfig.validations : innerConfig.columns;
  const colKeys = Object.keys(columns || {});

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack} 
        className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver a la lista
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-start">
          <div className="flex gap-4">
            <div className={`p-3 rounded-lg h-fit ${
              data.type === 1 ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
            }`}>
              {data.type === 1 ? <Upload className="h-6 w-6" /> : <Download className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{data.name}</h2>
              <p className="text-slate-500 mt-1">{data.description}</p>
            </div>
          </div>
          <button 
            onClick={() => onEdit(data)} 
            className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" /> Editar
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información General */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <Settings className="h-4 w-4 mr-2 text-slate-400" /> Información General
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Tipo</span>
                <div className="relative group inline-block">
                  <span className={`font-bold px-2 py-0.5 rounded cursor-help ${
                    data.type === 1 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {data.type === 1 ? '↑ Importación' : '↓ Exportación'}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {data.type === 1 ? (
                      <>
                        <div className="font-bold text-blue-300 mb-1">📥 Importación de Datos</div>
                        <p className="text-slate-300 leading-relaxed">
                          Este proceso recibe archivos del usuario, valida cada fila según las columnas definidas, y envía los datos validados a la API externa configurada.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-green-300 mb-1">📤 Exportación de Datos</div>
                        <p className="text-slate-300 leading-relaxed">
                          Este proceso genera archivos descargables a partir de datos. Las columnas definidas determinan la estructura del archivo de salida.
                        </p>
                      </>
                    )}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Formato de archivo</span>
                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded uppercase font-bold text-slate-700">
                  {innerConfig.fileType || 'N/A'}
                </span>
              </div>
              {innerConfig.sheetName && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nombre de hoja (Excel)</span>
                  <span className="font-medium text-slate-800">{innerConfig.sheetName}</span>
                </div>
              )}
              {data.type === 1 && innerConfig.maxRowsPerBlock && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Registros por lote</span>
                  <span className="font-bold text-slate-800">{innerConfig.maxRowsPerBlock.toLocaleString()}</span>
                </div>
              )}
              {innerConfig.delimiter && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Delimitador</span>
                  <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                    {innerConfig.delimiter === ',' ? 'Coma (,)' : 
                     innerConfig.delimiter === ';' ? 'Punto y coma (;)' : 
                     innerConfig.delimiter === '\t' ? 'Tabulador (\\t)' : innerConfig.delimiter}
                  </span>
                </div>
              )}
              {data.type === 2 && innerConfig.entityType && (
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Tipo de entidad</span>
                  <span className="font-medium text-slate-800">{innerConfig.entityType}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Código único (publicId)</span>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded select-all">
                  {data.publicId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Fecha de creación</span>
                <span className="font-medium text-slate-800">
                  {new Date(data.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Última modificación</span>
                <span className="font-medium text-slate-800">
                  {new Date(data.updatedAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          </div>

          {/* Columnas Definidas */}
          <div>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <LayoutList className="h-4 w-4 mr-2 text-slate-400" /> 
              Columnas Definidas ({colKeys.length})
            </h3>
            <div className="bg-slate-50 rounded border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Columna</th>
                    <th className="px-4 py-2 text-center">Obligatoria</th>
                    <th className="px-4 py-2">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {colKeys.map((key) => {
                    const col = columns![key];
                    return (
                      <tr key={key}>
                        <td className="px-4 py-2 font-medium">{key}</td>
                        <td className="px-4 py-2 text-center">
                          {col.required 
                            ? <Check className="h-4 w-4 text-green-500 mx-auto" /> 
                            : <span className="text-slate-300">-</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          <FormatBadge format={col.format} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sistema Destino y Callback (solo para Import) */}
        {data.type === 1 && (
          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-6">
            {/* API Externa */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Globe className="h-4 w-4 mr-2 text-blue-500" /> API Externa (Sistema Destino)
              </h3>
              {getExternalApi(data).url ? (
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="md:col-span-2">
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">URL del Endpoint</span>
                      <div className="bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-xs text-slate-700 select-all break-all">
                        {getExternalApi(data).url}
                      </div>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Método HTTP</span>
                      <span className="inline-block bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded text-sm">
                        {getExternalApi(data).method || 'POST'}
                      </span>
                    </div>
                  </div>
                  {/* Headers si existen */}
                  {getExternalApi(data).headers && Object.keys(getExternalApi(data).headers || {}).length > 0 && (
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-2">Headers</span>
                      <div className="bg-slate-50 border border-slate-300 rounded p-3 font-mono text-xs">
                        {Object.entries(getExternalApi(data).headers || {}).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-purple-600">{key}:</span>
                            <span className="text-slate-600">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  No se ha configurado una API externa para este proceso
                </div>
              )}
            </div>

            {/* Callback URL */}
            <div>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2 text-green-500" /> Callback URL
              </h3>
              {getCallBackUrl(data) ? (
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">URL de Callback (Status Updates)</span>
                  <div className="bg-green-50 border border-green-200 rounded px-3 py-2 font-mono text-xs text-green-700 select-all break-all">
                    {getCallBackUrl(data)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Esta URL recibe actualizaciones de estado cuando la API externa procesa cada bloque de datos.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm text-slate-500">
                  No se ha configurado una URL de callback
                </div>
              )}
            </div>

            {/* Ver estructura completa del config en JSON */}
            <div className="mt-4">
              <details className="bg-slate-800 rounded-lg overflow-hidden">
                <summary className="px-4 py-2 text-white text-sm font-medium cursor-pointer hover:bg-slate-700">
                  🔍 Ver estructura completa en formato JSON
                </summary>
                <pre className="p-4 text-xs text-green-400 overflow-auto max-h-64">
                  {JSON.stringify(data.config, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENTE: Wizard de Creación/Edición
// =============================================================================

interface ProcessTypeWizardProps {
  initialData: ProcessType | null;
  onCancel: () => void;
  onSave: (data: ProcessType) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// =============================================================================
// HELPER: Parsear errores de la API para mostrarlos de forma amigable
// =============================================================================

const parseApiError = (error: string): { title: string; detail: string; field?: string } => {
  if (error.includes('nombre') || error.includes('name')) {
    if (error.includes('Ya existe')) return { title: 'Nombre duplicado', detail: error, field: 'name' };
    return { title: 'Error en el nombre', detail: error, field: 'name' };
  }
  if (error.includes('description')) return { title: 'Error en la descripción', detail: error, field: 'description' };
  if (error.includes('type solo puede ser')) return { title: 'Tipo inválido', detail: error, field: 'type' };
  if (error.includes('callBackUrl')) return { title: 'Falta URL de callback', detail: error, field: 'callBackUrl' };
  if (error.includes('externalApi.url')) return { title: 'Falta URL del sistema destino', detail: error, field: 'externalApi' };
  if (error.includes('externalApi') && !error.includes('url')) return { title: 'Error en API externa', detail: error, field: 'externalApi' };
  if (error.includes('fileType')) return { title: 'Formato de archivo inválido', detail: error, field: 'fileType' };
  if (error.includes('validations')) {
    if (error.includes('Estructura inválida')) return { title: 'Estructura incorrecta', detail: error, field: 'structure' };
    return { title: 'Error en validaciones', detail: error, field: 'validations' };
  }
  if (error.includes('columns')) {
    if (error.includes('Estructura inválida')) return { title: 'Estructura incorrecta', detail: error, field: 'structure' };
    return { title: 'Error en columnas', detail: error, field: 'columns' };
  }
  if (error.includes('jsonName')) return { title: 'Error en campo de validación', detail: error, field: 'validations' };
  if (error.includes('required') && error.includes('boolean')) return { title: 'Error en campo obligatorio', detail: error, field: 'validations' };
  if (error.includes('maxRowsPerBlock')) return { title: 'Registros por lote inválido', detail: error, field: 'maxRowsPerBlock' };
  if (error.includes('Ya existe')) return { title: 'Conflicto', detail: error, field: 'name' };
  return { title: 'Error de validación', detail: error };
};

// Ejemplo de JSON para Import
const IMPORT_JSON_EXAMPLE = `{
  "config": {
    "fileType": "XLSX",
    "sheetName": "Sheet1",
    "validations": {
      "MONTO": { "jsonName": "monto", "required": true },
      "NOMBRE": { "jsonName": "nombre", "required": true },
      "EMAIL": { "jsonName": "email", "required": false }
    },
    "maxRowsPerBlock": 500
  },
  "callBackUrl": "{{se genera automáticamente}}",
  "externalApi": {
    "url": "https://api.destino.com/endpoint",
    "method": "POST"
  }
}`;

// Ejemplo de JSON para Export
const EXPORT_JSON_EXAMPLE = `{
  "config": {
    "fileType": "XLSX",
    "entityType": "KCMS",
    "columns": {
      "payment_id": { "required": true, "columnName": "ID PAGO" },
      "amount": { "required": true, "columnName": "MONTO" },
      "status": { "required": false, "columnName": "ESTADO" }
    }
  }
}`;

const ProcessTypeWizard: React.FC<ProcessTypeWizardProps> = ({ 
  initialData, onCancel, onSave, showToast 
}) => {
  const apiBaseUrl = useApiBaseUrl();
  const processTypeService = useMemo(() => createProcessTypeService(apiBaseUrl), [apiBaseUrl]);
  const DEFAULT_CALLBACK_URL = useMemo(() => buildCallbackUrl(apiBaseUrl), [apiBaseUrl]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Estados para modales explicativos
  const [showImportExplainer, setShowImportExplainer] = useState(false);
  const [showExportExplainer, setShowExportExplainer] = useState(false);
  const [showCreationModeHelp, setShowCreationModeHelp] = useState(false);

  // JSON mode state
  const [creationMode, setCreationMode] = useState<'wizard' | 'json'>('wizard');
  const [jsonType, setJsonType] = useState<1 | 2>(1);
  const [jsonName, setJsonName] = useState('');
  const [jsonDescription, setJsonDescription] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonErrors, setJsonErrors] = useState<Array<{ title: string; detail: string; field?: string }>>([]);
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      const innerConfig = getInnerConfig(initialData);
      const extApi = getExternalApi(initialData);
      return {
        name: initialData.name,
        description: initialData.description || '',
        type: initialData.type,
        fileType: innerConfig.fileType || 'XLSX',
        sheetName: innerConfig.sheetName || 'Sheet1',
        maxRowsPerBlock: innerConfig.maxRowsPerBlock || 500,
        entityType: innerConfig.entityType || '',
        externalApiUrl: extApi.url || '',
        externalApiMethod: extApi.method || 'POST'
      };
    }
    return {
      name: '',
      description: '',
      type: 1,
      fileType: 'XLSX',
      sheetName: 'Sheet1',
      maxRowsPerBlock: 500,
      entityType: '',
      externalApiUrl: '',
      externalApiMethod: 'POST'
    };
  });

  const [columnsList, setColumnsList] = useState<FormColumn[]>(() => {
    if (!initialData) return [];
    
    const innerConfig = getInnerConfig(initialData);
    const source = initialData.type === 1 
      ? innerConfig.validations 
      : innerConfig.columns;
    
    if (!source) return [];
    
    return Object.keys(source).map(key => ({
      key,
      jsonName: (source[key] as any).jsonName || '',
      columnName: (source[key] as any).columnName || '',
      nameChange: (source[key] as any).nameChange || '',
      required: source[key]?.required ?? true,
      format: source[key]?.format || ''
    }));
  });

  const isImport = formData.type === 1;
  const isEditing = !!initialData;
  const totalSteps = isImport ? 4 : 3;
  const isJsonMode = creationMode === 'json' && !isEditing;

  const handleBasicChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addColumn = () => {
    setColumnsList([...columnsList, { 
      key: '', 
      jsonName: '', 
      columnName: '', 
      nameChange: '',
      required: true, 
      format: '' 
    }]);
  };

  const removeColumn = (index: number) => {
    setColumnsList(columnsList.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof FormColumn, value: any) => {
    const updated = [...columnsList];
    updated[index] = { ...updated[index], [field]: value };
    
    // Para IMPORT: cuando el usuario escribe jsonName, auto-generar key en MAYÚSCULA
    if (field === 'jsonName' && isImport) {
      // La key (propiedad del objeto validations) se genera automáticamente en MAYÚSCULA
      updated[index].key = value.toUpperCase().replace(/\s+/g, '_');
    }
    
    setColumnsList(updated);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      return !!(formData.name && formData.fileType);
    }
    if (step === 2) {
      return columnsList.length > 0 && columnsList.every(c => c.key.trim() !== '');
    }
    if (step === 3 && isImport) {
      return !!formData.externalApiUrl;
    }
    return true;
  };

  // JSON mode: validate and submit
  const handleJsonSave = async () => {
    setJsonErrors([]);
    setJsonParseError(null);

    if (!jsonName.trim()) {
      setJsonErrors([{ title: 'Nombre requerido', detail: 'Debes ingresar un nombre para la configuración.', field: 'name' }]);
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'JSON inválido';
      setJsonParseError(`Error de sintaxis JSON: ${msg}`);
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setJsonParseError('El JSON debe ser un objeto (no un array ni un valor primitivo).');
      return;
    }

    // Auto-inject callBackUrl for Import if not provided or placeholder
    if (jsonType === 1) {
      const cbUrl = parsed.callBackUrl;
      if (!cbUrl || typeof cbUrl !== 'string' || cbUrl.includes('{{')) {
        parsed.callBackUrl = DEFAULT_CALLBACK_URL;
      }
    }

    // Build the request payload
    // The API expects config, callBackUrl, externalApi at TOP level (same as name/type)
    const requestData: Record<string, unknown> = {
      name: jsonName.trim(),
      description: jsonDescription.trim(),
      type: jsonType,
      ...parsed
    };

    setSaving(true);
    try {
      const result = await processTypeService.create(requestData as unknown as CreateProcessTypeRequest);
      showToast('¡Configuración creada desde JSON! Ya puedes usarla.', 'success');
      onSave(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      const parsedError = parseApiError(message);
      setJsonErrors([parsedError]);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Construir el objeto de configuración según el tipo
      const configObj: Record<string, any> = {};
      
      columnsList.forEach(col => {
        if (isImport) {
          // Para IMPORT: key es MAYÚSCULA (auto-generada), jsonName es lo que escribió el usuario
          const columnKey = col.key || (col.jsonName ? col.jsonName.toUpperCase() : '');
          configObj[columnKey] = {
            jsonName: col.jsonName || columnKey.toLowerCase(),
            required: col.required,
            ...(col.format && { format: col.format }),
            // nameChange: si el usuario quiere un nombre diferente en el archivo/resultado
            ...(col.nameChange && { nameChange: col.nameChange })
          };
        } else {
          configObj[col.key] = {
            columnName: col.columnName || col.key,
            required: col.required,
            ...(col.format && { format: col.format })
          };
        }
      });

      // Construir el request según el tipo
      // ESTRUCTURA CORRECTA según documentación API:
      // config: { 
      //   config: { fileType, validations, maxRowsPerBlock, ... },
      //   externalApi: { url, method },
      //   callBackUrl: "..."
      // }
      const requestData: CreateProcessTypeRequest = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        config: {
          // config interno con fileType, validations, etc.
          config: {
            fileType: formData.fileType,
            ...(formData.fileType === 'XLSX' && { sheetName: formData.sheetName }),
            ...(isImport && { 
              maxRowsPerBlock: formData.maxRowsPerBlock,
              validations: configObj 
            }),
            ...(!isImport && { 
              columns: configObj,
              ...(formData.entityType && { entityType: formData.entityType })
            })
          },
          // externalApi y callBackUrl van DENTRO de config, pero FUERA de config.config
          ...(isImport && formData.externalApiUrl && {
            externalApi: {
              url: formData.externalApiUrl,
              method: 'POST'
            }
          }),
          ...(isImport && {
            callBackUrl: DEFAULT_CALLBACK_URL
          })
        }
      };

      let result: ProcessType;

      if (isEditing && initialData) {
        // Actualizar existente
        result = await processTypeService.update(initialData.publicId, requestData);
        showToast('Los cambios se guardaron correctamente.', 'success');
      } else {
        // Crear nuevo
        result = await processTypeService.create(requestData);
        showToast('¡Configuración creada! Ya puedes usarla.', 'success');
      }

      onSave(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderSteps = () => {
    const steps = [
      { n: 1, label: 'Información' },
      { n: 2, label: 'Columnas' },
      ...(isImport ? [{ n: 3, label: 'Destino' }] : []),
      { n: isImport ? 4 : 3, label: 'Revisar' }
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
          {steps.map((s, idx) => {
            const active = step >= idx + 1;
            const current = step === idx + 1;
            return (
              <div key={s.n} className="flex flex-col items-center bg-slate-50 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                } ${current ? 'ring-4 ring-blue-100' : ''}`}>
                  {idx + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  current ? 'text-blue-700' : 'text-slate-500'
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const isLastStep = step === totalSteps;

  // JSON mode render
  if (isJsonMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Code className="h-5 w-5 mr-2 text-purple-600" />
                Crear configuración desde JSON
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Pega el JSON de configuración directamente. Ideal si ya tienes la estructura lista.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreationModeHelp(true)}
                className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                title="¿JSON o Paso a paso?"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCreationMode('wizard')}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Cambiar a paso a paso
              </button>
            </div>
          </div>

          {/* Tipo de proceso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div
              className={`relative cursor-pointer p-3 rounded-lg border-2 transition-all ${
                jsonType === 1 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div 
                onClick={() => { setJsonType(1); setJsonText(''); setJsonErrors([]); setJsonParseError(null); }}
                className="flex items-center text-blue-600 pr-8"
              >
                <Upload className="h-4 w-4 mr-2" />
                <span className="font-bold text-sm">Import (type=1)</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowImportExplainer(true); }}
                className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                title="¿Qué es un proceso de Importación?"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div
              className={`relative cursor-pointer p-3 rounded-lg border-2 transition-all ${
                jsonType === 2 ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-green-300'
              }`}
            >
              <div 
                onClick={() => { setJsonType(2); setJsonText(''); setJsonErrors([]); setJsonParseError(null); }}
                className="flex items-center text-green-600 pr-8"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="font-bold text-sm">Export (type=2)</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowExportExplainer(true); }}
                className="absolute top-2 right-2 p-1 text-green-400 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                title="¿Qué es un proceso de Exportación?"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la configuración *</label>
              <input
                type="text"
                value={jsonName}
                onChange={(e) => { setJsonName(e.target.value); setJsonErrors([]); }}
                className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-900 placeholder-slate-400 ${
                  jsonErrors.some(e => e.field === 'name') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Ej: Import Debtors XLSX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={jsonDescription}
                onChange={(e) => setJsonDescription(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-purple-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="¿Para qué sirve este proceso?"
              />
            </div>
          </div>

          {/* JSON Editor */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                JSON de configuración *
              </label>
              <button
                onClick={() => {
                  setJsonText(jsonType === 1 ? IMPORT_JSON_EXAMPLE : EXPORT_JSON_EXAMPLE);
                  setJsonParseError(null);
                  setJsonErrors([]);
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
              >
                <Code className="h-3 w-3" />
                Cargar ejemplo {jsonType === 1 ? 'Import' : 'Export'}
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => { setJsonText(e.target.value); setJsonParseError(null); setJsonErrors([]); }}
              className={`w-full px-4 py-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-slate-900 text-green-400 placeholder-slate-500 ${
                jsonParseError ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-300'
              }`}
              rows={16}
              placeholder={`Pega aquí el JSON de configuración para ${jsonType === 1 ? 'Import' : 'Export'}...`}
              spellCheck={false}
            />
            {jsonType === 1 && (
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" />
                El <code className="bg-slate-100 px-1 rounded text-slate-600">callBackUrl</code> se genera automáticamente con el ambiente actual si no lo incluyes.
              </p>
            )}
          </div>

          {/* JSON Parse Error */}
          {jsonParseError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-800 text-sm">JSON inválido</h4>
                  <p className="text-red-600 text-sm mt-1 font-mono">{jsonParseError}</p>
                </div>
              </div>
            </div>
          )}

          {/* API Errors */}
          {jsonErrors.length > 0 && (
            <div className="mb-4 space-y-2">
              {jsonErrors.map((err, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm">{err.title}</h4>
                      <p className="text-red-600 text-sm mt-1">{err.detail}</p>
                      {err.field && (
                        <span className="inline-block mt-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Campo: {err.field}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleJsonSave}
              disabled={saving || !jsonText.trim() || !jsonName.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Crear Configuración
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modales explicativos (modo JSON) */}
        {showImportExplainer && (
          <ImportExplainerModal 
            onClose={() => setShowImportExplainer(false)}
            onSelect={() => { setJsonType(1); setJsonText(''); setJsonErrors([]); setJsonParseError(null); }}
          />
        )}
        {showExportExplainer && (
          <ExportExplainerModal 
            onClose={() => setShowExportExplainer(false)}
            onSelect={() => { setJsonType(2); setJsonText(''); setJsonErrors([]); setJsonParseError(null); }}
          />
        )}
        {showCreationModeHelp && (
          <CreationModeHelpModal onClose={() => setShowCreationModeHelp(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderSteps()}

      <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-200 min-h-[400px]">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Editar información básica' : '¿Qué tipo de proceso deseas crear?'}
              </h3>
              <div className="flex items-center gap-2">
                <ConfigHelpButton onClick={() => setShowHelp(true)} isImport={isImport} />
                {!isEditing && (
                  <button
                    onClick={() => setCreationMode('json')}
                    className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                    title="Crear desde JSON"
                  >
                    <Code className="h-4 w-4" />
                    JSON
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  formData.type === 1 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div onClick={() => handleBasicChange('type', 1)}>
                  <div className="flex items-center mb-2 text-blue-600 pr-8">
                    <Upload className="h-5 w-5 mr-2" />
                    <span className="font-bold">Subir Archivo (Importación)</span>
                  </div>
                  <p className="text-xs text-slate-500 pr-8">
                    Procesa archivos que subes al sistema (Excel, CSV, TXT, JSON).
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowImportExplainer(true); }}
                  className="absolute top-2 right-2 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="¿Qué es un proceso de Importación?"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
               
              <div 
                className={`relative cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  formData.type === 2 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div onClick={() => handleBasicChange('type', 2)}>
                  <div className="flex items-center mb-2 text-green-600 pr-8">
                    <Download className="h-5 w-5 mr-2" />
                    <span className="font-bold">Generar Archivo (Exportación)</span>
                  </div>
                  <p className="text-xs text-slate-500 pr-8">
                    Crea archivos Excel, CSV o TXT desde datos.
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowExportExplainer(true); }}
                  className="absolute top-2 right-2 p-1.5 text-green-400 hover:text-green-600 hover:bg-green-100 rounded-full transition-colors"
                  title="¿Qué es un proceso de Exportación?"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la configuración *
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => handleBasicChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="Ej: Importación de Clientes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea 
                value={formData.description}
                onChange={(e) => handleBasicChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="¿Para qué sirve este proceso?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Formato del archivo *
                </label>
                <select 
                  value={formData.fileType}
                  onChange={(e) => handleBasicChange('fileType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                >
                  <option value="XLSX">Excel (.xlsx)</option>
                  <option value="CSV">CSV</option>
                  <option value="TXT">Texto (.txt)</option>
                  {isImport && <option value="JSON">JSON</option>}
                </select>
              </div>
              
              {/* Nombre de hoja se maneja internamente con valor por defecto "Sheet1" */}
            </div>

            {isImport && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Registros por lote
                </label>
                <input 
                  type="number" 
                  value={formData.maxRowsPerBlock || ''}
                  onChange={(e) => handleBasicChange('maxRowsPerBlock', e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                  onBlur={() => {
                    if (!formData.maxRowsPerBlock || formData.maxRowsPerBlock < 1) {
                      handleBasicChange('maxRowsPerBlock', 500);
                    }
                  }}
                  className="w-32 px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  min={1}
                  max={10000}
                />
                <p className="text-xs text-slate-400 mt-1">Recomendado: 500-1000</p>
              </div>
            )}

            {!isImport && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de entidad (opcional)
                </label>
                <input 
                  type="text" 
                  value={formData.entityType}
                  onChange={(e) => handleBasicChange('entityType', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                  placeholder="Ej: Debtors, Payments, Customers"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Identificador para categorizar las exportaciones
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Columns */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Definir Columnas</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {isImport 
                    ? 'Define las columnas que el usuario debe incluir en su archivo.'
                    : 'Define las columnas que tendrá el archivo generado.'
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ConfigHelpButton onClick={() => setShowHelp(true)} isImport={isImport} />
                <button 
                  onClick={addColumn} 
                  className={`${isImport ? 'text-blue-600 hover:text-blue-800' : 'text-green-600 hover:text-green-800'} text-sm font-medium flex items-center`}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar Columna
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {columnsList.map((col, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-50 p-4 rounded border border-slate-200 relative"
                >
                  <button 
                    onClick={() => removeColumn(idx)} 
                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {/* Para IMPORT: Primero jsonName (nombre del campo) */}
                    {isImport ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Nombre del campo *
                          </label>
                          <input 
                            type="text" 
                            value={col.jsonName}
                            onChange={(e) => updateColumn(idx, 'jsonName', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white text-slate-900 placeholder-slate-400"
                            placeholder="Ej: email, monto, nombre"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            El nombre que identificará este dato
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            Nombre en archivo (opcional)
                          </label>
                          <input 
                            type="text" 
                            value={col.nameChange || ''}
                            onChange={(e) => updateColumn(idx, 'nameChange', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white text-slate-900 placeholder-slate-400"
                            placeholder="Ej: correo_cliente"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Si quieres que aparezca diferente en el resultado
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Para EXPORT: Key del dato y nombre de columna */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                            Nombre del campo *
                          </label>
                          <input 
                            type="text" 
                            value={col.key}
                            onChange={(e) => updateColumn(idx, 'key', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white text-slate-900 placeholder-slate-400"
                            placeholder="Ej: payment_amount"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            El campo en los datos que envías
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                            Nombre en archivo (opcional)
                          </label>
                          <input 
                            type="text" 
                            value={col.columnName}
                            onChange={(e) => updateColumn(idx, 'columnName', e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white text-slate-900 placeholder-slate-400"
                            placeholder="Ej: Monto del Pago"
                          />
                          <p className="text-xs text-slate-400 mt-1">
                            Cómo aparecerá la columna en el archivo generado
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={col.required}
                        onChange={(e) => updateColumn(idx, 'required', e.target.checked)}
                        className="mr-2 rounded"
                      />
                      Obligatoria
                    </label>
                    <select 
                      value={col.format}
                      onChange={(e) => updateColumn(idx, 'format', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm bg-white text-slate-900 flex-1"
                    >
                      {FORMAT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              
              {columnsList.length === 0 && (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded">
                  <LayoutList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay columnas definidas.</p>
                  <button 
                    onClick={addColumn}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Agregar primera columna
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Destination (Import Only) */}
        {step === 3 && isImport && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Configurar Sistema Destino</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Define a dónde se enviarán los datos procesados de cada lote.
                </p>
              </div>
              <ConfigHelpButton onClick={() => setShowHelp(true)} isImport={isImport} />
            </div>
             
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL del sistema destino *
              </label>
              <input 
                type="text" 
                value={formData.externalApiUrl}
                onChange={(e) => handleBasicChange('externalApiUrl', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 placeholder-slate-400"
                placeholder="https://api.destino.com/endpoint"
              />
              <p className="text-xs text-slate-500 mt-1">
                Esta es la dirección del sistema que recibirá los datos procesados.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Método HTTP
              </label>
              {/* Solo POST permitido según documentación de KBatch */}
              <div className="w-48 px-4 py-2 border border-slate-200 rounded bg-slate-50 text-slate-700 font-medium">
                POST
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Los datos procesados se envían mediante POST.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                URL de notificaciones (automático)
              </label>
              <input 
                type="text" 
                disabled
                value={DEFAULT_CALLBACK_URL}
                className="w-full px-4 py-2 border border-slate-200 rounded bg-slate-100 text-slate-500 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                El sistema destino usará esta dirección para informar cuando termine de procesar.
              </p>
            </div>
          </div>
        )}

        {/* Step: Review (last step) */}
        {isLastStep && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-800">Resumen de Configuración</h3>
              <ConfigHelpButton onClick={() => setShowHelp(true)} isImport={isImport} />
            </div>
             
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Nombre</span>
                  <div className="text-slate-800 font-medium">{formData.name}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Tipo</span>
                  <div className="text-slate-800">
                    {isImport ? '📥 Importación' : '📤 Exportación'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Formato</span>
                  <div className="text-slate-800">{formData.fileType}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-bold">Columnas</span>
                  <div className="text-slate-800">{columnsList.length} definidas</div>
                </div>
              </div>

              {/* Tabla de columnas */}
              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold">Columnas configuradas</span>
                <div className="mt-2 bg-white rounded border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-slate-600">Nombre del campo</th>
                        <th className="px-3 py-2 text-left text-slate-600">Nombre en archivo</th>
                        <th className="px-3 py-2 text-center text-slate-600">Obligatoria</th>
                        <th className="px-3 py-2 text-left text-slate-600">Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {columnsList.map((col, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {isImport ? col.jsonName : col.key}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            {isImport 
                              ? (col.nameChange || '-') 
                              : (col.columnName || col.key)
                            }
                          </td>
                          <td className="px-3 py-2 text-center">
                            {col.required ? '✓' : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <FormatBadge format={col.format} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {isImport && formData.externalApiUrl && (
                <div className="pt-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500 uppercase font-bold">Sistema destino</span>
                  <div className="text-slate-800 font-mono text-sm break-all mt-1">
                    POST {formData.externalApiUrl}
                  </div>
                </div>
              )}
            </div>
             
            <div className="flex items-center bg-blue-50 p-4 rounded text-blue-800 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {isEditing 
                ? 'Los cambios se aplicarán a nuevos procesos. Los procesos existentes no se verán afectados.'
                : 'Podrás editar esta configuración en cualquier momento después de guardar.'
              }
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <button 
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
          className="px-6 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-50"
          disabled={saving}
        >
          {step === 1 ? 'Cancelar' : 'Anterior'}
        </button>
         
        {isLastStep ? (
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 shadow-lg shadow-green-200 flex items-center disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Guardar Cambios' : 'Crear Configuración'}
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={() => validateStep() && setStep(step + 1)}
            disabled={!validateStep()}
            className={`px-6 py-2 ${isImport ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'} text-white rounded font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Siguiente
          </button>
        )}
      </div>

      {/* Modal de ayuda contextual */}
      {showHelp && (
        <ConfigHelpModal 
          step={step} 
          onClose={() => setShowHelp(false)} 
          isImport={isImport}
          totalSteps={totalSteps}
        />
      )}

      {/* Modales explicativos de tipo de proceso */}
      {showImportExplainer && (
        <ImportExplainerModal 
          onClose={() => setShowImportExplainer(false)}
          onSelect={() => handleBasicChange('type', 1)}
        />
      )}
      {showExportExplainer && (
        <ExportExplainerModal 
          onClose={() => setShowExportExplainer(false)}
          onSelect={() => handleBasicChange('type', 2)}
        />
      )}
    </div>
  );
};

// =============================================================================
// COMPONENTE: Modal de Confirmación de Eliminación
// =============================================================================

interface DeleteConfirmModalProps {
  item: ProcessType;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
  item, onCancel, onConfirm, loading 
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Eliminar Configuración</h3>
        </div>
        
        <p className="text-slate-600 mb-4">
          ¿Estás seguro de que deseas eliminar esta configuración?
        </p>
        
        <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            {item.type === 1 
              ? <Upload className="h-4 w-4 text-blue-600" /> 
              : <Download className="h-4 w-4 text-green-600" />
            }
            <span className="font-medium text-slate-800">{item.name}</span>
          </div>
        </div>
        
        <p className="text-sm text-slate-500">
          Esta acción no se puede deshacer. Los procesos ya ejecutados no se verán afectados.
        </p>
      </div>
      
      <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
        <button 
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-slate-300 rounded text-slate-600 font-medium hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button 
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Eliminando...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// =============================================================================
// COMPONENTE PRINCIPAL: Configuration
// =============================================================================

type ViewMode = 'LIST' | 'DETAIL' | 'WIZARD';

interface ConfigurationProps {
  initialProcessId?: string | null;
  onClearInitialProcess?: () => void;
  isActive?: boolean;
}

const Configuration: React.FC<ConfigurationProps> = ({ initialProcessId, onClearInitialProcess, isActive }) => {
  const apiBaseUrl = useApiBaseUrl();
  const environmentVersion = useEnvironmentVersion();
  const processTypeService = useMemo(() => createProcessTypeService(apiBaseUrl), [apiBaseUrl]);
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedProcess, setSelectedProcess] = useState<ProcessType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProcessType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Help modal state
  const [showHelp, setShowHelp] = useState(false);

  // Estado persistente de filtros de la lista (sobrevive navegación a detalle/wizard)
  const [listFilterType, setListFilterType] = useState<number | 'all'>('all');
  const [listSearch, setListSearch] = useState('');
  const [listCurrentPage, setListCurrentPage] = useState(1);

  // Efecto para cargar automáticamente el detalle si se pasa un initialProcessId
  useEffect(() => {
    if (initialProcessId) {
      // Crear un objeto ProcessType mínimo para poder ver el detalle
      setSelectedProcess({ publicId: initialProcessId } as ProcessType);
      setViewMode('DETAIL');
      // Limpiar el initialProcessId después de usarlo
      if (onClearInitialProcess) {
        onClearInitialProcess();
      }
    }
  }, [initialProcessId, onClearInitialProcess]);

  // Auto-refresh cuando la sección se vuelve visible al navegar en el sidebar
  const hasBeenActiveRef = useRef(false);
  useEffect(() => {
    if (isActive) {
      if (hasBeenActiveRef.current) {
        // Solo re-fetch en visitas posteriores (no en la primera vez que se monta)
        setRefreshKey(prev => prev + 1);
      }
      hasBeenActiveRef.current = true;
    }
  }, [isActive]);

  // Re-fetch y reset de vista al cambiar de ambiente
  useEffect(() => {
    if (environmentVersion > 0) {
      setViewMode('LIST');
      setSelectedProcess(null);
      setDeleteTarget(null);
      setListFilterType('all');
      setListSearch('');
      setListCurrentPage(1);
      setRefreshKey(prev => prev + 1);
    }
  }, [environmentVersion]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleCreate = () => {
    setSelectedProcess(null);
    setViewMode('WIZARD');
  };

  const handleView = (item: ProcessType) => {
    setSelectedProcess(item);
    setViewMode('DETAIL');
  };

  const handleEdit = (item: ProcessType) => {
    setSelectedProcess(item);
    setViewMode('WIZARD');
  };

  const handleDeleteRequest = (item: ProcessType) => {
    setDeleteTarget(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    setDeleting(true);
    
    try {
      await processTypeService.delete(deleteTarget.publicId);
      showToast('La configuración fue eliminada.', 'success');
      setDeleteTarget(null);
      setRefreshKey(prev => prev + 1); // Trigger list refresh
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar';
      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveComplete = (savedItem: ProcessType) => {
    setViewMode('LIST');
    setSelectedProcess(null);
    setRefreshKey(prev => prev + 1); // Trigger list refresh
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
      {showHelp && <ConfigurationHelpModal onClose={() => setShowHelp(false)} />}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
        />
      )}

      {/* Content */}
      <div className="animate-in fade-in duration-300">
        {viewMode === 'LIST' && (
          <ProcessTypeList 
            key={refreshKey}
            onRefresh={handleRefresh}
            onCreate={handleCreate} 
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onHelp={() => setShowHelp(true)}
            filterType={listFilterType}
            onFilterTypeChange={setListFilterType}
            search={listSearch}
            onSearchChange={setListSearch}
            currentPage={listCurrentPage}
            onPageChange={setListCurrentPage}
          />
        )}
        
        {viewMode === 'DETAIL' && selectedProcess && (
          <ProcessTypeDetail 
            publicId={selectedProcess.publicId}
            onBack={() => setViewMode('LIST')}
            onEdit={handleEdit}
          />
        )}
        
        {viewMode === 'WIZARD' && (
          <ProcessTypeWizard 
            initialData={selectedProcess}
            onCancel={() => setViewMode('LIST')}
            onSave={handleSaveComplete}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
};

export default Configuration;
