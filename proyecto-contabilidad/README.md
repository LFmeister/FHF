# Meister Manager

Sistema de gestión contable colaborativo desarrollado con Next.js, TypeScript y Supabase.

## Características

- 🔐 **Autenticación completa**: Login, registro y recuperación de contraseñas
- 👥 **Proyectos colaborativos**: Sistema de invitación con códigos únicos
- 💰 **Gestión de balances**: Registro y seguimiento de balances iniciales
- 🧾 **Seguimiento de gastos**: Registro detallado con categorías
- 📎 **Subida de archivos**: Soporte para imágenes, videos, documentos (PDF, Word, Excel)
- 📊 **Dashboard en tiempo real**: Visualización de balances y gastos
- 🎨 **UI moderna**: Diseño responsivo con Tailwind CSS

## Tecnologías

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Validación**: Zod + React Hook Form
- **Iconos**: Lucide React
- **Estilos**: Tailwind CSS con sistema de diseño personalizado

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd proyecto-contabilidad
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia las credenciales
4. Ejecuta el script SQL del archivo `database-schema.sql` en el SQL Editor de Supabase
5. Configura el Storage bucket llamado `expense-files` con acceso público

### 4. Variables de entorno

Copia el archivo `.env.local.example` a `.env.local` y completa las variables:

```bash
cp .env.local.example .env.local
```

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=tu_nextauth_secret_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

El proyecto estará disponible en `http://localhost:3000`

## Estructura del proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Dashboard principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── auth/             # Componentes de autenticación
│   ├── balances/         # Gestión de balances
│   ├── expenses/         # Gestión de gastos
│   ├── projects/         # Gestión de proyectos
│   └── ui/               # Componentes base de UI
└── lib/                  # Utilidades y servicios
    ├── auth.ts           # Servicio de autenticación
    ├── balances.ts       # Servicio de balances
    ├── expenses.ts       # Servicio de gastos
    ├── projects.ts       # Servicio de proyectos
    ├── supabase.ts       # Cliente de Supabase
    └── validations.ts    # Esquemas de validación
```

## Uso

### 1. Registro y Login

- Regístrate con email y contraseña
- Confirma tu email (revisa spam)
- Inicia sesión con tus credenciales

### 2. Crear un proyecto

- Ve al dashboard
- Haz clic en "Crear Proyecto"
- Completa el nombre y descripción
- Comparte el código de invitación con tu equipo

### 3. Unirse a un proyecto

- Solicita el código de invitación al propietario
- Haz clic en "Unirse a Proyecto"
- Ingresa el código de 8 caracteres

### 4. Gestionar balances

- Dentro del proyecto, ve a la pestaña "Balances"
- Agrega balances iniciales o aportes adicionales
- Todos los miembros pueden ver los balances

### 5. Registrar gastos

- Ve a la pestaña "Gastos"
- Completa el formulario con monto, descripción y categoría
- Sube documentos de respaldo (facturas, recibos, fotos)
- Los archivos se almacenan de forma segura en Supabase Storage

## Funcionalidades avanzadas

### Códigos de invitación

Cada proyecto genera un código único de 8 caracteres que permite:
- Invitar nuevos miembros
- Control de acceso al proyecto
- Regeneración de códigos por seguridad

### Subida de archivos

Soporte completo para:
- **Imágenes**: JPG, PNG, GIF, WebP
- **Videos**: MP4, MOV, AVI
- **Documentos**: PDF, DOC, DOCX, XLS, XLSX

### Seguridad

- Row Level Security (RLS) en Supabase
- Autenticación JWT
- Acceso controlado por proyecto
- Validación de datos en cliente y servidor

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
```

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la documentación de [Supabase](https://supabase.com/docs)
2. Consulta la documentación de [Next.js](https://nextjs.org/docs)
3. Abre un issue en el repositorio

---

Desarrollado con ❤️ usando Next.js y Supabase
