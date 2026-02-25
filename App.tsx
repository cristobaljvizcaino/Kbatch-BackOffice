import React, { useState, useCallback, useMemo } from 'react';
import { 
  Cloud, 
  Activity,
  Menu,
  Bell,
  ChevronRight,
  UserCog,
  FileUp,
  FileDown,
  Cog,
  PanelLeftClose,
  PanelLeft,
  X
} from 'lucide-react';
import { View, NavItem, BreadcrumbItem } from './types';
import { EnvironmentProvider } from './components/EnvironmentContext';
import EnvironmentSelector from './components/EnvironmentSelector';
import UserAvatar from './components/UserAvatar';
import Architecture from './components/Architecture';
import Configuration from './components/Configuration';
import UserManagement from './components/UserManagement';
import ImportPortal from './components/ImportPortal';
import ExportPortal from './components/ExportPortal';

const NAV_SECTIONS = {
  OPERATIONS: 'Operaciones',
  SETTINGS: 'Configuración',
  DOCS: 'Documentación',
} as const;

const NAV_ITEMS: NavItem[] = [
  { id: View.USER_MANAGEMENT, label: 'Gestión de Usuarios y Procesos', icon: UserCog, section: NAV_SECTIONS.OPERATIONS },
  { id: View.IMPORT_PORTAL, label: 'Importar Archivos', icon: FileUp, section: NAV_SECTIONS.OPERATIONS },
  { id: View.EXPORT_PORTAL, label: 'Exportar Archivos', icon: FileDown, section: NAV_SECTIONS.OPERATIONS },
  { id: View.CONFIGURATION, label: 'Configuración de Procesos', icon: Cog, section: NAV_SECTIONS.SETTINGS },
  { id: View.ARCHITECTURE, label: 'Arquitectura del Sistema', icon: Cloud, section: NAV_SECTIONS.DOCS },
];

const VIEW_LABELS: Record<View, string> = {
  [View.USER_MANAGEMENT]: 'Gestión de Usuarios y Procesos',
  [View.IMPORT_PORTAL]: 'Importar Archivos',
  [View.EXPORT_PORTAL]: 'Exportar Archivos',
  [View.CONFIGURATION]: 'Configuración de Procesos',
  [View.ARCHITECTURE]: 'Arquitectura del Sistema',
};

const SECTION_LABELS: Record<View, string> = {
  [View.USER_MANAGEMENT]: 'Operaciones',
  [View.IMPORT_PORTAL]: 'Operaciones',
  [View.EXPORT_PORTAL]: 'Operaciones',
  [View.CONFIGURATION]: 'Configuración',
  [View.ARCHITECTURE]: 'Documentación',
};

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [configProcessId, setConfigProcessId] = useState<string | null>(null);

  const handleNavigate = useCallback((view: string | View, processId?: string) => {
    if (typeof view === 'string' && view.startsWith('CONFIGURATION:')) {
      const id = view.split(':')[1];
      setConfigProcessId(id);
      setCurrentView(View.CONFIGURATION);
      return;
    }
    if (processId && (view === 'CONFIGURATION' || view === View.CONFIGURATION)) {
      setConfigProcessId(processId);
      setCurrentView(View.CONFIGURATION);
      return;
    }
    setCurrentView(view as View);
  }, []);

  const clearConfigProcessId = useCallback(() => {
    setConfigProcessId(null);
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  }, []);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
    { label: 'KBATCH' },
    { label: SECTION_LABELS[currentView] },
    { label: VIEW_LABELS[currentView] },
  ], [currentView]);

  const groupedNav: [string, NavItem[]][] = useMemo(() => {
    const groups: Record<string, NavItem[]> = {};
    NAV_ITEMS.forEach((item) => {
      const section = item.section || 'General';
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
    });
    return Object.entries(groups);
  }, []);

  return (
    <EnvironmentProvider>
    <div className="flex h-screen w-full font-body" style={{ background: 'var(--surface-bg)' }}>

      {mobileMenuOpen && (
        <div 
          className="kds-sidebar-overlay visible lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`kds-sidebar ${!sidebarOpen ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="kds-sidebar__logo">
          <div className="kds-sidebar__logo-icon">
            <Activity className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="kds-sidebar__logo-text">
              <div className="kds-sidebar__logo-title">KBATCH</div>
              <div className="kds-sidebar__logo-subtitle">Backoffice Portal</div>
            </div>
          )}
        </div>

        <nav className="kds-sidebar__nav dark-scrollbar">
          {groupedNav.map(([section, items]) => (
            <div key={section}>
              {sidebarOpen && (
                <div className="kds-sidebar__section-label">{section}</div>
              )}
              {!sidebarOpen && <div style={{ height: '16px' }} />}
              {items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`kds-sidebar__nav-item ${isActive ? 'active' : ''}`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon className="kds-sidebar__nav-icon" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="kds-sidebar__footer">
          {sidebarOpen && (
            <div className="px-6 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--color-success)' }} />
              <span className="text-xs" style={{ color: 'var(--color-gray-500)' }}>Sistema en línea</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--color-primary)' }}>v1.1.0.2</span>
            </div>
          )}
          <UserAvatar variant={sidebarOpen ? 'sidebar' : 'collapsed'} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

        {/* TOPBAR */}
        <header className="kds-topbar">
          <div className="kds-topbar__left">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="kds-topbar__toggle lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="kds-topbar__toggle hidden lg:flex"
              title={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
            >
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </button>
          </div>
          <div className="kds-topbar__right">
            <EnvironmentSelector />
            <div className="kds-topbar__divider" />
            <button className="kds-topbar__icon-btn" title="Notificaciones">
              <Bell className="h-[18px] w-[18px]" />
              <span className="badge"></span>
            </button>
          </div>
        </header>

        {/* BREADCRUMB */}
        <div className="kds-breadcrumb">
          <ol className="kds-breadcrumb__list">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <li className="kds-breadcrumb__separator">
                    <ChevronRight className="h-3 w-3" />
                  </li>
                )}
                <li className={`kds-breadcrumb__item ${index === breadcrumbs.length - 1 ? 'current' : ''}`}>
                  {crumb.view ? (
                    <button onClick={() => handleViewChange(crumb.view!)}>
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </li>
              </React.Fragment>
            ))}
          </ol>
        </div>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto relative" style={{ background: 'var(--surface-bg)' }}>
          <ViewWrapper viewId={View.USER_MANAGEMENT} currentView={currentView}>
            <UserManagement isActive={currentView === View.USER_MANAGEMENT} />
          </ViewWrapper>
          <ViewWrapper viewId={View.IMPORT_PORTAL} currentView={currentView}>
            <ImportPortal onNavigate={handleNavigate} isActive={currentView === View.IMPORT_PORTAL} />
          </ViewWrapper>
          <ViewWrapper viewId={View.EXPORT_PORTAL} currentView={currentView}>
            <ExportPortal onNavigate={handleNavigate} isActive={currentView === View.EXPORT_PORTAL} />
          </ViewWrapper>
          <ViewWrapper viewId={View.CONFIGURATION} currentView={currentView}>
            <Configuration 
              initialProcessId={configProcessId} 
              onClearInitialProcess={clearConfigProcessId}
              isActive={currentView === View.CONFIGURATION}
            />
          </ViewWrapper>
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
