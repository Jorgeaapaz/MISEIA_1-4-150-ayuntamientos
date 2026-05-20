'use client';

import Link from 'next/link';
import { useGlobal } from '@/context/GlobalContext';
import { useSede } from '@/hooks/useSede';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { user, loading } = useGlobal();
  const { configSede } = useSede();

  const accent = configSede?.colorAccent || '#3B82F6';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative overflow-hidden flex-1 flex items-center">
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(${accent}40 1px, transparent 1px), linear-gradient(90deg, ${accent}40 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 blur-3xl rounded-full pointer-events-none"
            style={{ background: accent }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[--border] bg-[--surface] text-xs text-[--muted] mb-8">
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: accent }}
              />
              Administración Electrónica · Acceso 24/7
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[--foreground] mb-6 leading-[1.1]">
              {configSede?.nombreAyuntamiento || 'Sede Electrónica'}
            </h1>

            <p className="text-lg text-[--muted] max-w-2xl mx-auto mb-10 leading-relaxed">
              {configSede?.bienvenida ||
                'Realice sus trámites administrativos de forma telemática, segura y disponible las 24 horas.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {!loading && !user && (
                <Link href="/login">
                  <Button size="lg">Acceder a la sede</Button>
                </Link>
              )}
              {user?.role === 'administrado' && (
                <>
                  <Link href="/instancia/nueva">
                    <Button size="lg">Nueva instancia</Button>
                  </Link>
                  <Link href="/mis-registros">
                    <Button size="lg" variant="secondary">Mis registros</Button>
                  </Link>
                </>
              )}
              {user?.role === 'funcionario' && (
                <>
                  <Link href="/funcionario/registros">
                    <Button size="lg">Ver registros</Button>
                  </Link>
                  <Link href="/funcionario/expedientes">
                    <Button size="lg" variant="secondary">Expedientes</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[--border] bg-[--surface]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: '📋',
                  title: 'Instancia General',
                  desc: 'Presente solicitudes y documentos ante la administración de forma electrónica.',
                },
                {
                  icon: '🔍',
                  title: 'Seguimiento',
                  desc: 'Consulte el estado de sus trámites y expedientes en tiempo real.',
                },
                {
                  icon: '🔒',
                  title: 'Acceso Seguro',
                  desc: 'Autenticación mediante enlace mágico enviado a su correo electrónico.',
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-5 rounded-xl border border-[--border] bg-[--background] hover:border-[--accent]/30 transition-colors"
                >
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-[--foreground] mb-1">{f.title}</h3>
                  <p className="text-sm text-[--muted]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
