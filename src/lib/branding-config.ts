// Configuración de branding personalizable con variables de entorno

// Función helper para obtener variables de entorno con fallbacks seguros
const getEnvVar = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  return (value && value.trim() !== '') ? value : fallback;
};

export const BRANDING_CONFIG = {
  // Información de la empresa/aplicación con fallbacks seguros
  APP_NAME: getEnvVar('VITE_APP_NAME', 'IA CRM'),
  APP_DESCRIPTION: getEnvVar('VITE_APP_DESCRIPTION', 'Panel Corporativo'),
  COMPANY_NAME: getEnvVar('VITE_COMPANY_NAME', 'IA CRM'),
  APP_LOGO_URL: getEnvVar('VITE_APP_LOGO_URL', '/logo.png'),
  
  // Propiedades alias para compatibilidad
  get appName() { return this.APP_NAME; },
  get appDescription() { return this.APP_DESCRIPTION; },
  get companyName() { return this.COMPANY_NAME; },
  get logoUrl() { return this.APP_LOGO_URL; },
  
  // Obtener inicial de la empresa de forma segura
  getCompanyInitial: () => {
    const name = BRANDING_CONFIG.COMPANY_NAME;
    return (name && name.length > 0) ? name.charAt(0).toUpperCase() : 'IA';
  },
  
  // Metadatos del documento
  getPageTitle: (pageTitle?: string) => {
    const base = BRANDING_CONFIG.APP_NAME;
    return pageTitle ? `${pageTitle} - ${base}` : base;
  },
  
  // Copyright
  getCopyrightText: () => {
    const year = new Date().getFullYear();
    return `© ${year} ${BRANDING_CONFIG.COMPANY_NAME}. Todos los derechos reservados.`;
  }
};

export default BRANDING_CONFIG;