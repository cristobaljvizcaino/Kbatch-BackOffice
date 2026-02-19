export enum View {
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  IMPORT_PORTAL = 'IMPORT_PORTAL',
  EXPORT_PORTAL = 'EXPORT_PORTAL',
  CONFIGURATION = 'CONFIGURATION',
  ARCHITECTURE = 'ARCHITECTURE'
}

export interface NavItem {
  id: View;
  label: string;
  icon: any; // Using Lucide icons
}
