# Sistema de Branding Configurável

Este proyecto incluye un sistema de branding configurável que permite personalizar la aplicación para diferentes clientes o implementaciones.

## Variables de Entorno

### Variables de Branding

```bash
# Nombre de la aplicación
VITE_APP_NAME="IA CRM"

# Descripción de la aplicación
VITE_APP_DESCRIPTION="Sistema de Gestión Empresarial"

# Nombre de la empresa/cliente
VITE_COMPANY_NAME="IA CRM"

# URL del logo personalizado (opcional)
VITE_APP_LOGO_URL="/logo.png"
```

## Configuración para Diferentes Entornos

### Para Vercel

Configurar en el panel de Vercel (Project Settings → Environment Variables):

```bash
VITE_APP_NAME = "Mi Empresa CRM"
VITE_APP_DESCRIPTION = "Panel de Gestión Corporativa"
VITE_COMPANY_NAME = "Mi Empresa"
VITE_APP_LOGO_URL = "https://miempresa.com/logo.png"
```

### Para Railway

Configurar en el panel de Railway (Variables tab):

```bash
VITE_APP_NAME="CRM Corporativo"
VITE_APP_DESCRIPTION="Sistema de Automatización"
VITE_COMPANY_NAME="Corporación XYZ"
VITE_APP_LOGO_URL="https://cdn.ejemplo.com/logo-corporativo.png"
```

### Para Docker

Crear archivo `.env` específico:

```bash
# Archivo .env.production
VITE_APP_NAME="WhatsApp Business AI"
VITE_APP_DESCRIPTION="Automatización Empresarial"
VITE_COMPANY_NAME="TechSolutions"
VITE_APP_LOGO_URL="/assets/logo-tech.png"
```

## Uso en el Código

```typescript
import { BRANDING_CONFIG } from '@/lib/branding-config';

// Obtener configuraciones
const appName = BRANDING_CONFIG.APP_NAME;
const description = BRANDING_CONFIG.APP_DESCRIPTION;
const companyName = BRANDING_CONFIG.COMPANY_NAME;

// Obtener título de página dinámico
const pageTitle = BRANDING_CONFIG.getPageTitle('Dashboard');
// Resultado: "Dashboard - IA CRM"

// Obtener texto de copyright
const copyright = BRANDING_CONFIG.getCopyrightText();
// Resultado: "© 2024 IA CRM. Todos los derechos reservados."
```

## Ejemplos de Personalización

### Cliente 1: Empresa de Marketing
```bash
VITE_APP_NAME="Marketing Pro AI"
VITE_APP_DESCRIPTION="Automatización de WhatsApp para Marketing"
VITE_COMPANY_NAME="MarketingCorp"
VITE_APP_LOGO_URL="https://marketingcorp.com/logo.png"
```

### Cliente 2: E-commerce
```bash
VITE_APP_NAME="Shop Connect"
VITE_APP_DESCRIPTION="Gestión de Clientes E-commerce"
VITE_COMPANY_NAME="ShopTech Solutions"
VITE_APP_LOGO_URL="/assets/shop-logo.svg"
```

### Cliente 3: Servicios Profesionales
```bash
VITE_APP_NAME="Pro Services CRM"
VITE_APP_DESCRIPTION="Panel de Gestión Profesional"
VITE_COMPANY_NAME="Professional Services Inc"
VITE_APP_LOGO_URL="https://cdn.proservices.com/brand/logo.png"
```

## Características del Sistema

- ✅ **Título dinámico del navegador**: Se actualiza según la página actual
- ✅ **Meta tags personalizados**: SEO optimizado por cliente
- ✅ **Logo personalizable**: Soporte completo para URLs externas
- ✅ **Copyright automático**: Año y empresa dinámicos
- ✅ **Fallbacks seguros**: Valores por defecto si faltan variables
- ✅ **TypeScript**: Completamente tipado y seguro

## 🖼️ Configuración Avanzada de Logos

### URLs Externas (RECOMENDADO para Deploy)
```bash
# CDN personalizado
VITE_APP_LOGO_URL=https://cdn.miempresa.com/logo-principal.png

# Desde tu sitio web
VITE_APP_LOGO_URL=https://miempresa.com/assets/logo-corporativo.svg

# Servicios de hosting de imágenes
VITE_APP_LOGO_URL=https://images.miempresa.com/branding/logo-v3.png
```

### ✅ Mejores Prácticas para Logos
1. **Formato**: PNG con transparencia o SVG (recomendado)
2. **Tamaño**: 512x512px o mayor para mejor calidad
3. **CDN**: Usar URLs de CDN para mejor rendimiento
4. **HTTPS**: Siempre usar URLs seguras (obligatorio)
5. **Fallback**: Sistema automático si la URL falla

### 🔄 Funcionalidades Automáticas
- **Error handling**: Fallback automático a inicial de empresa si la imagen falla
- **Responsive**: Se adapta automáticamente a diferentes tamaños (sidebar, login, etc.)
- **Optimización**: Carga lazy y manejo eficiente de recursos
- **Cross-platform**: Compatible con Vercel, Railway, y otros servicios

## Beneficios

1. **White-label ready**: Fácil personalización para reventa
2. **Multi-tenant**: Misma base de código, diferentes marcas
3. **SEO optimizado**: Meta tags personalizados por cliente
4. **Logo dinámico**: URLs externas sin necesidad de subir archivos
5. **Mantenimiento simplificado**: Un solo codebase
6. **Deploy flexible**: Variables de entorno en cualquier plataforma