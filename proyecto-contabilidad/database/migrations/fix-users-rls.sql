-- SOLUCIÓN PARA EL PROBLEMA "Usuario desconocido" EN BALANCES
-- El problema es que las políticas RLS no permiten hacer JOIN con la tabla users
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar política restrictiva de users si existe
DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "users_policy" ON public.users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.users;

-- 2. Crear política que permita ver usuarios en contexto de proyectos compartidos
CREATE POLICY "Users can view other users in shared projects" ON public.users
  FOR SELECT USING (
    -- Pueden ver su propio perfil
    id = auth.uid() 
    OR
    -- Pueden ver usuarios que están en los mismos proyectos
    EXISTS (
      SELECT 1 FROM public.project_members pm1
      JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
      WHERE pm1.user_id = auth.uid() 
      AND pm2.user_id = users.id
    )
  );

-- 3. Política para que usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Política para insertar nuevos usuarios (trigger de auth)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());
