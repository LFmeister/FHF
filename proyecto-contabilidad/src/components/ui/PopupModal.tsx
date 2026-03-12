'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from './Button'

interface PopupModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
}

const widthMap: Record<NonNullable<PopupModalProps['maxWidth']>, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
}

export function PopupModal({ isOpen, onClose, children, maxWidth = 'xl', className }: PopupModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={clsx('relative w-full max-h-[92vh] overflow-y-auto soft-scrollbar', widthMap[maxWidth], className)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 !h-9 !w-9 !rounded-full !bg-white/95 !p-0 !text-slate-600 shadow-md hover:!bg-white hover:!text-slate-900"
          aria-label="Cerrar popup"
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  )
}
