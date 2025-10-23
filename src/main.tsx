import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeDocumentBranding } from "@/utils/update-document-title";

// Importar utilidades de debugging en desarrollo
if (import.meta.env.DEV) {
  import("@/utils/test-branding");
}

// Inicializar configuración de branding del documento
initializeDocumentBranding();

createRoot(document.getElementById("root")!).render(<App />);
