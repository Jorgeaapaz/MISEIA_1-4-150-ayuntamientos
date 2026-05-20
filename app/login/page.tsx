'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al enviar el enlace');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo mark */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[--accent] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              S
            </div>
          </div>

          {!sent ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-[--foreground] mb-2">Acceder a la sede</h1>
                <p className="text-sm text-[--muted]">
                  Introduce tu correo y te enviaremos un enlace de acceso.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" loading={loading}>
                  Enviar enlace de acceso
                </Button>
              </form>

              <p className="text-center text-xs text-[--muted] mt-6">
                Al acceder, aceptas el uso del sistema en los términos de la{' '}
                <span className="text-[--accent]">administración electrónica española</span>.
              </p>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-2xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-[--foreground]">Enlace enviado</h2>
              <p className="text-sm text-[--muted]">
                Hemos enviado un enlace de acceso a{' '}
                <strong className="text-[--foreground]">{email}</strong>.{' '}
                Revisa tu bandeja de entrada y haz clic en el enlace.
              </p>
              <p className="text-xs text-[--muted]">El enlace expira en 15 minutos.</p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-xs text-[--accent] hover:underline"
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
