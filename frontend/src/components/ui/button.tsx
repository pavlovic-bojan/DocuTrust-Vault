import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-slate-900 text-slate-50 hover:bg-slate-800 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white px-4 py-2 text-sm dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 dark:focus-visible:ring-offset-slate-900',
        variant === 'outline' && 'border border-slate-200 bg-white hover:bg-slate-50 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900',
        size === 'sm' && 'px-2 py-1 text-xs',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button };
