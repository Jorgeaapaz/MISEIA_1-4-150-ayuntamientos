'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { estadoBadge } from '@/components/ui/Badge';
import { Registro } from '@/lib/types';

export default function MisRegistrosPage() {
  const { user, loading } = useRequireAuth('administrado');
  const { token } = useGlobal();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/registros', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRegistros(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setFetching(false));
  }, [token]);

  if (loading || fetching) {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[--foreground]">Mis registros</h1>
            <p className="text-sm text-[--muted] mt-1">
              {registros.length} {registros.length === 1 ? 'instancia presentada' : 'instancias presentadas'}
            </p>
          </div>
          <Link href="/instancia/nueva">
            <Button size="sm">+ Nueva instancia</Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {registros.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[--border] rounded-xl">
            <p className="text-[--muted] text-sm mb-4">Aún no has presentado ninguna instancia.</p>
            <Link href="/instancia/nueva">
              <Button>Presentar primera instancia</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((reg) => (
              <Link key={String(reg._id)} href={`/mis-registros/${String(reg._id)}`}>
                <Card hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[--accent]">{reg.numero}</span>
                        {estadoBadge(reg.estado)}
                      </div>
                      <p className="text-sm font-medium text-[--foreground] truncate">
                        {reg.nombreSolicitante}
                      </p>
                      <p className="text-xs text-[--muted] mt-0.5 line-clamp-2">{reg.solicita}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[--muted]">
                        {new Date(reg.fechaEntrada).toLocaleDateString('es-ES')}
                      </p>
                      {reg.adjuntos?.length > 0 && (
                        <p className="text-xs text-[--muted] mt-0.5">
                          📎 {reg.adjuntos.length} adj.
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
