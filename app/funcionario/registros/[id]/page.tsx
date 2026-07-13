'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { estadoBadge } from '@/components/ui/Badge';
import { Registro } from '@/lib/types';
import { downloadFile } from '@/lib/download';

export default function FuncionarioRegistroDetallePage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token } = useGlobal();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [registro, setRegistro] = useState<Registro | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  // Expediente form
  const [showForm, setShowForm] = useState(false);
  const [tipoExpediente, setTipoExpediente] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

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

  const handleDownload = async (s3Key: string, nombre: string) => {
    if (!token) return;
    setDownloadError('');
    setDownloadingKey(s3Key);
    try {
      await downloadFile(
        `/api/registros/${id}/adjuntos/download?key=${encodeURIComponent(s3Key)}`,
        token,
        nombre
      );
    } catch (e: unknown) {
      setDownloadError(e instanceof Error ? e.message : 'Error al descargar el archivo');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleCrearExpediente = async (e: FormEvent) => {
    e.preventDefault();
    if (!tipoExpediente.trim()) {
      setFormError('El tipo de expediente es obligatorio');
      return;
    }

    setCreating(true);
    setFormError('');

    try {
      const res = await fetch('/api/expedientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registroId: id, tipoExpediente }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/funcionario/expedientes/${String(data._id)}`);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error al crear el expediente');
    } finally {
      setCreating(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !registro) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-6">
          <Link
            href="/funcionario/registros"
            className="text-xs text-[--muted] hover:text-[--accent] transition-colors"
          >
            ← Volver a registros
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[--accent] font-semibold">{registro.numero}</span>
          {estadoBadge(registro.estado)}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <Card>
            <CardHeader title="Datos del solicitante" />
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="text-[--muted] w-36 shrink-0">Nombre:</dt>
                <dd>{registro.nombreSolicitante}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-[--muted] w-36 shrink-0">Dirección fiscal:</dt>
                <dd>{registro.direccionFiscal}</dd>
              </div>
              {registro.nombreRepresentante && (
                <div className="flex gap-2">
                  <dt className="text-[--muted] w-36 shrink-0">Representante:</dt>
                  <dd>{registro.nombreRepresentante}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-[--muted] w-36 shrink-0">Fecha entrada:</dt>
                <dd>{new Date(registro.fechaEntrada).toLocaleString('es-ES')}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Expone" />
            <p className="text-sm text-[--foreground] whitespace-pre-wrap leading-relaxed">{registro.expone}</p>
          </Card>

          <Card>
            <CardHeader title="Solicita" />
            <p className="text-sm text-[--foreground] whitespace-pre-wrap leading-relaxed">{registro.solicita}</p>
          </Card>

          {registro.adjuntos?.length > 0 && (
            <Card>
              <CardHeader title="Adjuntos" />
              {downloadError && (
                <p className="text-xs text-red-400 mb-2">{downloadError}</p>
              )}
              <ul className="space-y-1">
                {registro.adjuntos.map((a) => (
                  <li key={a.s3Key} className="text-sm flex items-center gap-2">
                    <span className="text-[--muted]">📎</span>
                    <span className="flex-1 truncate">{a.nombre}</span>
                    <span className="text-[--muted] text-xs">({(a.tamaño / 1024).toFixed(0)} KB)</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={downloadingKey === a.s3Key}
                      onClick={() => handleDownload(a.s3Key, a.nombre)}
                    >
                      Descargar
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Create expediente */}
        {registro.estado === 'presentado' && (
          <div className="border border-[--border] rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 bg-[--surface] hover:bg-[--surface-2] transition-colors text-left"
              onClick={() => setShowForm((v) => !v)}
            >
              <span className="font-semibold text-[--foreground] text-sm">Crear expediente</span>
              <span className="text-[--muted]">{showForm ? '▲' : '▼'}</span>
            </button>
            {showForm && (
              <form onSubmit={handleCrearExpediente} className="p-5 space-y-4 bg-[--background]">
                <Input
                  label="Tipo de expediente"
                  placeholder="Ej: Licencia de obras, Reclamación, Ayuda social…"
                  value={tipoExpediente}
                  onChange={(e) => setTipoExpediente(e.target.value)}
                  error={formError}
                  required
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" loading={creating}>
                    Crear expediente
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
