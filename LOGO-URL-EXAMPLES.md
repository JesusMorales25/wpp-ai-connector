# 🖼️ Ejemplos Prácticos de URLs de Logos

## URLs de Logos Reales para Testing

### 1. Logos de Ejemplo (Para pruebas)
```bash
# Logo corporativo genérico
VITE_APP_LOGO_URL=https://via.placeholder.com/512x512/2563eb/ffffff?text=LOGO

# Logo de ejemplo con transparencia
VITE_APP_LOGO_URL=https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/react.svg

# Logo de empresa ejemplo
VITE_APP_LOGO_URL=https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=512&h=512&fit=crop&crop=center
```

### 2. Servicios CDN Recomendados

#### 🔵 Cloudinary (Recomendado)
```bash
# Ejemplo de URL de Cloudinary
VITE_APP_LOGO_URL=https://res.cloudinary.com/tu-cuenta/image/upload/v1234567890/logo-empresa.png

# Con transformaciones automáticas
VITE_APP_LOGO_URL=https://res.cloudinary.com/tu-cuenta/image/upload/w_512,h_512,c_fit/logo-empresa.png
```

#### 🟠 Amazon S3 + CloudFront
```bash
VITE_APP_LOGO_URL=https://d1234567890.cloudfront.net/assets/logo-empresa.png
```

#### 🟢 Google Cloud Storage
```bash
VITE_APP_LOGO_URL=https://storage.googleapis.com/tu-bucket/logos/logo-empresa.png
```

#### 🟣 GitHub (Para proyectos open source)
```bash
VITE_APP_LOGO_URL=https://raw.githubusercontent.com/tu-usuario/tu-repo/main/assets/logo.png
```

### 3. Configuraciones por Industria

#### 🏢 Empresa Corporativa
```bash
VITE_APP_NAME=Corporación XYZ
VITE_APP_DESCRIPTION=Soluciones Empresariales
VITE_COMPANY_NAME=Corporación XYZ
VITE_APP_LOGO_URL=https://cdn.corporacion-xyz.com/branding/logo-corporativo.svg
```

#### 🛒 E-commerce
```bash
VITE_APP_NAME=TiendaOnline Pro
VITE_APP_DESCRIPTION=Gestión de Ventas Online
VITE_COMPANY_NAME=TiendaOnline
VITE_APP_LOGO_URL=https://static.tiendaonline.com/assets/logo-cart.png
```

#### 💼 Consultora
```bash
VITE_APP_NAME=Consultoría Digital
VITE_APP_DESCRIPTION=Transformación Digital
VITE_COMPANY_NAME=Digital Consulting
VITE_APP_LOGO_URL=https://assets.digitalconsulting.com/brand/logo-principal.svg
```

## 🔧 Configuración Técnica

### Formato de URLs Soportados
- ✅ `https://` (HTTPS obligatorio)
- ✅ `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`
- ✅ URLs con parámetros (`?w=512&h=512`)
- ✅ URLs de CDN con transformaciones

### Características Automáticas
- **Fallback**: Si la URL falla, muestra inicial de empresa
- **Responsive**: Se adapta automáticamente a diferentes tamaños
- **Caché**: El navegador cachea las imágenes automáticamente
- **Lazy loading**: Carga eficiente de recursos

### Testing de URLs
```javascript
// En la consola del navegador para probar URLs
window.BRANDING_CONFIG.logoUrl
// Resultado: tu URL configurada

// Probar si una imagen carga correctamente
const testImg = new Image();
testImg.onload = () => console.log('✅ Logo carga correctamente');
testImg.onerror = () => console.log('❌ Error al cargar logo');
testImg.src = 'https://tu-logo-url.com/logo.png';
```

## 🚀 Para Deploy Inmediato

### Variables Listas para Vercel
```bash
VITE_APP_NAME=Mi Empresa CRM
VITE_APP_DESCRIPTION=Panel de Gestión Empresarial
VITE_COMPANY_NAME=Mi Empresa
VITE_APP_LOGO_URL=https://tu-cdn.com/logo-empresa.png
```

Solo cambia `https://tu-cdn.com/logo-empresa.png` por la URL real de tu logo y ¡listo para deploy! 🎉