'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Expediente } from '@/lib/types';

export default function FuncionarioExpedientesPage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token } = useGlobal();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function markResuelto(e: React.MouseEvent, registroId: string) {
    e.preventDefault();
    if (!token || resolvedIds.has(registroId)) return;
    setResolvingId(registroId);
    try {
      const res = await fetch(`/api/registros/${registroId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'resuelto' }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al actualizar el estado');
      } else {
        setResolvedIds((prev) => new Set(prev).add(registroId));
      }
    } catch {
      setError('Error de red al actualizar el estado');
    } finally {
      setResolvingId(null);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetch('/api/expedientes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setExpedientes(data);
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[--foreground]">Expedientes</h1>
          <p className="text-sm text-[--muted] mt-1">{expedientes.length} expedientes en total</p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {expedientes.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[--border] rounded-xl">
            <p className="text-[--muted] text-sm mb-2">No hay expedientes creados.</p>
            <p className="text-xs text-[--muted]">
              Crea expedientes desde la vista de detalle de un registro.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {expedientes.map((exp) => {
              const registroId = String(exp.registroId);
              const isResolved = resolvedIds.has(registroId);
              const isResolving = resolvingId === registroId;
              return (
                <div key={String(exp._id)} className="relative">
                  <Link href={`/funcionario/expedientes/${String(exp._id)}`}>
                    <Card hover>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-[--accent]">{exp.codigo}</span>
                            <span className="text-xs text-[--muted] bg-[--surface-2] px-2 py-0.5 rounded border border-[--border]">
                              {exp.tipoExpediente}
                            </span>
                          </div>
                          <p className="text-xs text-[--muted]">
                            {exp.actuaciones?.length || 0} actuaciones
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className="text-xs text-[--muted]">
                            {new Date(exp.fechaCreacion).toLocaleDateString('es-ES')}
                          </p>
                          <button
                            onClick={(e) => markResuelto(e, registroId)}
                            disabled={isResolved || isResolving}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                              isResolved
                                ? 'bg-green-700/40 text-green-300 cursor-default'
                                : 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                            }`}
                          >
                            {isResolving ? '...' : isResolved ? '✓ Resuelto' : 'Marcar resuelto'}
                          </button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
