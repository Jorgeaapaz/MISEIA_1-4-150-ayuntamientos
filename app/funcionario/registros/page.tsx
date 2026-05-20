'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useGlobal } from '@/context/GlobalContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { estadoBadge } from '@/components/ui/Badge';
import { Registro } from '@/lib/types';

export default function FuncionarioRegistrosPage() {
  const { user, loading } = useRequireAuth('funcionario');
  const { token } = useGlobal();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('todos');

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

  const filtered =
    filter === 'todos' ? registros : registros.filter((r) => r.estado === filter);

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
          <h1 className="text-2xl font-bold text-[--foreground]">Todos los registros</h1>
          <p className="text-sm text-[--muted] mt-1">{registros.length} registros en total</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['todos', 'presentado', 'en_tramite', 'resuelto'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[--accent] text-white'
                  : 'bg-[--surface-2] text-[--muted] hover:text-[--foreground] border border-[--border]'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'en_tramite' ? 'En trámite' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[--border] rounded-xl">
            <p className="text-[--muted] text-sm">No hay registros con este estado.</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-[--border] rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[--border] bg-[--surface]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[--muted] uppercase tracking-wider">Número</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[--muted] uppercase tracking-wider hidden sm:table-cell">Solicitante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[--muted] uppercase tracking-wider hidden md:table-cell">Solicita</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[--muted] uppercase tracking-wider">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[--muted] uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border] bg-[--background]">
                {filtered.map((reg) => (
                  <tr key={String(reg._id)} className="hover:bg-[--surface] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[--accent]">{reg.numero}</td>
                    <td className="px-4 py-3 text-[--foreground] hidden sm:table-cell">{reg.nombreSolicitante}</td>
                    <td className="px-4 py-3 text-[--muted] hidden md:table-cell max-w-xs truncate">{reg.solicita}</td>
                    <td className="px-4 py-3">{estadoBadge(reg.estado)}</td>
                    <td className="px-4 py-3 text-[--muted] text-xs hidden sm:table-cell">
                      {new Date(reg.fechaEntrada).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/funcionario/registros/${String(reg._id)}`}
                        className="text-xs text-[--accent] hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
