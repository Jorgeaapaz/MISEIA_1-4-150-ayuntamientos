'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardHeader } from '@/components/ui/Card';
import { estadoBadge } from '@/components/ui/Badge';
import { Registro } from '@/lib/types';

export default function RegistroDetallePage() {
  const { user, loading } = useRequireAuth('administrado');
  const { token } = useGlobal();
  const params = useParams();
  const id = params?.id as string;

  const [registro, setRegistro] = useState<Registro | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/registros/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRegistro(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setFetching(false));
  }, [token, id]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-400">{error}</p>
        </main>
      </div>
    );
  }

  if (!registro) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-6">
          <Link href="/mis-registros" className="text-xs text-[--muted] hover:text-[--accent] transition-colors">
            ← Volver a mis registros
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[--accent] font-semibold">{registro.numero}</span>
          {estadoBadge(registro.estado)}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Datos del solicitante" />
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-[--muted] w-32 shrink-0">Nombre:</dt>
                <dd className="text-[--foreground]">{registro.nombreSolicitante}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[--muted] w-32 shrink-0">Dirección fiscal:</dt>
                <dd className="text-[--foreground]">{registro.direccionFiscal}</dd>
              </div>
              {registro.nombreRepresentante && (
                <div className="flex gap-2">
                  <dt className="text-[--muted] w-32 shrink-0">Representante:</dt>
                  <dd className="text-[--foreground]">{registro.nombreRepresentante}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-[--muted] w-32 shrink-0">Fecha entrada:</dt>
                <dd className="text-[--foreground]">
                  {new Date(registro.fechaEntrada).toLocaleString('es-ES')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Expone" />
            <p className="text-sm text-[--foreground] leading-relaxed whitespace-pre-wrap">
              {registro.expone}
            </p>
          </Card>

          <Card>
            <CardHeader title="Solicita" />
            <p className="text-sm text-[--foreground] leading-relaxed whitespace-pre-wrap">
              {registro.solicita}
            </p>
          </Card>

          {registro.adjuntos?.length > 0 && (
            <Card>
              <CardHeader title="Documentación adjunta" />
              <ul className="space-y-2">
                {registro.adjuntos.map((adj) => (
                  <li
                    key={adj.s3Key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-[--muted]">📎</span>
                    <span className="text-[--foreground]">{adj.nombre}</span>
                    <span className="text-[--muted] text-xs">({(adj.tamaño / 1024).toFixed(0)} KB)</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
