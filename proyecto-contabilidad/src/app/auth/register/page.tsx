import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="flex flex-col min-h-screen">
        {/* Header con logo - más compacto en móviles */}
        <div className="flex-shrink-0 pt-8 pb-4 px-4 sm:pt-12 sm:pb-8">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl sm:text-2xl">MM</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-800 mb-2">
                Meister Manager
              </h1>
              <p className="text-sm sm:text-base text-primary-600">
                Crea tu cuenta para comenzar
              </p>
            </div>
          </div>
        </div>

        {/* Formulario - centrado y responsive */}
        <div className="flex-1 flex items-center justify-center px-4 pb-8">
          <div className="w-full max-w-md">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
