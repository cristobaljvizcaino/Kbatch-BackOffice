import React, { useState } from 'react';
import { 
  Cloud, 
  Activity,
  Menu,
  Bell,
  UserCog,
  FileUp,
  FileDown,
  Cog
} from 'lucide-react';
import { View, NavItem } from './types';
import { EnvironmentProvider } from './components/EnvironmentContext';
import EnvironmentSelector from './components/EnvironmentSelector';
import Architecture from './components/Architecture';
import Configuration from './components/Configuration';
import UserManagement from './components/UserManagement';
import ImportPortal from './components/ImportPortal';
import ExportPortal from './components/ExportPortal';

const NAV_ITEMS: NavItem[] = [
  // Módulos Principales
  { id: View.USER_MANAGEMENT, label: 'Gestión de Usuarios y Procesos', icon: UserCog },
  { id: View.IMPORT_PORTAL, label: 'Importar Archivos', icon: FileUp },
  { id: View.EXPORT_PORTAL, label: 'Exportar Archivos', icon: FileDown },
  
  // Configuración
  { id: View.CONFIGURATION, label: 'Configuración de Procesos', icon: Cog },
  
  // Documentación Técnica
  { id: View.ARCHITECTURE, label: 'Arquitectura del Sistema', icon: Cloud },
];

// Componente wrapper que mantiene el componente hijo montado pero oculto cuando no está activo
// Esto preserva el estado del componente al cambiar de vista (evita remontarlo)
interface ViewWrapperProps {
  viewId: View;
  currentView: View;
  children: React.ReactNode;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ viewId, currentView, children }) => (
  <div 
    className="h-full w-full"
    style={{ display: currentView === viewId ? 'block' : 'none' }}
  >
    {children}
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.USER_MANAGEMENT);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Estado para pasar un processId específico a Configuration
  const [configProcessId, setConfigProcessId] = useState<string | null>(null);

  // Función helper para navegación desde componentes hijos
  // Puede recibir un objeto con view y processId para navegar a un proceso específico
  const handleNavigate = (view: string | View, processId?: string) => {
    console.log('handleNavigate called with:', view, processId);
    
    // Si es un string con formato "CONFIGURATION:processId", parsearlo
    if (typeof view === 'string' && view.startsWith('CONFIGURATION:')) {
      const id = view.split(':')[1];
      setConfigProcessId(id);
      setCurrentView(View.CONFIGURATION);
      return;
    }
    
    // Si se pasa processId directamente
    if (processId && (view === 'CONFIGURATION' || view === View.CONFIGURATION)) {
      setConfigProcessId(processId);
      setCurrentView(View.CONFIGURATION);
      return;
    }
    
    setCurrentView(view as View);
  };

  // Limpiar el processId después de que Configuration lo use
  const clearConfigProcessId = () => {
    setConfigProcessId(null);
  };

  return (
    <EnvironmentProvider>
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col bg-[#0f172a] text-slate-300 transition-all duration-300 shadow-xl z-20 flex-shrink-0`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
          <Activity className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-white text-lg tracking-wide">KBATCH</h1>
              <span className="text-xs text-slate-500">v1.1.0.2</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center px-6 py-3 transition-colors duration-200 relative
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500' 
                    : 'hover:bg-slate-800/50 hover:text-white border-r-4 border-transparent'
                  }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-slate-400'} flex-shrink-0`} />
                {sidebarOpen && <span className="ml-3 font-medium text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-slate-700/50 bg-[#0b1120]">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="flex items-center text-xs">
                <span className="w-16 text-slate-500">Sistema:</span>
                <span className="text-green-500 font-bold">EN LÍNEA</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="w-16 text-slate-500">Región:</span>
                <span className="text-blue-400">aws-us-east-1</span>
              </div>
            </div>
          ) : (
             <div className="flex justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-[#1e293b] text-white flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4 text-slate-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
             {/* Selector de Ambiente */}
             <EnvironmentSelector />
             <div className="h-4 w-[1px] bg-slate-600"></div>
             <div className="flex items-center text-slate-400 hover:text-white cursor-pointer">
                <span className="text-xs mr-1">EN</span>
             </div>
             <div className="h-4 w-[1px] bg-slate-600"></div>
             <Bell className="h-4 w-4 text-slate-400 hover:text-white cursor-pointer" />
             <div className="h-8 w-8 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold text-white cursor-pointer">
                A
             </div>
          </div>
        </header>

        {/* Content Body - Todos los componentes permanecen montados para preservar estado */}
        <main className="flex-1 overflow-auto bg-slate-100 relative">
          {/* Gestión de Usuarios */}
          <ViewWrapper viewId={View.USER_MANAGEMENT} currentView={currentView}>
            <UserManagement isActive={currentView === View.USER_MANAGEMENT} />
          </ViewWrapper>

          {/* Portal de Importación */}
          <ViewWrapper viewId={View.IMPORT_PORTAL} currentView={currentView}>
            <ImportPortal onNavigate={handleNavigate} isActive={currentView === View.IMPORT_PORTAL} />
          </ViewWrapper>

          {/* Portal de Exportación */}
          <ViewWrapper viewId={View.EXPORT_PORTAL} currentView={currentView}>
            <ExportPortal onNavigate={handleNavigate} isActive={currentView === View.EXPORT_PORTAL} />
          </ViewWrapper>

          {/* Configuración de Procesos */}
          <ViewWrapper viewId={View.CONFIGURATION} currentView={currentView}>
            <Configuration 
              initialProcessId={configProcessId} 
              onClearInitialProcess={clearConfigProcessId}
              isActive={currentView === View.CONFIGURATION}
            />
          </ViewWrapper>

          {/* Arquitectura del Sistema */}
          <ViewWrapper viewId={View.ARCHITECTURE} currentView={currentView}>
            <Architecture />
          </ViewWrapper>

        </main>
      </div>
    </div>
    </EnvironmentProvider>
  );
};

export default App;
