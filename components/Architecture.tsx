import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Server, 
  Box, 
  Settings, 
  ArrowDown, 
  ArrowRight,
  HardDrive,
  Cpu,
  Layers,
  Globe,
  Table,
  GitBranch,
  FileUp,
  FileDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Send,
  RefreshCw,
  Upload,
  Eye,
  Users,
  FileText,
  Shield,
  Link2,
  ArrowDownRight,
  CircleDot,
  Workflow
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================
type TabId = 'cloud' | 'schema' | 'states' | 'import' | 'export';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.FC<{ className?: string }>;
  color: string;
}

// =============================================================================
// TAB CONFIGURATION
// =============================================================================
const TABS: TabConfig[] = [
  { id: 'cloud', label: 'Infraestructura Cloud', icon: Cloud, color: 'blue' },
  { id: 'schema', label: 'Esquema de Base de Datos', icon: Database, color: 'emerald' },
  { id: 'states', label: 'Estados del Sistema', icon: GitBranch, color: 'purple' },
  { id: 'import', label: 'Flujo Importación', icon: FileUp, color: 'blue' },
  { id: 'export', label: 'Flujo Exportación', icon: FileDown, color: 'green' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const Architecture: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('cloud');

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-6">Arquitectura del Sistema</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-${tab.color}-600 text-white shadow-md`
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              style={isActive ? { backgroundColor: tab.color === 'blue' ? '#2563eb' : tab.color === 'emerald' ? '#059669' : tab.color === 'purple' ? '#9333ea' : tab.color === 'green' ? '#16a34a' : '#2563eb' } : {}}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'cloud' && <CloudTab />}
      {activeTab === 'schema' && <SchemaTab />}
      {activeTab === 'states' && <StatesTab />}
      {activeTab === 'import' && <ImportFlowTab />}
      {activeTab === 'export' && <ExportFlowTab />}
    </div>
  );
};

