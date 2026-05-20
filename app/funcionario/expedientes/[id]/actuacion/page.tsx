'use client';

import { useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardHeader } from '@/components/ui/Card';

export default function NuevaActuacionPage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token } = useGlobal();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [texto, setTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) {
      setError('El texto de la actuación es obligatorio');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/expedientes/${id}/actuaciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/funcionario/expedientes/${id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al añadir la actuación');
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
      <main className="flex-1 max-w-xl mx-auto w-full px-4 sm:px-6 py-10 animate-fade-in">
        <div className="mb-6">
          <Link
            href={`/funcionario/expedientes/${id}`}
            className="text-xs text-[--muted] hover:text-[--accent] transition-colors"
          >
            ← Volver al expediente
          </Link>
        </div>

        <Card>
          <CardHeader
            title="Nueva actuación"
            description="Añade una actuación al expediente con fecha y descripción."
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              label="Descripción de la actuación"
              placeholder="Describe las acciones realizadas, resoluciones, comunicaciones…"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                if (error) setError('');
              }}
              error={error}
              required
              className="min-h-[160px]"
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <Link href={`/funcionario/expedientes/${id}`}>
                <Button type="button" variant="secondary">Cancelar</Button>
              </Link>
              <Button type="submit" loading={submitting}>
                Guardar actuación
              </Button>
            </div>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
