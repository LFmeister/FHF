-- SCRIPT DE DIAGNÓSTICO PARA EL PROBLEMA "Usuario desconocido"
-- Ejecutar en Supabase SQL Editor para diagnosticar el problema

-- 1. Verificar si el usuario actual existe en la tabla users
SELECT 
  'Usuario actual en auth.users:' as tipo,
  id, 
  email, 
  raw_user_meta_data->>'full_name' as full_name_meta
FROM auth.users 
WHERE id = auth.uid();

-- 2. Verificar si el usuario actual existe en public.users
SELECT 
  'Usuario actual en public.users:' as tipo,
  id, 
  email, 
  full_name
FROM public.users 
WHERE id = auth.uid();

-- 3. Ver los últimos balances creados y si tienen información de usuario
SELECT 
  b.id,
  b.amount,
  b.description,
  b.created_by,
  b.created_at,
  u.email as user_email,
  u.full_name as user_full_name
FROM public.balances b
LEFT JOIN public.users u ON u.id = b.created_by
ORDER BY b.created_at DESC
LIMIT 5;

-- 4. Ver los últimos gastos creados y si tienen información de usuario
SELECT 
  e.id,
  e.amount,
  e.description,
  e.created_by,
  e.created_at,
  u.email as user_email,
  u.full_name as user_full_name
FROM public.expenses e
LEFT JOIN public.users u ON u.id = e.created_by
ORDER BY e.created_at DESC
LIMIT 5;

-- 5. Verificar si el trigger está funcionando
SELECT 
  'Trigger status:' as info,
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 6. Crear usuario manualmente si no existe (EJECUTAR SOLO SI NO APARECE EN PASO 2)
INSERT INTO public.users (id, email, full_name)
SELECT 
  auth.uid(),
  email,
  raw_user_meta_data->>'full_name'
FROM auth.users 
WHERE id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = auth.uid()
);
