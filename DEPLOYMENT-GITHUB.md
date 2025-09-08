# Deployment en GitHub Pages con Supabase

## Pasos para configurar el hosting:

### 1. Configurar Supabase Online
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings > API para obtener:
   - Project URL
   - Anon public key
   - Service role key (secret)

### 2. Configurar GitHub Repository
1. Sube tu código a GitHub
2. Ve a Settings > Secrets and variables > Actions
3. Agrega estos secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu Project URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu Anon public key de Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu Service role key de Supabase
   - `NEXTAUTH_SECRET`: Una cadena secreta aleatoria (puedes generar una con `openssl rand -base64 32`)

### 3. Habilitar GitHub Pages
1. Ve a Settings > Pages en tu repositorio
2. En "Source", selecciona "GitHub Actions"
3. El workflow se ejecutará automáticamente en cada push a main

### 4. Configurar Supabase para producción
En tu proyecto de Supabase:
1. Ve a Authentication > URL Configuration
2. Agrega tu URL de GitHub Pages: `https://tuusuario.github.io/FHF`
3. Ve a Authentication > Redirect URLs y agrega:
   - `https://tuusuario.github.io/FHF/auth/callback`

### 5. Variables de entorno locales
Crea un archivo `.env.local` en `proyecto-contabilidad/` con:
```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
NEXTAUTH_SECRET=tu_secreto_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

## URL de tu aplicación
Una vez configurado, tu aplicación estará disponible en:
`https://tuusuario.github.io/FHF`

## Comandos útiles
- `npm run dev`: Ejecutar en desarrollo
- `npm run build`: Construir para producción
- `npm run export`: Exportar archivos estáticos

## Troubleshooting
- Si las imágenes no cargan, verifica que estén en la carpeta `public/`
- Si hay errores de rutas, verifica el `basePath` en `next.config.js`
- Si Supabase no conecta, verifica las variables de entorno en GitHub Secrets
