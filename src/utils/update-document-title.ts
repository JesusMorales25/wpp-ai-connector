import { BRANDING_CONFIG } from '@/lib/branding-config';

/**
 * Actualiza dinámicamente el título del documento HTML
 * basado en la página actual y la configuración de branding
 */
export const updateDocumentTitle = (pageTitle?: string) => {
  const baseTitle = BRANDING_CONFIG.getPageTitle(pageTitle);
  document.title = baseTitle;
};

/**
 * Actualiza las meta tags del documento HTML
 * basado en la configuración de branding
 */
export const updateDocumentMeta = () => {
  // Actualizar meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', `${BRANDING_CONFIG.APP_DESCRIPTION}. Sistema de gestión empresarial con automatización.`);
  }

  // Actualizar Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', BRANDING_CONFIG.getPageTitle());
  }

  // Actualizar Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', BRANDING_CONFIG.APP_DESCRIPTION);
  }

  // Actualizar favicon si se especifica un logo personalizado
  if (BRANDING_CONFIG.APP_LOGO_URL && BRANDING_CONFIG.APP_LOGO_URL !== '/logo.png') {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = BRANDING_CONFIG.APP_LOGO_URL;
    }
  }
};

/**
 * Inicializa las configuraciones del documento HTML
 * Debe ser llamado al cargar la aplicación
 */
export const initializeDocumentBranding = () => {
  updateDocumentTitle();
  updateDocumentMeta();
};