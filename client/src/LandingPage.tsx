import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Cake, Cookie, Croissant, Candy, Truck, ShieldCheck, CreditCard } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="flex min-h-[90vh] items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-2 font-[var(--font-script)] text-2xl text-foreground/80">
              Pastelería Boutique
            </p>
            <h1 className="font-[var(--font-titles)] text-5xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Inquieta Dulzura
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/70">
              Endulzando momentos, creando recuerdos. Descubre nuestra selección de piezas únicas
              hechas con amor.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/catalogo">
                <Button size="lg" className="bg-brand-violet text-white hover:bg-brand-violet/90">
                  Ver Catálogo
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button variant="outline" size="lg">
                    Únete a nosotros
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-2xl">
            <img
              src="/hero_pastel_cake.png"
              alt="Luxury Pastel Cake"
              className="w-full transition-transform duration-1000 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-card py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-[var(--font-titles)] mb-16 text-center text-4xl font-bold uppercase tracking-[6px] text-foreground sm:text-5xl">
            Nuestras Especialidades
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tortas */}
            <div className="group cursor-pointer text-center transition-transform duration-500 hover:-translate-y-5">
              <div className="mx-auto mb-6 flex h-80 w-full items-center justify-center rounded-2xl bg-brand-primary transition-all duration-500 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:bg-brand-primary/30">
                <Cake className="size-20 text-foreground/60" />
              </div>
              <h3 className="font-[var(--font-titles)] text-sm font-bold uppercase tracking-[3px] text-foreground">
                Tortas
              </h3>
            </div>
            {/* Panes */}
            <div className="group cursor-pointer text-center transition-transform duration-500 hover:-translate-y-5">
              <div className="mx-auto mb-6 flex h-80 w-full items-center justify-center rounded-2xl bg-brand-secondary transition-all duration-500 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:bg-brand-secondary/30">
                <Croissant className="size-20 text-foreground/60" />
              </div>
              <h3 className="font-[var(--font-titles)] text-sm font-bold uppercase tracking-[3px] text-foreground">
                Panes
              </h3>
            </div>
            {/* Cookies */}
            <div className="group cursor-pointer text-center transition-transform duration-500 hover:-translate-y-5">
              <div className="mx-auto mb-6 flex h-80 w-full items-center justify-center rounded-2xl bg-brand-accent transition-all duration-500 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:bg-brand-accent/30">
                <Cookie className="size-20 text-foreground/60" />
              </div>
              <h3 className="font-[var(--font-titles)] text-sm font-bold uppercase tracking-[3px] text-foreground">
                Cookies
              </h3>
            </div>
            {/* Postres */}
            <div className="group cursor-pointer text-center transition-transform duration-500 hover:-translate-y-5">
              <div className="mx-auto mb-6 flex h-80 w-full items-center justify-center rounded-2xl bg-brand-highlight transition-all duration-500 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:bg-brand-highlight/30">
                <Candy className="size-20 text-foreground/60" />
              </div>
              <h3 className="font-[var(--font-titles)] text-sm font-bold uppercase tracking-[3px] text-foreground">
                Postres
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-brand-dark py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="flex items-center gap-6 border-b border-white/10 pb-8 last:border-none lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <Truck className="size-12 shrink-0" />
            <div>
              <h4 className="font-[var(--font-titles)] mb-2 text-sm font-bold uppercase tracking-[2px] text-white/40">
                Envío a Domicilio
              </h4>
              <p className="text-sm text-white/60">Llegamos a toda la zona</p>
            </div>
          </div>
          <div className="flex items-center gap-6 border-b border-white/10 pb-8 last:border-none lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
            <ShieldCheck className="size-12 shrink-0" />
            <div>
              <h4 className="font-[var(--font-titles)] mb-2 text-sm font-bold uppercase tracking-[2px] text-white/40">
                Compra Segura
              </h4>
              <p className="text-sm text-white/60">Tus datos siempre protegidos</p>
            </div>
          </div>
          <div className="flex items-center gap-6 pb-8 last:border-none lg:pb-0">
            <CreditCard className="size-12 shrink-0" />
            <div>
              <h4 className="font-[var(--font-titles)] mb-2 text-sm font-bold uppercase tracking-[2px] text-white/40">
                Medios de Pago
              </h4>
              <p className="text-sm text-white/60">Todas las tarjetas y efectivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background px-4 py-32 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-[var(--font-titles)] mb-6 text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            ¿Listo para comenzar?
          </h2>
          <p className="font-[var(--font-script)] mx-auto mb-12 max-w-2xl text-3xl text-foreground/90 sm:text-4xl">
            Únete a nuestra plataforma y gestiona tu pastelería de forma profesional
          </p>
          {!isAuthenticated && (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-brand-violet text-white hover:bg-brand-violet/90">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black px-4 pb-0 pt-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 grid max-w-7xl gap-16 lg:grid-cols-[2fr_1fr_1.5fr_1.2fr]">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <img src="/logo.svg" alt="Inquieta Dulzura" className="h-14 w-auto" />
              <h3 className="font-[var(--font-titles)] text-3xl font-bold uppercase tracking-tight">
                Inquieta Dulzura
              </h3>
            </div>
            <p className="text-base text-white/70">
              Pastelería artesanal desde 2024. Creamos momentos dulces para tus ocasiones más
              especiales.
            </p>
          </div>
          <div>
            <h4 className="font-[var(--font-titles)] mb-6 text-xs font-bold uppercase tracking-[3px] text-white/40">
              Navegación
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/catalogo"
                  className="text-sm text-white/60 no-underline transition-all hover:pl-1 hover:text-white"
                >
                  Catálogo
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-white/60 no-underline transition-all hover:pl-1 hover:text-white"
                >
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-white/60 no-underline transition-all hover:pl-1 hover:text-white"
                >
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-[var(--font-titles)] mb-6 text-xs font-bold uppercase tracking-[3px] text-white/40">
              Contacto
            </h4>
            <p className="text-sm text-white/70">📍 Villa Ramallo, Buenos Aires</p>
            <p className="text-sm text-white/70">📞 (2477) 123456</p>
            <p className="text-sm text-white/70">📧 info@inquietadulzura.com</p>
          </div>
          <div>
            <h4 className="font-[var(--font-titles)] mb-6 text-xs font-bold uppercase tracking-[3px] text-white/40">
              Horarios
            </h4>
            <p className="text-sm text-white/70">Mar a Sáb: 09:00 - 20:00</p>
            <p className="text-sm text-white/70">Dom: 09:00 - 13:00</p>
            <p className="text-sm text-white/70">Lun: Cerrado</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center">
          <p className="text-xs tracking-[1px] text-white/30">
            &copy; 2024 Inquieta Dulzura. Todos los derechos reservados. | Diseñado con ❤️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
