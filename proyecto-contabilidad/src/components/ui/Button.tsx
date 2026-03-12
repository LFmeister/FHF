import { ButtonHTMLAttributes, forwardRef } from 'react'

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center rounded-xl font-semibold tracking-[0.01em] transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      primary:
        'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-[0_10px_20px_rgba(53,84,101,0.25)] hover:from-primary-700 hover:to-primary-800',
      secondary:
        'bg-gradient-to-r from-accent-400 to-accent-500 text-slate-900 shadow-[0_8px_18px_rgba(196,143,61,0.28)] hover:from-accent-500 hover:to-accent-600',
      outline:
        'border border-slate-300 bg-white text-slate-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800',
    }

    const sizes = {
      sm: 'h-9 px-3.5 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
    }

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
