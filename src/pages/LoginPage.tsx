import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, User, Building2, Shield, Zap, Users } from 'lucide-react';
import { z } from 'zod';
import { BRANDING_CONFIG } from '@/lib/branding-config';

// Esquema de validación
const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validar formulario
      loginSchema.parse({ username, password });

      // Intentar login
      await login({ username, password });
      
      // Redireccionar al dashboard después del login exitoso
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : 'Error de autenticación');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex">
      {/* Left Section - Corporate Image */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content - Centrado */}
        <div className="relative flex flex-col justify-center items-center text-white p-12 z-10 w-full">
          <div className="text-center space-y-8 max-w-lg mx-auto">
            <div className="space-y-6">
              <Building2 className="w-24 h-24 mx-auto text-white/90" />
              <div className="space-y-4">
                <h2 className="text-4xl font-bold leading-tight text-center">
                  Gestión Empresarial
                  <span className="block text-2xl font-medium text-blue-200 mt-3">
                    Nueva Generación
                  </span>
                </h2>
                <p className="text-lg text-blue-100 leading-relaxed text-center mx-auto max-w-md">
                  Conecta, automatiza y gestiona tu comunicación empresarial con 
                  inteligencia artificial avanzada y herramientas corporativas integradas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-8 text-center">
              <div className="flex items-center justify-center space-x-3 text-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span>WhatsApp Business API integrado</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span>Automatización con IA corporativa</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span>Panel de métricas y análisis avanzado</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-300"></div>
                <span>Gestión de leads y conversaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-blue-300/20 blur-2xl"></div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Company Logo and Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl font-bold shadow-lg">
              {BRANDING_CONFIG.getCompanyInitial()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{BRANDING_CONFIG.appName}</h1>
              <p className="text-gray-600 mt-1">{BRANDING_CONFIG.appDescription}</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-gray-600">
                Accede a tu panel corporativo
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Usuario
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ingresa tu usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading || !username || !password}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>

              <div className="text-center pt-4">
                <p className="text-xs text-gray-500">
                  ¿No tienes una cuenta? Contacta a tu administrador
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-6 text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4" />
                <span className="text-xs">Rápido</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">Confiable</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {BRANDING_CONFIG.getCopyrightText()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;