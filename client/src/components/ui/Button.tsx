import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-sm shadow-brand-500/25 dark:shadow-brand-950/50',
        default:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-brand-500 shadow-sm shadow-brand-500/25',
        brand:
          'bg-gradient-to-r from-brand-600 to-emerald-600 text-white hover:from-brand-700 hover:to-emerald-700 active:from-brand-800 active:to-emerald-800 focus-visible:ring-brand-500 shadow-sm shadow-brand-500/20',
        secondary:
          'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700/90 dark:active:bg-slate-700',
        outline:
          'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-300 dark:border-slate-700/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm shadow-rose-500/25',
        danger:
          'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm shadow-rose-500/25',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200/80 focus-visible:ring-slate-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        link:
          'text-brand-600 underline-offset-4 hover:underline dark:text-brand-400 p-0 h-auto font-normal',
        glow:
          'bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 active:scale-[0.98]',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-500/25',
      },
      size: {
        default: 'text-sm px-4 py-2 gap-2 h-10',
        sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
        md: 'text-sm px-4 py-2 gap-2 h-10',
        lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

// We omit conflicting props between HTMLMotionProps and VariantProps
export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'size' | 'ref'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      whileTap,
      whileHover,
      ...props
    },
    ref
  ) => {
    const isInteractive = !disabled && !isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isInteractive ? whileTap ?? { scale: 0.98 } : undefined}
        whileHover={isInteractive ? whileHover ?? { y: -0.5 } : undefined}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
