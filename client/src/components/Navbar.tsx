import * as React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeProvider';
import {
  Menu,
  LayoutDashboard,
  Package,
  BookOpen,
  Wheat,
  ShoppingCart,
  Image,
  Tags,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/inventario', label: 'Inventario', icon: Package },
        { to: '/recetas', label: 'Recetas', icon: BookOpen },
        { to: '/ingredientes', label: 'Ingredientes', icon: Wheat },
        { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
        { to: '/contenido-digital', label: 'Contenido Digital', icon: Image },
      ]
    : [{ to: '/catalogo', label: 'Catálogo', icon: Tags }];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border/40 bg-accent/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-violet px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white no-underline transition-opacity hover:opacity-90"
        >
          <img src="/logo.svg" alt="" className="h-6 w-auto rounded" />
          <span className="hidden sm:inline">Inquieta Dulzura</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = link.to === '/' ? pathname === '/' : pathname.startsWith(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide no-underline transition-colors',
                    isActive
                      ? 'bg-brand-violet text-white'
                      : 'text-brand-violet hover:bg-brand-violet hover:text-white',
                  )}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Auth & Theme (Desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-brand-violet">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 fill-brand-violet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                {user.nombre}
              </span>
              {user.rol === 'admin' && (
                <span className="inline-block rounded-full bg-brand-violet px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Admin
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span className="sr-only">Salir</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-brand-violet px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-violet no-underline transition-colors hover:bg-brand-violet hover:text-white"
              >
                <LogIn className="size-4" />
                Ingresar
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-violet px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white no-underline transition-colors hover:bg-black"
              >
                <UserPlus className="size-4" />
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">Inquieta Dulzura</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pt-4">
                {navLinks.map((link) => {
                  const isActive =
                    link.to === '/' ? pathname === '/' : pathname.startsWith(link.to);
                  return (
                    <SheetClose key={link.to} asChild>
                      <Link
                        to={link.to}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
                          isActive
                            ? 'bg-brand-violet text-white'
                            : 'text-foreground hover:bg-muted',
                        )}
                      >
                        <link.icon
                          className={cn('size-5', isActive ? 'text-white' : 'text-brand-violet')}
                        />
                        {link.label}
                      </Link>
                    </SheetClose>
                  );
                })}
                <hr className="my-3 border-border" />
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive no-underline transition-colors hover:bg-muted"
                  >
                    <LogOut className="size-5" />
                    Salir
                  </button>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        to="/login"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted"
                      >
                        <LogIn className="size-5" />
                        Ingresar
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/register"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted"
                      >
                        <UserPlus className="size-5" />
                        Registrarse
                      </Link>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
