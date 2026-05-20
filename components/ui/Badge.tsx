'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[--surface-2] text-[--muted] border border-[--border]',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/25',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function estadoBadge(estado: string) {
  const map: Record<string, BadgeVariant> = {
    presentado: 'info',
    en_tramite: 'warning',
    resuelto: 'success',
  };
  const labels: Record<string, string> = {
    presentado: 'Presentado',
    en_tramite: 'En trámite',
    resuelto: 'Resuelto',
  };
  return <Badge variant={map[estado] || 'default'}>{labels[estado] || estado}</Badge>;
}
