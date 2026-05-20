'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Adjunto } from '@/lib/types';

export default function NuevaInstanciaPage() {
  const { user, loading } = useRequireAuth('administrado');
  const { token } = useGlobal();
  const router = useRouter();

  const [form, setForm] = useState({
    nombreSolicitante: '',
    direccionFiscal: '',
    nombreRepresentante: '',
    expone: '',
    solicita: '',
  });
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const newAdjuntos: Adjunto[] = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (res.ok) {
        const adjunto: Adjunto = await res.json();
        newAdjuntos.push(adjunto);
      }
    }

    setAdjuntos((prev) => [...prev, ...newAdjuntos]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeAdjunto = (s3Key: string) => {
    setAdjuntos((prev) => prev.filter((a) => a.s3Key !== s3Key));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nombreSolicitante.trim()) errs.nombreSolicitante = 'Campo obligatorio';
    if (!form.direccionFiscal.trim()) errs.direccionFiscal = 'Campo obligatorio';
    if (!form.expone.trim()) errs.expone = 'Campo obligatorio';
    if (!form.solicita.trim()) errs.solicita = 'Campo obligatorio';
    return errs;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch('/api/registros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, adjuntos }),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || 'Error al presentar la instancia');
      } else {
        router.push('/mis-registros');
      }
    } catch {
      setApiError('Error de conexión. Inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-8">
          <a href="/dashboard" className="text-xs text-[--muted] hover:text-[--accent] transition-colors">
            ← Volver al inicio
          </a>
          <h1 className="text-2xl font-bold text-[--foreground] mt-3">Instancia General</h1>
          <p className="text-sm text-[--muted] mt-1">
            Rellene todos los campos obligatorios y adjunte la documentación necesaria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos del solicitante */}
          <div className="bg-[--surface] border border-[--border] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[--foreground] uppercase tracking-wider text-[--muted]">
              Datos del solicitante
            </h2>
            <Input
              label="Nombre completo"
              placeholder="Nombre y apellidos"
              value={form.nombreSolicitante}
              onChange={(e) => handleChange('nombreSolicitante', e.target.value)}
              error={errors.nombreSolicitante}
              required
            />
            <Input
              label="Dirección fiscal"
              placeholder="Calle, número, localidad, código postal"
              value={form.direccionFiscal}
              onChange={(e) => handleChange('direccionFiscal', e.target.value)}
              error={errors.direccionFiscal}
              required
            />
            <Input
              label="Nombre del representante"
              placeholder="Opcional — si actúa en representación de otra persona"
              value={form.nombreRepresentante}
              onChange={(e) => handleChange('nombreRepresentante', e.target.value)}
            />
          </div>

          {/* Contenido */}
          <div className="bg-[--surface] border border-[--border] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[--muted]">
              Contenido de la instancia
            </h2>
            <Textarea
              label="Expone"
              placeholder="Describa los hechos o circunstancias relevantes que motivan esta solicitud…"
              value={form.expone}
              onChange={(e) => handleChange('expone', e.target.value)}
              error={errors.expone}
              required
              className="min-h-[140px]"
            />
            <Textarea
              label="Solicita"
              placeholder="Indique qué solicita a la administración…"
              value={form.solicita}
              onChange={(e) => handleChange('solicita', e.target.value)}
              error={errors.solicita}
              required
              className="min-h-[100px]"
            />
          </div>

          {/* Adjuntos */}
          <div className="bg-[--surface] border border-[--border] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[--muted]">
              Documentación adjunta
            </h2>
            <div
              className="border-2 border-dashed border-[--border] rounded-lg p-6 text-center cursor-pointer hover:border-[--accent]/40 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <p className="text-sm text-[--muted]">
                {uploading ? 'Subiendo…' : 'Haga clic para adjuntar archivos (PDF, imágenes, documentos — máx. 10MB)'}
              </p>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              />
            </div>

            {adjuntos.length > 0 && (
              <ul className="space-y-2">
                {adjuntos.map((a) => (
                  <li
                    key={a.s3Key}
                    className="flex items-center justify-between px-3 py-2 bg-[--surface-2] rounded-lg border border-[--border]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[--muted] text-sm">📎</span>
                      <span className="text-sm text-[--foreground] truncate">{a.nombre}</span>
                      <span className="text-xs text-[--muted] shrink-0">
                        {(a.tamaño / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdjunto(a.s3Key)}
                      className="text-[--muted] hover:text-red-400 text-sm ml-2 shrink-0"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {apiError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {apiError}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <a href="/dashboard">
              <Button type="button" variant="secondary">Cancelar</Button>
            </a>
            <Button type="submit" loading={submitting || uploading}>
              Presentar instancia
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
