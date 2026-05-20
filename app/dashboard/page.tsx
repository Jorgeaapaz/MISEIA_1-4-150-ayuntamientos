'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth('administrado');
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[--foreground]">
            Bienvenido, {user.name || user.email}
          </h1>
          <p className="text-sm text-[--muted] mt-1">
            Gestiona tus trámites desde aquí.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/instancia/nueva">
            <Card hover className="h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[--accent-muted] flex items-center justify-center text-[--accent] text-xl">
                  📋
                </div>
                <div>
                  <h3 className="font-semibold text-[--foreground]">Nueva instancia</h3>
                  <p className="text-sm text-[--muted] mt-0.5">
                    Presenta una solicitud o instancia general ante la administración.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/mis-registros">
            <Card hover className="h-full">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[--accent-muted] flex items-center justify-center text-[--accent] text-xl">
                  🗂️
                </div>
                <div>
                  <h3 className="font-semibold text-[--foreground]">Mis registros</h3>
                  <p className="text-sm text-[--muted] mt-0.5">
                    Consulta el estado de tus instancias y solicitudes presentadas.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
