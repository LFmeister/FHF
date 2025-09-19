-- SOLUCIÓN COMPLETA PARA EL PROBLEMA "Usuario desconocido"
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. Asegurar que el trigger existe y funciona
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, NEW.email),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Insertar usuarios existentes que no estén en public.users
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email)
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 4. Actualizar políticas RLS para users (más permisivas para JOIN)
DROP POLICY IF EXISTS "Users can view other users in shared projects" ON public.users;
DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.users;

-- Política simple que permite ver usuarios para hacer JOIN
CREATE POLICY "Users can view all user profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para actualizar solo el propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Política para insertar (trigger)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- 5. Verificar que todo funciona
SELECT 
  'Verificación final:' as status,
  COUNT(*) as total_users_in_public,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as users_with_names
FROM public.users;
