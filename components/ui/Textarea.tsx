'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[--foreground]">
            {label}
            {props.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 rounded-lg text-sm resize-y min-h-[120px]
            bg-[--surface-2] border border-[--border]
            text-[--foreground] placeholder:text-[--muted]
            focus:outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent]
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[--muted]">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
