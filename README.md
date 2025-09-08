# Sistema de Contabilidad de Proyectos

Un sistema completo de gestión de contabilidad para proyectos colaborativos, desarrollado en PHP, JavaScript, HTML y CSS con Supabase como base de datos.

## Características

- **Autenticación completa**: Registro, inicio de sesión y recuperación de contraseñas
- **Gestión de proyectos**: Crear proyectos y invitar usuarios mediante códigos
- **Seguimiento de gastos**: Agregar, categorizar y aprobar gastos
- **Gestión de balance**: Ajustar balances con historial completo
- **Subida de archivos**: Soporte para imágenes, videos y documentos
- **Dashboard interactivo**: Estadísticas y actividad en tiempo real
- **Diseño responsive**: Optimizado para dispositivos móviles y desktop

## Tecnologías Utilizadas

- **Backend**: PHP 7.4+
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Base de datos**: Supabase (PostgreSQL)
- **Servidor web**: Apache/Nginx
- **Autenticación**: Supabase Auth

## Requisitos del Sistema

- PHP 7.4 o superior
- Apache/Nginx con mod_rewrite habilitado
- Extensiones PHP: curl, json, mbstring
- Cuenta de Supabase
- Navegador web moderno

## Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone <repository-url>
cd FHF
```

### 2. Configurar Supabase

1. Crear una cuenta en [Supabase](https://supabase.com)
2. Crear un nuevo proyecto
3. Obtener las credenciales del proyecto:
   - URL del proyecto
   - Clave anónima (anon key)
   - Clave de servicio (service key)

### 3. Configurar la base de datos

1. En el panel de Supabase, ir a SQL Editor
2. Ejecutar el contenido completo del archivo `database/schema.sql`
3. Verificar que todas las tablas se hayan creado correctamente

### 4. Configurar las credenciales

Editar el archivo `config/database.php` y reemplazar las siguientes líneas:

```php
$this->supabase_url = 'YOUR_SUPABASE_URL';
$this->supabase_key = 'YOUR_SUPABASE_ANON_KEY';
$this->supabase_service_key = 'YOUR_SUPABASE_SERVICE_KEY';
```

Con tus credenciales reales de Supabase.

### 5. Configurar el servidor web

#### Para Apache (XAMPP/WAMP)

1. Copiar el proyecto a la carpeta `htdocs`
2. Crear un archivo `.htaccess` en la raíz del proyecto:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# File upload security
<Files "*.php">
    Order Allow,Deny
    Allow from all
</Files>

# Protect sensitive files
<Files "config/*">
    Order Deny,Allow
    Deny from all
</Files>
```

#### Para Nginx

Agregar la siguiente configuración al bloque server:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}

# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
add_header X-XSS-Protection "1; mode=block";
```

### 6. Configurar permisos de archivos

```bash
chmod 755 -R .
chmod 777 uploads/
```

### 7. Configurar Supabase Storage (Opcional)

Para usar el almacenamiento de archivos de Supabase en lugar del local:

1. En el panel de Supabase, ir a Storage
2. Crear un bucket llamado `project-files`
3. Configurar las políticas de seguridad según el archivo `database/schema.sql`

## Configuración de Desarrollo

### Variables de entorno

Crear un archivo `.env` (opcional) para configuraciones adicionales:

```env
APP_ENV=development
DEBUG=true
MAX_FILE_SIZE=10485760
ALLOWED_ORIGINS=http://localhost
```

### Configuración de PHP

Asegurar que las siguientes configuraciones estén habilitadas en `php.ini`:

```ini
file_uploads = On
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
```

## Uso del Sistema

### 1. Registro de Usuario

1. Acceder a la página principal
2. Hacer clic en "¿No tienes cuenta? Regístrate"
3. Completar el formulario de registro
4. Confirmar el correo electrónico (revisar bandeja de entrada)

### 2. Crear un Proyecto

1. Iniciar sesión en el dashboard
2. Hacer clic en "Crear Proyecto"
3. Completar la información del proyecto
4. Compartir el código de invitación con otros usuarios

### 3. Unirse a un Proyecto

1. Obtener el código de invitación del propietario del proyecto
2. En el dashboard, hacer clic en "Unirse a Proyecto"
3. Ingresar el código de 8 caracteres

### 4. Gestionar Gastos

1. Acceder a un proyecto
2. Hacer clic en "Agregar Gasto"
3. Completar la información del gasto
4. Opcionalmente subir archivos adjuntos

### 5. Ajustar Balance (Solo propietarios)

1. En la página del proyecto, hacer clic en "Ajustar Balance"
2. Seleccionar el tipo de ajuste (depósito, retiro, ajuste)
3. Ingresar el monto y descripción

## Estructura del Proyecto

```
FHF/
├── api/                    # Endpoints de la API
│   ├── auth/              # Autenticación
│   ├── balance/           # Gestión de balance
│   ├── dashboard/         # Dashboard
│   ├── expenses/          # Gastos
│   ├── files/             # Subida de archivos
│   └── projects/          # Proyectos
├── assets/                # Recursos estáticos
│   ├── css/              # Hojas de estilo
│   └── js/               # JavaScript
├── config/               # Configuración
├── database/             # Esquema de base de datos
├── includes/             # Funciones auxiliares
├── uploads/              # Archivos subidos (local)
├── dashboard.php         # Dashboard principal
├── index.php            # Página de inicio/login
├── project.php          # Página de proyecto
└── README.md           # Este archivo
```

## API Endpoints

### Autenticación
- `POST /api/auth/login.php` - Iniciar sesión
- `POST /api/auth/register.php` - Registrar usuario
- `POST /api/auth/forgot-password.php` - Recuperar contraseña
- `POST /api/auth/logout.php` - Cerrar sesión

### Proyectos
- `POST /api/projects/create.php` - Crear proyecto
- `POST /api/projects/join.php` - Unirse a proyecto
- `GET /api/projects/stats.php` - Estadísticas de proyecto

### Gastos
- `POST /api/expenses/create.php` - Crear gasto

### Balance
- `POST /api/balance/adjust.php` - Ajustar balance

### Archivos
- `POST /api/files/upload.php` - Subir archivo

### Dashboard
- `GET /api/dashboard/stats.php` - Estadísticas del dashboard
- `GET /api/dashboard/activity.php` - Actividad reciente

## Seguridad

### Medidas implementadas

- **Autenticación JWT**: Mediante Supabase Auth
- **Validación de entrada**: Sanitización de todos los datos
- **Row Level Security**: Políticas de seguridad en Supabase
- **Validación de archivos**: Tipos y tamaños permitidos
- **Headers de seguridad**: XSS, CSRF, clickjacking
- **Sesiones seguras**: Gestión apropiada de sesiones PHP

### Recomendaciones adicionales

1. Usar HTTPS en producción
2. Configurar firewall del servidor
3. Mantener PHP y dependencias actualizadas
4. Realizar backups regulares de la base de datos
5. Monitorear logs de acceso y errores

## Solución de Problemas

### Error de conexión a Supabase

1. Verificar las credenciales en `config/database.php`
2. Comprobar que el proyecto de Supabase esté activo
3. Verificar la conectividad a internet

### Archivos no se suben

1. Verificar permisos de la carpeta `uploads/`
2. Comprobar configuración de PHP (`upload_max_filesize`)
3. Verificar espacio disponible en disco

### Errores de base de datos

1. Verificar que el esquema SQL se ejecutó correctamente
2. Comprobar las políticas RLS en Supabase
3. Revisar logs de error de PHP

### Problemas de autenticación

1. Verificar configuración de Supabase Auth
2. Comprobar que el correo de confirmación fue procesado
3. Verificar configuración de sesiones PHP

## Contribución

1. Fork del repositorio
2. Crear una rama para la nueva característica
3. Realizar los cambios y pruebas
4. Enviar pull request con descripción detallada

## Licencia

Este proyecto está bajo la licencia MIT. Ver archivo LICENSE para más detalles.

## Soporte

Para reportar bugs o solicitar características:
1. Crear un issue en el repositorio
2. Incluir información detallada del problema
3. Proporcionar pasos para reproducir el error

## Changelog

### v1.0.0 (2024)
- Implementación inicial del sistema
- Autenticación completa con Supabase
- Gestión de proyectos y gastos
- Sistema de archivos
- Dashboard interactivo
- Diseño responsive
#   T r i g g e r   d e p l o y m e n t  
 