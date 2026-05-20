'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        bg-[--surface] border border-[--border] rounded-xl p-5
        ${hover ? 'hover:border-[--accent]/40 hover:bg-[--surface-2] transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-semibold text-[--foreground]">{title}</h3>
        {description && <p className="text-sm text-[--muted] mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
