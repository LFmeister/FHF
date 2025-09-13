-- SQL para verificar qué tablas existen y su contenido
-- Ejecuta estos comandos uno por uno en Supabase SQL Editor

-- 1. Verificar qué tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar si hay proyectos
SELECT id, name, owner_id, invite_code, created_at 
FROM public.projects 
LIMIT 5;

-- 3. Verificar si hay usuarios
SELECT id, name, email, created_at 
FROM public.users 
LIMIT 5;

-- 4. Verificar si hay miembros de proyecto
SELECT pm.*, p.name as project_name, u.name as user_name
FROM public.project_members pm
LEFT JOIN public.projects p ON pm.project_id = p.id
LEFT JOIN public.users u ON pm.user_id = u.id
LIMIT 5;

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
