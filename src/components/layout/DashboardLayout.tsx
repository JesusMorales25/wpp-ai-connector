import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SessionIndicator } from '@/components/SessionIndicator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  BarChart3, 
  Users, 
  Send, 
  Radio,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  Activity,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRANDING_CONFIG } from '@/lib/branding-config';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentSection?: string;
  onSectionChange?: (section: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentSection = 'whatsapp',
  onSectionChange 
}) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  // Configuración de navegación por rol
  const navigationItems = [
    {
      id: 'whatsapp',
      label: 'Conexión WhatsApp',
      icon: Phone,
      href: '/whatsapp',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      id: 'messages',
      label: 'Mensajería',
      icon: Send,
      href: '/messages',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      id: 'broadcast',
      label: 'Difusión Masiva',
      icon: Radio,
      href: '/broadcast',
      roles: ['ADMIN', 'SUPERADMIN']
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      href: '/leads',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      id: 'conversations',
      label: 'Conversaciones',
      icon: MessageCircle,
      href: '/conversations',
      roles: ['USER', 'ADMIN', 'SUPERADMIN']
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: BarChart3,
      href: '/reports',
      roles: ['ADMIN', 'SUPERADMIN']
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      href: '/settings',
      roles: ['ADMIN', 'SUPERADMIN']
    }
  ];

  // Filtrar items por rol del usuario
  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(user?.role || 'USER')
  );

  const handleSectionChange = (sectionId: string) => {
    onSectionChange?.(sectionId);
    setSidebarOpen(false); // Cerrar sidebar en mobile
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'bg-red-100 text-red-800';
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-card border-r border-border shadow-elegant transition-transform duration-300 ease-in-out",
        "w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-elegant">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">{BRANDING_CONFIG.appName}</h2>
                <p className="text-xs text-muted-foreground">
                  {BRANDING_CONFIG.appDescription}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {getUserInitials(user?.username || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {user?.username}
              </p>
              <Badge className={cn("text-xs", getRoleBadgeColor(user?.role || 'USER'))}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <li key={item.id}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-all",
                      isActive 
                        ? "bg-gradient-primary text-primary-foreground shadow-elegant" 
                        : "hover:bg-secondary"
                    )}
                    onClick={() => handleSectionChange(item.id)}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Activity className="w-3 h-3" />
            <span>Estado: Conectado</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-30 shadow-elegant">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {allowedItems.find(item => item.id === currentSection)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Empresa: {user?.empresaId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Center - Session Status */}
              <div className="flex-1 flex justify-center">
                <SessionIndicator />
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(user?.username || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2 hidden md:inline">
                      {user?.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSectionChange('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Popup de confirmación para cerrar sesión */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5 text-destructive" />
              Cerrar Sesión
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardLayout;