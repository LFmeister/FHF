'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { auth } from '@/lib/auth'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentEmail: string
  currentFullName?: string
  onUpdated?: () => void
}

export function AccountSettingsModal({ isOpen, onClose, currentEmail, currentFullName, onUpdated }: AccountSettingsModalProps) {
  const [fullName, setFullName] = useState(currentFullName || '')
  const [email, setEmail] = useState(currentEmail)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Delete account states
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleUpdateName = async () => {
    setMsg(null); setErr(null)
    if (!fullName.trim()) {
      setErr('El nombre no puede estar vacío')
      return
    }
    setSavingName(true)
    const { error } = await auth.updateFullName(fullName.trim())
    setSavingName(false)
    if (error) {
      setErr(error.message || 'Error al actualizar el nombre')
    } else {
      setMsg('Nombre actualizado correctamente')
      onUpdated?.()
    }
  }

  const handleDeleteAccount = async () => {
    setMsg(null); setErr(null)

    if (deleteText.trim().toUpperCase() !== 'ELIMINAR') {
      setErr('Escribe "ELIMINAR" para confirmar la eliminación de tu cuenta')
      return
    }

    try {
      setDeleting(true)
      // Obtener el token actual
      const { session } = await auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErr('No hay sesión activa. Vuelve a iniciar sesión e inténtalo de nuevo.')
        setDeleting(false)
        return
      }

      // Intentar eliminar contra ruta API (disponible en entornos con server)
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = data?.error || 'No se pudo eliminar la cuenta. Intenta más tarde.'
        setErr(msg)
        setDeleting(false)
        return
      }

      // Cerrar sesión y redirigir
      await auth.signOut()
      setMsg('Tu cuenta ha sido eliminada. Gracias por usar la plataforma.')
      router.push('/auth/register')
    } catch (e: any) {
      setErr(e?.message || 'Error inesperado al eliminar la cuenta')
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateEmail = async () => {
    setMsg(null); setErr(null)
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('Ingresa un email válido')
      return
    }
    if (email.trim() === currentEmail) {
      setErr('El nuevo email debe ser diferente al actual')
      return
    }
    setSavingEmail(true)
    const { error } = await auth.updateEmail(email.trim())
    setSavingEmail(false)
    if (error) {
      // Handle specific Supabase errors
      if (error.message?.includes('already registered')) {
        setErr('Este email ya está registrado por otro usuario')
      } else if (error.message?.includes('rate limit')) {
        setErr('Demasiados intentos. Espera unos minutos antes de intentar de nuevo')
      } else {
        setErr(error.message || 'Error al actualizar el email')
      }
    } else {
      setMsg('Se ha enviado un email de confirmación. Revisa tu bandeja de entrada y confirma el cambio antes de que tome efecto.')
      onUpdated?.()
    }
  }

  const handleUpdatePassword = async () => {
    setMsg(null); setErr(null)
    
    if (password.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== password2) {
      setErr('Las contraseñas no coinciden')
      return
    }
    
    setSavingPass(true)
    const { error } = await auth.updatePassword(password)
    setSavingPass(false)
    if (error) {
      setErr(error.message || 'Error al actualizar la contraseña')
    } else {
      setMsg('Contraseña actualizada correctamente')
      setPassword('')
      setPassword2('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Ajustes de Cuenta</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {err && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{err}</div>
          )}
          {msg && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">{msg}</div>
          )}

          {/* Editar nombre */}
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Editar nombre</h4>
            <div className="flex gap-2">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" />
              <Button onClick={handleUpdateName} loading={savingName}>Guardar</Button>
            </div>
          </section>

          {/* Cambiar email */}
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cambiar email</h4>
            <div className="flex gap-2">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
              <Button onClick={handleUpdateEmail} loading={savingEmail}>Guardar</Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Importante:</strong> Se enviará un email de confirmación. El cambio no será efectivo hasta que confirmes desde tu correo.
            </p>
          </section>

          {/* Cambiar contraseña */}
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Cambiar contraseña</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva contraseña" />
              <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Confirmar contraseña" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 6 caracteres
            </p>
            <div className="mt-2">
              <Button onClick={handleUpdatePassword} loading={savingPass}>Actualizar contraseña</Button>
            </div>
          </section>

          {/* Eliminar cuenta */}
          <section>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Eliminar cuenta</h4>
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-2">
              <p>
                Esta acción es <strong>permanente</strong> y eliminará tu cuenta y datos asociados. 
                Escribe <strong>ELIMINAR</strong> para confirmar.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                  value={deleteText} 
                  onChange={(e) => setDeleteText(e.target.value)} 
                  placeholder="Escribe ELIMINAR" 
                />
                <Button 
                  onClick={handleDeleteAccount} 
                  disabled={deleting || deleteText.trim().toUpperCase() !== 'ELIMINAR'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                </Button>
              </div>
              <p className="text-xs text-red-600">No podrás recuperar tu cuenta una vez eliminada.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
