'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { MasterUserManagement } from '@/components/admin/MasterUserManagement'

export default function AdminPage() {
  return (
    <AuthGuard requireEmailConfirmation={true}>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-bold text-xl">👑</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-primary-800">
                  Panel Master
                </h1>
                <p className="text-primary-600">
                  Herramientas exclusivas para usuarios master
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Acceso Restringido:</strong> Solo usuarios con tipo "master" pueden usar estas herramientas.
              </p>
            </div>
          </div>
          
          <MasterUserManagement />
        </div>
      </div>
    </AuthGuard>
  )
}
