import * as React from 'react';
import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  VALID: 'bg-green-100 text-green-800',
  MISSING: 'bg-amber-100 text-amber-800',
  REMOVED: 'bg-red-100 text-red-800',
  SYSTEM: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-amber-100 text-amber-800',
  DELETED: 'bg-red-100 text-red-800',
  default: 'bg-slate-100 text-slate-800',
};

export function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant ? variants[variant] ?? variants.default : variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
