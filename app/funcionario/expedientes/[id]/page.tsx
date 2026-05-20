'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Expediente } from '@/lib/types';

export default function FuncionarioExpedienteDetallePage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token } = useGlobal();
  const params = useParams();
  const id = params?.id as string;

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchExpediente = () => {
    if (!token || !id) return;
    fetch(`/api/expedientes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setExpediente(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setFetching(false));
  };

  useEffect(fetchExpediente, [token, id]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !expediente) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-6">
          <Link
            href="/funcionario/expedientes"
            className="text-xs text-[--muted] hover:text-[--accent] transition-colors"
          >
            ← Volver a expedientes
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-[--accent] font-semibold">{expediente.codigo}</span>
          <span className="text-xs text-[--muted] bg-[--surface-2] px-2 py-0.5 rounded border border-[--border]">
            {expediente.tipoExpediente}
          </span>
        </div>
        <p className="text-xs text-[--muted] mb-6">
          Creado el {new Date(expediente.fechaCreacion).toLocaleString('es-ES')}
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        {/* Actuaciones */}
        <Card className="mb-4">
          <CardHeader
            title="Actuaciones"
            description={`${expediente.actuaciones?.length || 0} actuaciones registradas`}
            action={
              <Link href={`/funcionario/expedientes/${id}/actuacion`}>
                <Button size="sm">+ Añadir</Button>
              </Link>
            }
          />

          {(!expediente.actuaciones || expediente.actuaciones.length === 0) ? (
            <p className="text-sm text-[--muted] text-center py-6">
              No hay actuaciones registradas aún.
            </p>
          ) : (
            <div className="space-y-3">
              {[...expediente.actuaciones].reverse().map((act) => (
                <div
                  key={String(act._id)}
                  className="border border-[--border] rounded-lg p-3 bg-[--surface-2]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[--muted]">
                      {new Date(act.fecha).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm text-[--foreground] whitespace-pre-wrap">{act.texto}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-[--muted] w-28 shrink-0">Registro origen:</dt>
              <dd>
                <Link
                  href={`/funcionario/registros/${String(expediente.registroId)}`}
                  className="text-[--accent] hover:underline font-mono text-xs"
                >
                  Ver registro →
                </Link>
              </dd>
            </div>
          </dl>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