// =============================================================================
// TAB 1: CLOUD INFRASTRUCTURE (AWS — verified from project source code)
// =============================================================================
const CloudTab: React.FC = () => (
  <>
    {/* AWS Banner */}
    <div className="bg-[#0b1e3b] text-white p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center mb-2">
          <Cloud className="h-5 w-5 mr-2 text-orange-400" />
          <h3 className="font-bold text-lg">Infraestructura Cloud &mdash; AWS</h3>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Infraestructura real del servicio KBATCH desplegado en AWS. Aplicación monolítica Express.js
          contenerizada en Docker y orquestada con Kubernetes (EKS), utilizando S3, SQS, Lambda y RDS MySQL
          como servicios principales.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">Node.js 20.18.0</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">TypeScript 5.8.3</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">Express.js 4.19.2</span>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded">Base: /kmfef-kbatch/v1/</span>
        </div>
      </div>
      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-orange-900/30 to-transparent"></div>
    </div>

    <div className="flex flex-col xl:flex-row gap-8">
      {/* Service Map Visualization */}
      <div className="flex-1 bg-white p-8 rounded-lg shadow-sm border border-slate-200 min-h-[700px] relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(40,minmax(0,1fr))] opacity-[0.03] pointer-events-none">
           {Array.from({ length: 1600 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-slate-900"></div>
           ))}
        </div>

        <h3 className="font-bold text-slate-700 mb-2 relative z-10">Mapa de Servicios &amp; Flujo de Datos</h3>
        <p className="text-xs text-slate-400 mb-8 relative z-10">
          Arquitectura real verificada desde el código fuente (package.json, config/, services/, Dockerfile, k8s.tpl.yaml, bitbucket-pipelines.yml)
        </p>

        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 py-4">
          {/* Row 1: API Entry Point */}
          <div className="flex gap-8 items-center">
            <ServiceBox 
              icon={Server} 
              title="KBATCH API" 
              subtitle="Express.js 4.19 en AWS EKS" 
              desc="Servicio principal REST. 6 controllers, 17 services, 12 repositories. Puerto 80, Docker alpine." 
              color="purple" 
            />
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <ArrowDown className="h-5 w-5" />
            <span className="text-[10px] text-slate-400">interactúa con</span>
            <ArrowDown className="h-5 w-5" />
          </div>

          {/* Row 2: AWS Core Services */}
          <div className="flex gap-6 flex-wrap justify-center">
            <ServiceBox 
              icon={HardDrive} 
              title="AWS S3" 
              subtitle="@aws-sdk/client-s3 v3.682" 
              desc="Almacenamiento de archivos (CSV, XLSX, TXT, JSON). Presigned URLs para upload directo del cliente." 
              color="orange" 
              small 
            />
            <ServiceBox 
              icon={Send} 
              title="AWS SQS" 
              subtitle="@aws-sdk/client-sqs v3.907" 
              desc="Cola de mensajes para procesamiento de bloques. Soporta colas Standard y FIFO." 
              color="blue" 
              small 
            />
            <ServiceBox 
              icon={Zap} 
              title="AWS Lambda" 
              subtitle="kbatch-orchestration-service-caller" 
              desc="Consume mensajes SQS, descarga JSON de S3 y envía bloques a la API externa (sistema de destino definido en el ProcessType) vía POST." 
              color="slate" 
              small 
            />
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <ArrowDown className="h-5 w-5" />
            <span className="text-[10px] text-slate-400">persistencia &amp; callback</span>
            <ArrowDown className="h-5 w-5" />
          </div>

          {/* Row 3: Data & External */}
          <div className="flex gap-8 flex-wrap justify-center">
            <ServiceBox 
              icon={Database} 
              title="AWS RDS MySQL" 
              subtitle="mysql v2.18.1 — Pool: 50 conn" 
              desc="Base de datos KashioBatch_r2. Queries SQL directos sin ORM. InnoDB, charset utf8mb4." 
              color="emerald" 
            />
            <ServiceBox 
              icon={Globe} 
              title="API Externa (sistema de destino definido en el ProcessType)" 
              subtitle="Callback: /file/worker/status/:workerId" 
              desc="Servicio externo que procesa los bloques y notifica resultados vía callback HTTP." 
              color="orange" 
            />
          </div>
        </div>

        {/* Flow Legend */}
        <div className="mt-8 border-t border-slate-100 pt-4 relative z-10">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Flujo de datos</p>
          <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-purple-400 inline-block"></span>
              <span>Import: Client → S3 → API → SQS → Lambda → External → Callback</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-8 h-0.5 bg-emerald-400 inline-block"></span>
              <span>Export: Client → API → MySQL → Genera archivo → S3</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar — Real Stack */}
      <div className="w-full xl:w-[420px] space-y-6">
        {/* Technology Stack */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center mb-6">
            <Layers className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="font-bold text-slate-800">Stack Tecnológico Real</h3>
          </div>
          <div className="space-y-5">
            <StackItem 
              category="ENTORNO DE EJECUCIÓN" 
              title="Node.js 20.18.0 + TypeScript 5.8.3" 
              tags={["AWS EKS", "Docker Alpine"]} 
              desc="Imagen base node:20.18.0-alpine. Build multi-stage. Puerto 80." 
            />
            <StackItem 
              category="FRAMEWORK" 
              title="Express.js 4.19.2" 
              tags={["REST API", "Swagger/OpenAPI"]} 
              desc="Arquitectura en capas: Controllers → Services → Repositories. API docs en /api-docs." 
            />
            <StackItem 
              category="BASE DE DATOS" 
              title="MySQL (AWS RDS)" 
              tags={["mysql v2.18.1", "Sin ORM"]} 
              desc="Consultas SQL directas. Pool de conexiones: 50, límite de cola: 100. Charset: utf8mb4." 
            />
            <StackItem 
              category="ALMACENAMIENTO" 
              title="AWS S3" 
              tags={["@aws-sdk/client-s3", "Presigned URLs"]} 
              desc="Bucket configurable (S3_BUCKET_R2). Presigned URLs para upload directo. SDK v3 modular." 
            />
            <StackItem 
              category="MENSAJERÍA" 
              title="AWS SQS" 
              tags={["@aws-sdk/client-sqs", "Standard + FIFO"]} 
              desc="Cola para procesamiento asíncrono de bloques. Singleton pattern. Timeout: 5s." 
            />
            <StackItem 
              category="SERVERLESS" 
              title="AWS Lambda" 
              tags={["SQS Consumer"]} 
              desc="Función kbatch-orchestration-service-caller consume SQS y llama API externa (sistema de destino definido en el ProcessType) con bloques." 
            />
            <StackItem 
              category="MONITOREO" 
              title="Sentry" 
              tags={["@sentry/node v8.30", "Profiling"]} 
              desc="Error tracking y performance profiling. Middleware personalizado que filtra headers sensibles." 
            />
            <StackItem 
              category="CI/CD" 
              title="Bitbucket Pipelines" 
              tags={["AWS ECR", "ArgoCD", "SonarQube"]} 
              desc="Pipeline: Tests → SonarQube → Docker build → ECR push → EKS deploy vía ArgoCD GitOps." 
            />
          </div>
        </div>

        {/* Deployment Environments */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center mb-4">
            <Workflow className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="font-bold text-slate-800">Ambientes de Despliegue</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Desarrollo</div>
              <div className="flex flex-wrap gap-1">
                {['d1', 'd2'].map((env) => (
                  <span key={env} className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded font-mono">{env}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">QA</div>
              <div className="flex flex-wrap gap-1">
                {['q1', 'q2'].map((env) => (
                  <span key={env} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono">{env}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Producción</div>
              <div className="flex flex-wrap gap-1">
                {['cs10', 'ns10'].map((env) => (
                  <span key={env} className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-mono">{env}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kubernetes Config */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-slate-500 mr-2" />
            <h3 className="font-bold text-slate-800">Configuración Kubernetes</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Verificación de Salud</span>
              <code className="text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">/health</code>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Documentación API</span>
              <code className="text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">/api-docs</code>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Autoescalado</span>
              <span className="text-slate-700 font-medium">HPA (Horizontal Pod Autoscaler)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Secretos</span>
              <span className="text-slate-700 font-medium">External Secrets Operator</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Mapa de Configuración</span>
              <code className="text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded text-[10px]">kashio-env</code>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Selector de Nodos</span>
              <span className="text-slate-700 font-medium">EKS Node Groups</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Caché</span>
              <span className="text-slate-700 font-medium">En memoria (Redis planificado)</span>
            </div>
          </div>
        </div>

        {/* Middleware Stack */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            <h3 className="font-bold text-slate-800">Middleware</h3>
          </div>
          <div className="space-y-2">
            {[
              { name: 'CORS', desc: 'Habilitado para todos los orígenes', color: 'blue' },
              { name: 'express.json()', desc: 'Body parser JSON', color: 'slate' },
              { name: 'Version Middleware', desc: 'Headers X-API-Version, X-Application-Name', color: 'purple' },
              { name: 'HTTP Logger', desc: 'Logs en formato Apache Common Log', color: 'emerald' },
              { name: 'Sentry Response', desc: 'Captura errores status ≥ 400, filtra headers sensibles', color: 'orange' },
            ].map((mw) => (
              <div key={mw.name} className="flex items-start gap-2 py-1.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  mw.color === 'blue' ? 'bg-blue-400' :
                  mw.color === 'slate' ? 'bg-slate-400' :
                  mw.color === 'purple' ? 'bg-purple-400' :
                  mw.color === 'emerald' ? 'bg-emerald-400' :
                  'bg-orange-400'
                }`}></span>
                <div>
                  <span className="text-xs font-bold text-slate-700">{mw.name}</span>
                  <p className="text-[10px] text-slate-400">{mw.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Architecture Details Table */}
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center">
        <Table className="h-5 w-5 mr-2 text-blue-500" />
        Estructura del Proyecto
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Controllers */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <h4 className="text-xs font-bold text-purple-800 mb-2 uppercase tracking-wider">Controladores (6)</h4>
          <div className="space-y-1">
            {['fileController', 'exportController', 'userSyncController', 'processTypeController', 'processSyncController', 'simulationController'].map((c) => (
              <div key={c} className="text-[11px] text-purple-700 font-mono">{c}</div>
            ))}
          </div>
        </div>

        {/* Routes */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">Rutas (6)</h4>
          <div className="space-y-1">
            {['exportImportRoutes', 'userSyncRoutes', 'processTypeRoutes', 'processSyncRoutes', 'simulationRoutes', 'index (aggregator)'].map((r) => (
              <div key={r} className="text-[11px] text-blue-700 font-mono">{r}</div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
          <h4 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">Servicios (17+)</h4>
          <div className="space-y-1">
            {[
              'FileProcessingService', 'ExportService', 'SQSService', 'WorkerManagementService',
              'PresignedUrlService', 's3PresignedService', 'fileParserService', 'formatValidationService',
              'ProcessTypeService', 'userSyncService', 'SeedDataService', '...'
            ].map((s, i) => (
              <div key={i} className="text-[11px] text-emerald-700 font-mono">{s}</div>
            ))}
          </div>
        </div>

        {/* Repositories */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <h4 className="text-xs font-bold text-orange-800 mb-2 uppercase tracking-wider">Repositorios (12)</h4>
          <div className="space-y-1">
            {[
              'file.repository', 'process.repository', 'processFileRun.repository', 'processWorker.repository',
              'processType.repository', 'userBatch.repository', 'status.repository', 'userProcessConfig.repository',
              'batchFile.repository', 'exportRepository', 'application.repository', 'fileRunStatusHistory.repository'
            ].map((r) => (
              <div key={r} className="text-[11px] text-orange-700 font-mono">{r}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

// =============================================================================
// TAB 2: DATABASE SCHEMA
// =============================================================================
const SchemaTab: React.FC = () => (
  <>
    {/* Banner */}
    <div className="bg-[#064e3b] text-white p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center mb-2">
          <Database className="h-5 w-5 mr-2 text-emerald-300" />
          <h3 className="font-bold text-lg">Esquema de Base de Datos &mdash; KashioBatch_r2 (MySQL 8.0)</h3>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          7 tablas interconectadas que soportan el ciclo completo de importación y exportación de archivos con trazabilidad por usuario y organización.
        </p>
      </div>
    </div>

    {/* ER Diagram */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <h3 className="font-bold text-slate-700 mb-6 flex items-center">
        <Link2 className="h-5 w-5 mr-2 text-emerald-600" />
        Diagrama de Relaciones (Entity-Relationship)
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Row 1: Foundation tables */}
        <TableCard
          name="Users"
          color="purple"
          icon={Users}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'VARCHAR(50) UNIQUE', important: true },
            { name: 'company_id', type: 'VARCHAR(50)', important: true, note: 'ID de la organización' },
            { name: 'user_name', type: 'VARCHAR(100)' },
            { name: 'user_email', type: 'VARCHAR(100)' },
            { name: 'metadata', type: 'JSON', note: 'sourceService, application' },
            { name: 'created_at', type: 'TIMESTAMP' },
          ]}
          description="Usuarios sincronizados desde cualquier servicio externo (KashioSec, ERP, CRM, etc.)"
          relations={['File.uploaded_by → Users.public_id', 'UserProcessConfig.customer_id → Users.company_id']}
        />

        <TableCard
          name="ProcessType"
          color="blue"
          icon={Settings}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE', important: true },
            { name: 'name', type: 'VARCHAR(255)' },
            { name: 'description', type: 'TEXT' },
            { name: 'config', type: 'JSON', important: true, note: 'Validaciones (type=1) o Columnas (type=2)' },
            { name: 'type', type: 'INT', important: true, note: '1=Import, 2=Export' },
            { name: 'created_at / updated_at', type: 'DATETIME' },
          ]}
          description="Define cómo se procesan los archivos. type=1 para importación (validaciones, callbackUrl, maxRowsPerBlock), type=2 para exportación (columns, fileType)."
          relations={['File.process_type_id → ProcessType.id', 'Process.process_type_id → ProcessType.id']}
        />

        <TableCard
          name="Status"
          color="amber"
          icon={CircleDot}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE' },
            { name: 'name', type: 'VARCHAR(100)', important: true, note: 'PENDING, SENT, COMPLETED, etc.' },
            { name: 'description', type: 'TEXT' },
            { name: 'type', type: "ENUM('batch','block')", important: true },
          ]}
          description="Catálogo de estados del sistema. 5 estados para batch (ProcessFileRun) y 6 estados para block (ProcessWorker). Se inicializa con POST /file/seed-data."
          relations={['ProcessFileRun.status_id → Status.id', 'ProcessWorker.status_id → Status.id']}
        />
      </div>

      {/* Row 2: Core processing tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TableCard
          name="File"
          color="slate"
          icon={FileText}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE', important: true },
            { name: 'file_name', type: 'VARCHAR(100)' },
            { name: 'file_url', type: 'TEXT', note: 'URL en AWS S3' },
            { name: 'process_type_id', type: 'INT FK → ProcessType', fk: true },
            { name: 'uploaded_by', type: 'VARCHAR(50) FK → Users', fk: true },
            { name: 'metadata', type: 'JSON', note: '{"action": {"name": "import"|"export", "value": 1|2}}' },
            { name: 'created_at / updated_at', type: 'DATETIME' },
          ]}
          description="Registro de cada archivo (importado o exportado). Asociado a un ProcessType y opcionalmente a un usuario."
          relations={['Process.file_id → File.id', 'UserProcessConfig.file_id → File.id']}
        />

        <TableCard
          name="Process"
          color="blue"
          icon={Cpu}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE', important: true },
            { name: 'process_type_id', type: 'INT FK → ProcessType', fk: true },
            { name: 'file_id', type: 'INT FK → File', fk: true },
            { name: 'initiated_by', type: 'CHAR(36)' },
            { name: 'metadata', type: 'JSON' },
            { name: 'created_at / updated_at', type: 'DATETIME' },
          ]}
          description="Registro del proceso de ejecución. Se crea al llamar /start-processing (importación). Vincula el archivo con el tipo de proceso."
          relations={['ProcessFileRun.process_id → Process.id']}
        />
      </div>

      {/* Row 3: Execution tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TableCard
          name="ProcessFileRun"
          color="orange"
          icon={RefreshCw}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE' },
            { name: 'process_id', type: 'INT FK → Process', fk: true },
            { name: 'status_id', type: 'INT FK → Status', fk: true, note: 'Estado del BATCH' },
            { name: 'start_time / end_time', type: 'DATETIME' },
            { name: 'retry_count', type: 'INT DEFAULT 0' },
            { name: 'error_message', type: 'TEXT' },
            { name: 'metadata', type: 'JSON' },
          ]}
          description="Ejecución de un proceso (BATCH). Contiene el estado global del procesamiento. Sus estados son: PENDING, IN_PROGRESS, PROCESSED_EXTERNAL, COMPLETED, REJECTED."
          relations={['ProcessWorker.process_file_run_id → ProcessFileRun.id']}
        />

        <TableCard
          name="ProcessWorker"
          color="teal"
          icon={Box}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'public_id', type: 'CHAR(36) UNIQUE', important: true },
            { name: 'urlFile', type: 'VARCHAR(256)', note: 'URL del JSON de datos en S3' },
            { name: 'process_file_run_id', type: 'INT FK → ProcessFileRun', fk: true },
            { name: 'block_number', type: 'INT' },
            { name: 'status_id', type: 'INT FK → Status', fk: true, note: 'Estado del BLOCK' },
            { name: 'block_start / block_end', type: 'INT' },
            { name: 'error_message', type: 'TEXT' },
            { name: 'metadata', type: 'JSON', note: 'Puede incluir errores parciales' },
          ]}
          description="Cada bloque de datos procesado individualmente. Workers válidos (SENT) se envían a SQS. Workers inválidos (ERROR) solo se guardan como reporte. Estados: PENDING, SENT, RECEIVED, PROCESSED_EXTERNAL, COMPLETED, ERROR."
          relations={[]}
        />
      </div>

      {/* Row 4: Traceability */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 mt-4">
        <TableCard
          name="UserProcessConfig"
          color="indigo"
          icon={Shield}
          columns={[
            { name: 'id', type: 'INT PK', pk: true },
            { name: 'customer_id', type: 'VARCHAR(50) FK → Users.company_id', fk: true, note: 'ID de la organización' },
            { name: 'process_type_id', type: 'INT FK → ProcessType', fk: true },
            { name: 'file_id', type: 'INT FK → File', fk: true },
            { name: 'validation_schema', type: 'JSON', note: 'Copia del ProcessType.config al momento de crear' },
            { name: 'schedule_config', type: 'JSON' },
          ]}
          description="Tabla de trazabilidad: relaciona quién (organización), con qué proceso y qué archivo. Se crea automáticamente al generar URL presignada (importación) o al exportar datos."
          relations={[]}
        />
      </div>
    </div>

    {/* Flujos de Datos — Import & Export */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-700 mb-2 flex items-center">
        <Link2 className="h-5 w-5 mr-2 text-emerald-600" />
        Flujos de Datos
      </h3>
      <p className="text-xs text-slate-400 mb-6">
        Tablas y servicios involucrados en cada tipo de proceso, en el orden en que participan.
      </p>

      <div className="space-y-4">
        {/* Import Flow */}
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <FileUp className="h-4 w-4 text-emerald-600" />
            <h4 className="font-bold text-emerald-800 text-sm">Flujo de Importación (asíncrono)</h4>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-bold border border-purple-200">Users</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-bold border border-blue-200">ProcessType (type=1)</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200">File</span>
            <span className="text-emerald-400">+</span>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg font-bold border border-amber-200">UserProcessConfig</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200">Process</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-orange-100 text-orange-700 px-2.5 py-1.5 rounded-lg font-bold border border-orange-200">ProcessFileRun</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-bold border border-blue-200">ProcessWorker(s)</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold border border-slate-300">SQS → Lambda → API Externa (sistema de destino definido en el ProcessType)</span>
            <span className="text-emerald-400">→</span>
            <span className="bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-bold border border-purple-200">Status</span>
          </div>
          <p className="text-[10px] text-emerald-500 text-center mt-2">8 tablas involucradas + SQS + Lambda + API externa (sistema de destino definido en el ProcessType) &bull; Requiere polling para consultar resultado</p>
        </div>

        {/* Export Flow */}
        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <FileDown className="h-4 w-4 text-green-600" />
            <h4 className="font-bold text-green-800 text-sm">Flujo de Exportación (síncrono)</h4>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-bold border border-purple-200">Users</span>
            <span className="text-green-400">→</span>
            <span className="bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg font-bold border border-blue-200">ProcessType (type=2)</span>
            <span className="text-green-400">→</span>
            <span className="bg-green-200 text-green-800 px-2.5 py-1.5 rounded-lg font-bold border border-green-300">Valida + Genera archivo</span>
            <span className="text-green-400">→</span>
            <span className="bg-orange-100 text-orange-700 px-2.5 py-1.5 rounded-lg font-bold border border-orange-200">S3</span>
            <span className="text-green-400">→</span>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-bold border border-emerald-200">File</span>
            <span className="text-green-400">+</span>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg font-bold border border-amber-200">UserProcessConfig</span>
          </div>
          <p className="text-[10px] text-green-500 text-center mt-2">Solo 3 tablas (Users, File, UserProcessConfig) + ProcessType &bull; Sin SQS, Lambda, workers ni estados &bull; Respuesta inmediata</p>
        </div>
      </div>
    </div>
  </>
);

// =============================================================================
// TAB 3: SYSTEM STATES
// =============================================================================
const StatesTab: React.FC = () => (
  <>
    {/* Banner */}
    <div className="bg-[#2e1065] text-white p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center mb-2">
          <GitBranch className="h-5 w-5 mr-2 text-purple-300" />
          <h3 className="font-bold text-lg">Máquina de Estados &mdash; Sistema KBatch</h3>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          El sistema gestiona estados a dos niveles: BATCH (ProcessFileRun) para el proceso completo y BLOCK (ProcessWorker) para cada bloque individual. 
          Los estados se inicializan con POST /file/seed-data y se almacenan en la tabla Status.
        </p>
      </div>
    </div>

    {/* BATCH States */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center mb-2">
        <div className="p-2 bg-orange-100 rounded-lg mr-3">
          <RefreshCw className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Estados de BATCH (ProcessFileRun)</h3>
          <p className="text-xs text-slate-500">Ciclo de vida del proceso completo &bull; Tabla Status con type=&apos;batch&apos; &bull; Solo aplica a Importación (type=1)</p>
        </div>
      </div>

      {/* State Flow Diagram */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <StateNode name="PENDING" desc="Proceso creado, no iniciado" color="slate" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="IN_PROGRESS" desc="Todos los bloques enviados a SQS" color="blue" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="PROCESSED_EXTERNAL" desc="Todos los bloques SENT procesados por API externa (sistema de destino definido en el ProcessType)" color="amber" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="COMPLETED" desc="Proceso finalizado exitosamente" color="green" />
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">PENDING</div>
          <ArrowDown className="h-4 w-4 text-red-400" />
          <StateNode name="REJECTED" desc="Error de validación al iniciar" color="red" />
        </div>
      </div>

      {/* Detailed table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Descripción</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Cuándo ocurre</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Transición siguiente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PENDING" color="slate" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Se creó el proceso pero no lo han iniciado</td>
              <td className="px-4 py-3 text-xs text-slate-500">Estado inicial después de crear el ProcessFileRun</td>
              <td className="px-4 py-3 text-xs text-slate-500">→ IN_PROGRESS o → REJECTED</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="IN_PROGRESS" color="blue" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Todos los bloques fueron enviados a SQS exitosamente, esperando respuesta de API externa (sistema de destino definido en el ProcessType)</td>
              <td className="px-4 py-3 text-xs text-slate-500">Cuando todos los workers se envían a SQS</td>
              <td className="px-4 py-3 text-xs text-slate-500">→ PROCESSED_EXTERNAL</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PROCESSED_EXTERNAL" color="amber" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Todos los bloques que estaban en SENT fueron procesados por la API externa (sistema de destino definido en el ProcessType)</td>
              <td className="px-4 py-3 text-xs text-slate-500">Cuando todos los workers SENT cambian a PROCESSED_EXTERNAL vía callback</td>
              <td className="px-4 py-3 text-xs text-slate-500">→ COMPLETED</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="COMPLETED" color="green" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Procesamiento del batch completado exitosamente</td>
              <td className="px-4 py-3 text-xs text-slate-500">Todos los workers están en COMPLETED</td>
              <td className="px-4 py-3 text-xs text-slate-500">Estado final</td>
            </tr>
            <tr className="hover:bg-red-50/50">
              <td className="px-4 py-3"><StatusBadge name="REJECTED" color="red" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Error de validaciones &mdash; el proceso no pasa</td>
              <td className="px-4 py-3 text-xs text-slate-500">Errores de validación al llamar /start-processing (antes de enviar bloques)</td>
              <td className="px-4 py-3 text-xs text-slate-500">Estado final (error)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* BLOCK States */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex items-center mb-2">
        <div className="p-2 bg-teal-100 rounded-lg mr-3">
          <Box className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Estados de BLOCK (ProcessWorker)</h3>
          <p className="text-xs text-slate-500">Ciclo de vida de cada bloque individual &bull; Tabla Status con type=&apos;block&apos; &bull; Solo aplica a Importación (type=1)</p>
        </div>
      </div>

      {/* State Flow Diagram */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <StateNode name="PENDING" desc="Bloque creado, no enviado" color="slate" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="SENT" desc="Enviado a cola SQS" color="blue" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="RECEIVED" desc="API externa (sistema de destino definido en el ProcessType) confirmó recepción" color="cyan" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="PROCESSED_EXTERNAL" desc="API externa (sistema de destino definido en el ProcessType) terminó de procesar" color="amber" />
        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <StateNode name="COMPLETED" desc="Bloque completado exitosamente" color="green" />
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] text-red-400 font-medium">Cualquier estado puede ir a ERROR</p>
          <StateNode name="ERROR" desc="Error en cualquier etapa del procesamiento" color="red" />
        </div>
      </div>

      {/* Detailed table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Descripción</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Cuándo ocurre</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">¿Se envía a SQS?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PENDING" color="slate" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque creado pero no enviado a SQS</td>
              <td className="px-4 py-3 text-xs text-slate-500">Estado inicial cuando se crea el worker</td>
              <td className="px-4 py-3 text-xs text-slate-500">No (aún)</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="SENT" color="blue" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque enviado satisfactoriamente a la cola SQS</td>
              <td className="px-4 py-3 text-xs text-slate-500">Después de enviar exitosamente el mensaje a SQS con la URL del JSON de datos válidos</td>
              <td className="px-4 py-3 text-xs text-green-600 font-medium">Sí ✓</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="RECEIVED" color="cyan" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque recibido por la API externa (sistema de destino definido en el ProcessType)</td>
              <td className="px-4 py-3 text-xs text-slate-500">La API externa (sistema de destino definido en el ProcessType) llama PUT /worker/status/:workerId con status &quot;received&quot;</td>
              <td className="px-4 py-3 text-xs text-slate-500">Ya fue</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PROCESSED_EXTERNAL" color="amber" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque procesado por la API externa (sistema de destino definido en el ProcessType)</td>
              <td className="px-4 py-3 text-xs text-slate-500">La API externa (sistema de destino definido en el ProcessType) llama PUT /worker/status/:workerId con status &quot;processed_external&quot;</td>
              <td className="px-4 py-3 text-xs text-slate-500">Ya fue</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="COMPLETED" color="green" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque procesado completamente y exitosamente</td>
              <td className="px-4 py-3 text-xs text-slate-500">La API externa (sistema de destino definido en el ProcessType) llama PUT /worker/status/:workerId con status &quot;completed&quot;</td>
              <td className="px-4 py-3 text-xs text-slate-500">Ya fue</td>
            </tr>
            <tr className="hover:bg-red-50/50">
              <td className="px-4 py-3"><StatusBadge name="ERROR" color="red" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Bloque con error &mdash; puede ocurrir en cualquier etapa</td>
              <td className="px-4 py-3 text-xs text-slate-500">Error de validación de formato (no se envía a SQS) o la API externa (sistema de destino definido en el ProcessType) reporta error total del bloque</td>
              <td className="px-4 py-3 text-xs text-red-600 font-medium">No ✗ (si error de validación)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    {/* Relationship between BATCH and BLOCK */}
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center mb-4">
        <div className="p-2 bg-purple-100 rounded-lg mr-3">
          <Link2 className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Relación entre Estados de BATCH y BLOCK</h3>
          <p className="text-xs text-slate-500">El estado del BATCH depende del estado agregado de todos sus bloques</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-purple-700">Estado BATCH</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-purple-700">Condición de los Bloques</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-purple-700">Ejemplo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PENDING" color="slate" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">ProcessFileRun creado pero aún no se han enviado bloques</td>
              <td className="px-4 py-3 text-xs text-slate-500">Justo después de crear el proceso</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="IN_PROGRESS" color="blue" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Todos los bloques han sido enviados a SQS (todos en estado SENT o superior)</td>
              <td className="px-4 py-3 text-xs text-slate-500">10 bloques, todos en SENT → BATCH IN_PROGRESS</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="PROCESSED_EXTERNAL" color="amber" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Todos los bloques que estaban en SENT ahora están en PROCESSED_EXTERNAL o superior</td>
              <td className="px-4 py-3 text-xs text-slate-500">10 bloques, todos en PROCESSED_EXTERNAL → BATCH PROCESSED_EXTERNAL</td>
            </tr>
            <tr className="hover:bg-slate-50">
              <td className="px-4 py-3"><StatusBadge name="COMPLETED" color="green" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Todos los bloques están en estado COMPLETED</td>
              <td className="px-4 py-3 text-xs text-slate-500">10 bloques, todos en COMPLETED → BATCH COMPLETED</td>
            </tr>
            <tr className="hover:bg-red-50/50">
              <td className="px-4 py-3"><StatusBadge name="REJECTED" color="red" /></td>
              <td className="px-4 py-3 text-xs text-slate-600">Error de validación al iniciar el proceso (antes de crear/enviar bloques)</td>
              <td className="px-4 py-3 text-xs text-slate-500">Columnas requeridas faltan en el archivo → BATCH REJECTED</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-bold mb-1">Nota importante sobre workers con ERROR:</p>
            <p>Los workers en estado ERROR (por errores de validación de formato) <strong>NO se consideran</strong> para la lógica de actualización automática del BATCH. Solo se evalúan los workers que fueron enviados exitosamente a SQS (SENT, RECEIVED, PROCESSED_EXTERNAL o COMPLETED).</p>
          </div>
        </div>
      </div>
    </div>
  </>
);

// =============================================================================
// TAB 4: IMPORT FLOW
// =============================================================================
const ImportFlowTab: React.FC = () => (
  <>
    {/* Banner */}
    <div className="bg-[#1e3a5f] text-white p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center mb-2">
          <FileUp className="h-5 w-5 mr-2 text-blue-300" />
          <h3 className="font-bold text-lg">Flujo Completo de Importación (ProcessType type=1)</h3>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Proceso asíncrono: subir archivo → dividir en bloques → validar formatos → enviar a SQS → API externa (sistema de destino definido en el ProcessType) procesa → callbacks actualizan estado.
          Requiere polling cada 5 segundos para consultar progreso.
        </p>
      </div>
    </div>

    {/* Steps */}
    <div className="space-y-4">
      <FlowStep
        step={1}
        title="Sincronizar Usuario"
        endpoint="POST /user-sync"
        color="purple"
        icon={Users}
        tables={[
          { table: 'Users', operation: 'SELECT', desc: 'Verifica si ya existe (idempotente)' },
          { table: 'Users', operation: 'INSERT', desc: 'Crea registro si no existe' },
        ]}
        description="Envía userPublicId, userName, userEmail, companyId desde el frontend. Opcionalmente serviceName y application para trazabilidad. Este paso es prerequisito obligatorio."
        metadata="Se almacena metadata: { sourceService, application } si se envían"
      />

      <FlowStep
        step={2}
        title="Generar URL Presignada"
        endpoint="POST /file/generate-presigned-url"
        color="blue"
        icon={Upload}
        tables={[
          { table: 'ProcessType', operation: 'SELECT', desc: 'Valida que exista el ProcessType' },
          { table: 'Users', operation: 'SELECT', desc: 'Valida que el usuario esté sincronizado (si se envía userId)' },
          { table: 'File', operation: 'INSERT', desc: 'Crea registro: file_name, file_url, uploaded_by, metadata={action:{name:"import",value:1}}' },
          { table: 'UserProcessConfig', operation: 'INSERT', desc: 'Crea relación: customer_id=user.company_id, process_type_id, file_id (solo si userId)' },
        ]}
        description='Se envía fileName, fileType (MIME), processType (UUID). El userId es opcional pero recomendado para trazabilidad. Se valida extensión (.xlsx, .csv, .json, .txt) y coincidencia con tipo MIME. Retorna presignedUrl (válida 1 hora) y file ID público.'
        metadata="File.metadata siempre contiene {action: {name: 'import', value: 1}}"
      />

      <FlowStep
        step={3}
        title="Subir Archivo a S3"
        endpoint="PUT {presignedUrl}"
        color="slate"
        icon={HardDrive}
        tables={[
          { table: 'AWS S3', operation: 'PUT', desc: 'Archivo binario subido al bucket' },
        ]}
        description="El cliente sube el archivo directamente a S3 usando la presignedUrl. Debe incluir el Content-Type igual al fileType enviado. No pasa por el backend de KBATCH."
        metadata=""
      />

      <FlowStep
        step={4}
        title="Iniciar Procesamiento"
        endpoint="POST /file/start-processing/:fileId"
        color="orange"
        icon={Zap}
        tables={[
          { table: 'File', operation: 'SELECT', desc: 'Obtiene info del archivo' },
          { table: 'ProcessType', operation: 'SELECT', desc: 'Obtiene config: validations, maxRowsPerBlock, callBackUrl, externalApi' },
          { table: 'AWS S3', operation: 'GET', desc: 'Lee el archivo una sola vez (con cache TTL 5min)' },
          { table: 'Process', operation: 'INSERT', desc: 'Crea registro del proceso (solo si validación temprana OK)' },
          { table: 'ProcessFileRun', operation: 'INSERT', desc: 'Crea ejecución con status=PENDING (solo si validación OK)' },
          { table: 'ProcessWorker', operation: 'INSERT ×N', desc: 'Crea workers: válidos (SENT) + inválidos (ERROR)' },
          { table: 'AWS S3', operation: 'PUT', desc: 'Guarda block_N_valid.json y block_N_errors.json' },
          { table: 'AWS SQS', operation: 'SEND', desc: 'Envía mensajes a cola kbatch-orchestration-hub (solo bloques válidos)' },
          { table: 'ProcessFileRun', operation: 'UPDATE', desc: 'Cambia a IN_PROGRESS cuando todos los bloques se envían' },
        ]}
        description="Paso más complejo. Primero hace validación temprana de columnas requeridas ANTES de crear proceso. Si falla → error sin crear registros en BD. Si OK → divide archivo en bloques de N registros (configurable), valida formatos (19 tipos), separa válidos e inválidos, envía válidos a SQS. Retorna processId."
        metadata="Workers inválidos (ERROR) se guardan en S3 como reporte pero NO se envían a SQS"
      />

      <FlowStep
        step={5}
        title="Consultar Progreso (Polling)"
        endpoint="GET /file/process/:processId/status"
        color="blue"
        icon={Eye}
        tables={[
          { table: 'Process', operation: 'SELECT', desc: 'Obtiene info del proceso' },
          { table: 'ProcessFileRun', operation: 'SELECT', desc: 'Obtiene estado actual del batch' },
          { table: 'ProcessWorker', operation: 'SELECT', desc: 'Cuenta workers por estado' },
          { table: 'Status', operation: 'SELECT', desc: 'Obtiene nombres de estados' },
        ]}
        description="Consultar cada 5 segundos. Retorna: status (PENDING/IN_PROGRESS/PROCESSED_EXTERNAL/COMPLETED/REJECTED), porcentaje calculado como (completed+error)/total*100, desglose de workers por estado y currentStep (VALIDATING/SPLITTING_BLOCKS/PROCESSING_BLOCKS/COMPLETED). HTTP 200 cuando COMPLETED, HTTP 202 cuando en progreso."
        metadata=""
      />

      <FlowStep
        step={6}
        title="Callback de API Externa (Background — sistema de destino definido en el ProcessType)"
        endpoint="PUT /file/worker/status/:workerId"
        color="teal"
        icon={RefreshCw}
        tables={[
          { table: 'ProcessWorker', operation: 'UPDATE', desc: 'Actualiza status_id y error_message' },
          { table: 'ProcessFileRun', operation: 'UPDATE', desc: 'Actualización automática: si todos SENT→COMPLETED → BATCH COMPLETED; si todos SENT→PROCESSED_EXTERNAL → BATCH PROCESSED_EXTERNAL' },
          { table: 'Status', operation: 'SELECT', desc: 'Obtiene ID del nuevo estado' },
        ]}
        description='Lambda lee SQS → envía datos a API externa (sistema de destino definido en el ProcessType). Dicha API llama este endpoint para reportar resultado. Estados: "received", "processed_external", "completed", "error". Para errores parciales (algunos registros fallaron): primero POST /worker/:workerId/partial-errors, luego PUT status "processed_external". Solo usar "error" si TODO el bloque falló.'
        metadata="Los workers en estado ERROR NO se consideran para la actualización automática del BATCH"
      />

      <FlowStep
        step={7}
        title="Obtener Resultado Final"
        endpoint="GET /file/result/:fileId"
        color="green"
        icon={CheckCircle}
        tables={[
          { table: 'File', operation: 'SELECT', desc: 'Info del archivo' },
          { table: 'Process', operation: 'SELECT', desc: 'Info del proceso' },
          { table: 'ProcessType', operation: 'SELECT', desc: 'Configuración aplicada' },
          { table: 'ProcessFileRun', operation: 'SELECT', desc: 'Estado y tiempos' },
          { table: 'ProcessWorker', operation: 'SELECT', desc: 'Todos los workers con URLs de JSONs' },
          { table: 'Status', operation: 'SELECT', desc: 'Estados de cada worker' },
        ]}
        description="Llamar cuando status sea COMPLETED o IN_PROGRESS. Retorna info completa: archivo, proceso, configuración, bloques procesados (total, sent, error), detalles de cada worker con jsonUrl para descargar datos válidos (block_N_valid.json) y errores (block_N_errors.json)."
        metadata=""
      />
    </div>

    {/* Summary diagram */}
    <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-slate-200">
      <h3 className="font-bold text-slate-700 mb-4">Resumen del Flujo</h3>
      <div className="font-mono text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto whitespace-pre leading-6">
{`Cliente:     [1] user-sync → [2] generate-presigned-url → [3] PUT S3 → [4] start-processing → [5] polling status → [7] result
                                                                                    ↓
SQS:                                                                     Mensajes con jsonUrl + workerId + callBackUrl
                                                                                    ↓
Lambda:                                                                  Lee SQS → Descarga JSON de S3 → POST a API Externa (sistema de destino definido en el ProcessType)
                                                                                    ↓
API Externa (destino ProcessType):                                                   Procesa datos → [6] PUT /worker/status/:workerId (callback)
                                                                         Errores parciales → POST /worker/:workerId/partial-errors`}
      </div>
    </div>
  </>
);

// =============================================================================
// TAB 5: EXPORT FLOW
// =============================================================================
const ExportFlowTab: React.FC = () => (
  <>
    {/* Banner */}
    <div className="bg-[#14532d] text-white p-6 rounded-lg shadow-sm mb-8 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center mb-2">
          <FileDown className="h-5 w-5 mr-2 text-green-300" />
          <h3 className="font-bold text-lg">Flujo Completo de Exportación (ProcessType type=2)</h3>
        </div>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Proceso síncrono: enviar datos JSON → validar columnas → opcionalmente validar formatos → generar archivo (TXT/CSV/XLSX) → subir a S3 → retornar URL inmediatamente.
          No requiere polling ni workers.
        </p>
      </div>
    </div>

    {/* Key differences */}
    <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="font-bold text-green-800 text-sm mb-3 flex items-center">
        <Zap className="h-4 w-4 mr-2" />
        Diferencias clave con Importación
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-xs text-green-700">
          <p className="font-bold mb-1">Proceso Síncrono</p>
          <p>El archivo se genera y retorna en la misma respuesta. No requiere polling ni consultas de estado.</p>
        </div>
        <div className="text-xs text-green-700">
          <p className="font-bold mb-1">Sin Workers ni SQS</p>
          <p>No se crean bloques, no se usan colas SQS, no hay callbacks de API externa (sistema de destino definido en el ProcessType). Todo ocurre en un solo request.</p>
        </div>
        <div className="text-xs text-green-700">
          <p className="font-bold mb-1">Validación de Formatos Opcional</p>
          <p>Solo se validan formatos si se configura &quot;format&quot; en las columnas del ProcessType. Si no, solo se valida existencia de columnas requeridas.</p>
        </div>
      </div>
    </div>

    {/* Steps */}
    <div className="space-y-4">
      <FlowStep
        step={1}
        title="Sincronizar Usuario"
        endpoint="POST /user-sync"
        color="purple"
        icon={Users}
        tables={[
          { table: 'Users', operation: 'SELECT', desc: 'Verifica si ya existe (idempotente)' },
          { table: 'Users', operation: 'INSERT', desc: 'Crea registro si no existe' },
        ]}
        description="Igual que en importación. Envía userPublicId, userName, userEmail, companyId. Es prerequisito obligatorio para exportar."
        metadata=""
      />

      <FlowStep
        step={2}
        title="Exportar Datos a Archivo"
        endpoint="POST /file/start-export"
        color="green"
        icon={Send}
        tables={[
          { table: 'Users', operation: 'SELECT', desc: 'Valida que el usuario exista y obtiene company_id' },
          { table: 'ProcessType', operation: 'SELECT', desc: 'Obtiene config: columns, fileType (TXT/CSV/XLSX), entityType' },
          { table: 'File', operation: 'INSERT', desc: 'Crea registro: file_name, file_url, uploaded_by=userId, metadata={action:{name:"export",value:2}}' },
          { table: 'UserProcessConfig', operation: 'INSERT', desc: 'Crea relación: customer_id=user.company_id, process_type_id, file_id' },
          { table: 'AWS S3', operation: 'PUT', desc: 'Sube el archivo generado (TXT/CSV/XLSX)' },
        ]}
        description='Acepta dos formatos de entrada: JSON directo (campo "data") o FormData con archivo JSON (campo "dataFile"). Valida columnas requeridas (búsqueda case-insensitive), opcionalmente valida 19 tipos de formato, genera archivo según fileType del ProcessType, sube a S3 y retorna URL inmediatamente. El userId es obligatorio.'
        metadata='File.metadata contiene {action: {name: "export", value: 2}}. Si fileName se omite, se autogenera como export-{timestamp}.{extension}'
      />
    </div>

    {/* Comparison table */}
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-700 mb-4">Comparación Importación vs Exportación</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Aspecto</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-blue-600">Importación (type=1)</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-green-600">Exportación (type=2)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {([
              ['Dirección', 'Cliente → KBATCH → API Externa (sistema de destino definido en el ProcessType)', 'Cliente → KBATCH → S3 → Cliente'],
              ['Tipo de proceso', 'Asíncrono (polling cada 5s)', 'Síncrono (respuesta inmediata)'],
              ['Input', 'Archivo (XLSX/CSV/JSON/TXT) subido a S3', 'JSON plano (array de objetos) o archivo JSON'],
              ['Output', 'Bloques JSON en S3 + Workers', 'Archivo único (TXT/CSV/XLSX) en S3'],
              ['ProcessType.type', '1', '2'],
              ['File.metadata', '{"action":{"name":"import","value":1}}', '{"action":{"name":"export","value":2}}'],
              ['Validación de formato', 'Obligatoria (config.validations)', 'Opcional (config.columns[].format)'],
              ['Workers/Bloques', 'Sí (múltiples bloques + SQS)', 'No'],
              ['SQS / Lambda', 'Sí', 'No'],
              ['Callback API Externa (sistema de destino definido en el ProcessType)', 'Sí (PUT /worker/status)', 'No'],
              ['Tablas creadas', 'File, Process, ProcessFileRun, ProcessWorker, UserProcessConfig', 'File, UserProcessConfig'],
              ['Estados del sistema', '5 estados BATCH + 6 estados BLOCK', 'Solo COMPLETED (inmediato)'],
            ] as string[][]).map(([aspect, importVal, exportVal], idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-xs font-bold text-slate-700">{aspect}</td>
                <td className="px-4 py-2 text-xs text-slate-600">{importVal}</td>
                <td className="px-4 py-2 text-xs text-slate-600">{exportVal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Export file formats */}
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="font-bold text-slate-700 mb-4">Formatos de Archivo de Salida</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-bold text-blue-800">TXT</span>
          </div>
          <p className="text-xs text-blue-700">Columnas alineadas con doble espacio. UTF-8 con BOM para correcta visualización de tildes. Ideal para sistemas legacy.</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center mb-2">
            <Table className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-bold text-green-800">CSV</span>
          </div>
          <p className="text-xs text-green-700">Formato RFC 4180 con comas. Valores con comas/saltos escapados con comillas. UTF-8 con BOM. Compatible con Excel.</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center mb-2">
            <Table className="h-5 w-5 text-purple-600 mr-2" />
            <span className="font-bold text-purple-800">XLSX</span>
          </div>
          <p className="text-xs text-purple-700">Excel con headers en negrita con fondo gris. Columnas con ancho automático (20 unidades). Generado con ExcelJS.</p>
        </div>
      </div>
    </div>
  </>
);

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

// Service box for cloud tab
const ServiceBox: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
  desc: string;
  color: string;
  small?: boolean;
}> = ({ icon: Icon, title, subtitle, desc, color, small }) => {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 border-purple-100',
    slate: 'bg-slate-50 border-slate-200',
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    orange: 'bg-orange-50 border-orange-100',
  };
  const iconColorMap: Record<string, string> = {
    purple: 'bg-purple-600',
    slate: 'bg-slate-700',
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    orange: 'bg-orange-600',
  };
  const textColorMap: Record<string, string> = {
    purple: 'text-purple-900',
    slate: 'text-slate-900',
    blue: 'text-blue-900',
    emerald: 'text-emerald-900',
    orange: 'text-orange-900',
  };
  const subColorMap: Record<string, string> = {
    purple: 'text-purple-700',
    slate: 'text-slate-700',
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    orange: 'text-orange-700',
  };

  return (
    <div className={`${colorMap[color]} border p-4 rounded-lg ${small ? 'w-56' : 'w-64'} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center mb-2">
        <div className={`${iconColorMap[color]} p-2 rounded text-white mr-3`}>
          <Icon className={small ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
        <span className={`font-bold ${textColorMap[color]} text-sm`}>{title}</span>
      </div>
      <div className={`text-[10px] ${subColorMap[color]} font-semibold mb-1`}>{subtitle}</div>
      <div className="text-[10px] text-slate-500 leading-tight">{desc}</div>
    </div>
  );
};

// Stack item for cloud tab
const StackItem: React.FC<{ category: string; title: string; tags: string[]; desc: string }> = ({ category, title, tags, desc }) => (
  <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{category}</div>
    <div className="font-bold text-slate-800 text-sm mb-1">{title}</div>
    <div className="flex flex-wrap gap-1 mb-2">
      {tags.map((t) => (
        <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{t}</span>
      ))}
    </div>
    <div className="text-xs text-slate-500">{desc}</div>
  </div>
);

// Table card for schema tab
const TableCard: React.FC<{
  name: string;
  color: string;
  icon: React.FC<{ className?: string }>;
  columns: Array<{ name: string; type: string; pk?: boolean; fk?: boolean; important?: boolean; note?: string }>;
  description: string;
  relations: string[];
}> = ({ name, color, icon: Icon, columns, description, relations }) => {
  const bgMap: Record<string, string> = {
    purple: 'bg-purple-600', blue: 'bg-blue-600', amber: 'bg-amber-600', slate: 'bg-slate-600',
    orange: 'bg-orange-600', teal: 'bg-teal-600', indigo: 'bg-indigo-600',
  };
  const borderMap: Record<string, string> = {
    purple: 'border-purple-200', blue: 'border-blue-200', amber: 'border-amber-200', slate: 'border-slate-200',
    orange: 'border-orange-200', teal: 'border-teal-200', indigo: 'border-indigo-200',
  };

  return (
    <div className={`bg-white rounded-lg border ${borderMap[color]} overflow-hidden`}>
      <div className={`${bgMap[color]} text-white px-4 py-2.5 flex items-center`}>
        <Icon className="h-4 w-4 mr-2" />
        <span className="font-bold text-sm">{name}</span>
      </div>
      <div className="p-3">
        <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{description}</p>
        <div className="space-y-1">
          {columns.map((col) => (
            <div key={col.name} className="flex items-start text-[10px]">
              <span className={`font-mono font-medium mr-2 min-w-[120px] flex-shrink-0 ${
                col.pk ? 'text-amber-600' : col.fk ? 'text-blue-600' : col.important ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {col.pk && '🔑 '}{col.fk && '🔗 '}{col.name}
              </span>
              <span className="text-slate-400 mr-2">{col.type}</span>
              {col.note && <span className="text-slate-400 italic">({col.note})</span>}
            </div>
          ))}
        </div>
        {relations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium mb-1">Referenciado por:</p>
            {relations.map((rel) => (
              <p key={rel} className="text-[10px] text-blue-500 font-mono">{rel}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// State node for state machine diagrams
const StateNode: React.FC<{ name: string; desc: string; color: string }> = ({ name, desc, color }) => {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    red: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className={`px-4 py-2 rounded-lg border ${colorMap[color]} text-center flex-shrink-0`}>
      <div className="font-bold text-xs">{name}</div>
      <div className="text-[10px] mt-0.5 opacity-80 max-w-[140px]">{desc}</div>
    </div>
  );
};

// Status badge
const StatusBadge: React.FC<{ name: string; color: string }> = ({ name, color }) => {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorMap[color]}`}>
      {name}
    </span>
  );
};

// Flow step for import/export tabs
const FlowStep: React.FC<{
  step: number;
  title: string;
  endpoint: string;
  color: string;
  icon: React.FC<{ className?: string }>;
  tables: Array<{ table: string; operation: string; desc: string }>;
  description: string;
  metadata: string;
}> = ({ step, title, endpoint, color, icon: Icon, tables, description, metadata }) => {
  const bgMap: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600', blue: 'bg-blue-100 text-blue-600', slate: 'bg-slate-100 text-slate-600',
    orange: 'bg-orange-100 text-orange-600', teal: 'bg-teal-100 text-teal-600', green: 'bg-green-100 text-green-600',
  };
  const numMap: Record<string, string> = {
    purple: 'bg-purple-600', blue: 'bg-blue-600', slate: 'bg-slate-600',
    orange: 'bg-orange-600', teal: 'bg-teal-600', green: 'bg-green-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Step number */}
          <div className={`w-10 h-10 ${numMap[color]} text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
            {step}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Title + Endpoint */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${bgMap[color]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-slate-800">{title}</h4>
              <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{endpoint}</code>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{description}</p>

            {/* Tables affected */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-100 rounded overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Tabla / Servicio</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Operación</th>
                    <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tables.map((t, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-1.5 font-mono font-bold text-slate-700">{t.table}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.operation.startsWith('INSERT') ? 'bg-green-100 text-green-700' :
                          t.operation.startsWith('UPDATE') ? 'bg-amber-100 text-amber-700' :
                          t.operation.startsWith('SELECT') ? 'bg-blue-100 text-blue-700' :
                          t.operation.startsWith('PUT') ? 'bg-purple-100 text-purple-700' :
                          t.operation.startsWith('SEND') ? 'bg-teal-100 text-teal-700' :
                          t.operation.startsWith('GET') ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {t.operation}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Metadata note */}
            {metadata && (
              <p className="mt-2 text-[10px] text-slate-400 italic">{metadata}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Architecture;
