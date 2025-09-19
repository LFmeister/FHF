-- Configuración simple de tipos de usuario para Supabase
-- Este script es más compatible con las restricciones de Supabase

-- 1. Función simple para actualizar tipo de usuario
CREATE OR REPLACE FUNCTION public.update_user_type(user_email text, user_type text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Intentar actualizar usando la API de Supabase Admin
  -- Esta función debe ser llamada desde el código de la aplicación
  -- con permisos de service_role
  
  RETURN 'Use adminService.updateUserType() desde la aplicación';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para verificar tipo de usuario (solo lectura)
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS text AS $$
BEGIN
  -- Esta función puede ser llamada por usuarios autenticados
  -- para obtener su propio tipo
  RETURN COALESCE(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'type',
    'normal'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para verificar si el usuario actual es master
CREATE OR REPLACE FUNCTION public.is_current_user_master()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'type') = 'master',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear una tabla para almacenar configuraciones de usuario (alternativa)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_type text DEFAULT 'normal' CHECK (user_type IN ('normal', 'master')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Habilitar RLS en la tabla user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 7. Política para que solo masters puedan actualizar tipos
CREATE POLICY "Masters can update user types" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND user_type = 'master'
    )
  );

-- 8. Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, user_type)
  VALUES (NEW.id, 'normal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Insertar perfiles para usuarios existentes
INSERT INTO public.user_profiles (id, user_type)
SELECT id, 'normal'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);

-- Verificar la configuración
SELECT 
  'Configuración completada' as status,
  COUNT(*) as total_users,
  COUNT(CASE WHEN user_type = 'master' THEN 1 END) as masters,
  COUNT(CASE WHEN user_type = 'normal' THEN 1 END) as normal_users
FROM public.user_profiles;
