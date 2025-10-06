'use client'

import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger'
  })
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...opts,
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'danger'
      })
      setIsOpen(true)
      setResolveCallback(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(true)
    }
    setIsOpen(false)
    setIsLoading(false)
    setResolveCallback(null)
  }, [resolveCallback])

  const handleCancel = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(false)
    }
    setIsOpen(false)
    setIsLoading(false)
    setResolveCallback(null)
  }, [resolveCallback])

  return {
    confirm,
    isOpen,
    isLoading,
    setIsLoading,
    options,
    handleConfirm,
    handleCancel
  }
}
