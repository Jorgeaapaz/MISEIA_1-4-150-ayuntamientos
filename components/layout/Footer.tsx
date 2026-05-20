'use client';

import { useSede } from '@/hooks/useSede';

export function Footer() {
  const { configSede } = useSede();

  return (
    <footer className="border-t border-[--border] bg-[--surface] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[--muted]">
            {configSede?.nombreAyuntamiento || 'Sede Electrónica Municipal'}
          </p>
          <div className="flex items-center gap-4 text-xs text-[--muted]">
            {configSede?.emailContacto && (
              <span>{configSede.emailContacto}</span>
            )}
            {configSede?.telefono && <span>{configSede.telefono}</span>}
            {configSede?.direccion && <span>{configSede.direccion}</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
