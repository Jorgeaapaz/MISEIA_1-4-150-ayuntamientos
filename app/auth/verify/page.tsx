'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth } = useGlobal();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    const token = searchParams.get('token');
    if (!token) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setStatus('error');
      setMessage('Token no encontrado en la URL.');
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error de verificación');

        setAuth(
          {
            userId: data.user.userId,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
          },
          data.token
        );

        setStatus('success');
        setTimeout(() => {
          if (data.user.role === 'funcionario') {
            router.replace('/funcionario/registros');
          } else {
            router.replace('/dashboard');
          }
        }, 1200);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [searchParams, setAuth, router]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-fade-in">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
              <p className="text-[--muted] text-sm">Verificando tu enlace de acceso…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-2xl">
                ✓
              </div>
              <h2 className="text-xl font-bold text-[--foreground]">¡Acceso confirmado!</h2>
              <p className="text-sm text-[--muted]">Redirigiendo a tu panel…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 text-2xl">
                ✕
              </div>
              <h2 className="text-xl font-bold text-[--foreground]">Enlace inválido</h2>
              <p className="text-sm text-[--muted]">{message}</p>
              <a href="/login" className="text-sm text-[--accent] hover:underline">
                Solicitar nuevo enlace
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[--accent] border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
