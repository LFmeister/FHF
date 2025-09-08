# 🚀 Guía de Deployment - Sistema de Contabilidad

## 📋 **PASO 1: Configurar Supabase Database**

### 1.1 Acceder al Panel de Supabase
1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Selecciona tu proyecto existente
3. En el panel lateral, haz clic en **"SQL Editor"**

### 1.2 Ejecutar el Schema de Base de Datos
1. En el SQL Editor, haz clic en **"New query"**
2. Copia y pega **TODO** el contenido del archivo `database/schema.sql`
3. Haz clic en **"Run"** para ejecutar el script
4. ✅ Verifica que aparezca el mensaje de éxito y se creen todas las tablas

### 1.3 Obtener las Credenciales de Supabase
1. Ve a **"Settings"** → **"API"** en el panel lateral
2. Copia estos 3 valores importantes:
   - **URL**: `https://tu-proyecto-id.supabase.co`
   - **anon public**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`
   - **service_role**: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...`

### 1.4 Configurar Storage (Opcional pero recomendado)
1. Ve a **"Storage"** en el panel lateral
2. Haz clic en **"Create bucket"**
3. Nombre: `project-files`
4. Marca como **Private**
5. Haz clic en **"Create bucket"**

## ⚙️ **PASO 2: Configurar Credenciales Locales**

### 2.1 Editar archivo de configuración
1. Abre el archivo `config/database.php`
2. Reemplaza estas líneas:
```php
$this->supabase_url = 'https://tu-proyecto-id.supabase.co';
$this->supabase_key = 'tu-anon-key-copiada-de-supabase';
$this->supabase_service_key = 'tu-service-key-copiada-de-supabase';
```

### 2.2 Crear carpetas necesarias
```bash
mkdir uploads
chmod 777 uploads
```

## 🐙 **PASO 3: Subir a GitHub**

### 3.1 Inicializar Git (si no está inicializado)
```bash
cd C:\xampp\htdocs\FHF
git init
```

### 3.2 Crear .gitignore
Crear archivo `.gitignore` con este contenido:
```
# Archivos de configuración sensibles
config/database.php

# Archivos subidos por usuarios
uploads/*
!uploads/.gitkeep

# Logs
*.log

# Archivos temporales
*.tmp
*.temp

# Archivos del sistema
.DS_Store
Thumbs.db

# Variables de entorno
.env
.env.local
.env.production

# Dependencias (si usas composer)
vendor/

# Cache
cache/
```

### 3.3 Crear archivo de configuración de ejemplo
Crear `config/database.example.php`:
```php
<?php
// Supabase configuration - EXAMPLE FILE
class Database {
    private $supabase_url;
    private $supabase_key;
    private $supabase_service_key;
    
    public function __construct() {
        // Replace with your Supabase credentials
        $this->supabase_url = 'https://your-project-id.supabase.co';
        $this->supabase_key = 'your-anon-key-here';
        $this->supabase_service_key = 'your-service-key-here';
    }
    // ... resto del código igual
}
```

### 3.4 Comandos Git
```bash
# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit: Sistema de Contabilidad de Proyectos"

# Crear repositorio en GitHub (desde la web)
# Luego conectar:
git remote add origin https://github.com/tu-usuario/nombre-repositorio.git
git branch -M main
git push -u origin main
```

## 🌐 **PASO 4: Deployment Online**

### Opción A: Netlify (Recomendado para PHP)
1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio de GitHub
3. **PROBLEMA**: Netlify no soporta PHP nativamente

### Opción B: Heroku (Soporta PHP)
1. Ve a [heroku.com](https://heroku.com)
2. Crea nueva app
3. Conecta con GitHub
4. Agrega buildpack de PHP
5. Configura variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### Opción C: Railway (Moderno y fácil)
1. Ve a [railway.app](https://railway.app)
2. Conecta GitHub
3. Deploy automático
4. Configura variables de entorno

### Opción D: Servidor VPS (Más control)
1. Contratar VPS (DigitalOcean, Linode, etc.)
2. Instalar LAMP stack
3. Clonar repositorio
4. Configurar Apache/Nginx
5. Configurar SSL con Let's Encrypt

## 🔧 **PASO 5: Configuración para Producción**

### 5.1 Modificar para variables de entorno
Crear archivo `config/database.production.php`:
```php
<?php
class Database {
    private $supabase_url;
    private $supabase_key;
    private $supabase_service_key;
    
    public function __construct() {
        // Usar variables de entorno en producción
        $this->supabase_url = $_ENV['SUPABASE_URL'] ?? getenv('SUPABASE_URL');
        $this->supabase_key = $_ENV['SUPABASE_ANON_KEY'] ?? getenv('SUPABASE_ANON_KEY');
        $this->supabase_service_key = $_ENV['SUPABASE_SERVICE_KEY'] ?? getenv('SUPABASE_SERVICE_KEY');
    }
    // ... resto igual
}
```

### 5.2 Variables de entorno necesarias
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 🧪 **PASO 6: Probar Localmente**

### 6.1 Verificar XAMPP
1. Iniciar Apache en XAMPP
2. Ir a `http://localhost/FHF`
3. Probar registro de usuario
4. Probar creación de proyecto

### 6.2 Checklist de Pruebas
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Crear proyecto funciona
- [ ] Unirse a proyecto con código funciona
- [ ] Agregar gastos funciona
- [ ] Subir archivos funciona
- [ ] Ajustar balance funciona (solo propietario)

## 🚨 **Solución de Problemas Comunes**

### Error: "No se puede conectar a Supabase"
- Verificar credenciales en `config/database.php`
- Verificar que el proyecto de Supabase esté activo
- Verificar conectividad a internet

### Error: "Tabla no existe"
- Verificar que el SQL se ejecutó completamente
- Revisar en Supabase → Table Editor si las tablas existen

### Error: "Permission denied"
- Verificar permisos de carpeta uploads: `chmod 777 uploads`
- Verificar políticas RLS en Supabase

### Error de CORS en producción
- Configurar dominios permitidos en Supabase → Authentication → Settings

## 📝 **Comandos Rápidos de Referencia**

```bash
# Git básico
git status
git add .
git commit -m "mensaje"
git push

# Permisos
chmod 755 -R .
chmod 777 uploads/

# Ver logs de Apache (si hay errores)
tail -f /var/log/apache2/error.log
```

## 🎯 **Próximos Pasos Recomendados**

1. Configurar SSL/HTTPS en producción
2. Implementar backups automáticos
3. Configurar monitoreo de errores
4. Optimizar rendimiento con cache
5. Implementar tests automatizados
