-- Script para eliminar completamente la funcionalidad de user_profiles y tipos de usuario
-- Este script elimina la tabla user_profiles y todas las funciones relacionadas

-- 1. Eliminar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función del trigger
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Eliminar políticas RLS
DROP POLICY IF EXISTS "Masters can update user types" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- 4. Eliminar tabla user_profiles
DROP TABLE IF EXISTS public.user_profiles;

-- 5. Eliminar funciones relacionadas
DROP FUNCTION IF EXISTS public.update_user_type(text, text);
DROP FUNCTION IF EXISTS public.get_current_user_type();
DROP FUNCTION IF EXISTS public.is_current_user_master();

-- Verificar que todo se haya eliminado correctamente
SELECT 
  'Limpieza completada - funcionalidad de user_profiles eliminada' as status,
  'Tabla user_profiles: ' || CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN 'AÚN EXISTE' ELSE 'ELIMINADA' END as tabla_status,
  'Funciones: ' || (
    SELECT COUNT(*)::text FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name IN ('update_user_type', 'get_current_user_type', 'is_current_user_master', 'handle_new_user')
  ) || ' funciones restantes' as funciones_status;
