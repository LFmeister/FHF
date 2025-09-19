-- SOLUCIÓN PARA RECURSIÓN INFINITA EN RLS
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar TODAS las políticas que causan recursión
DROP POLICY IF EXISTS "Users can view projects they belong to" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Users can join projects" ON public.project_members;

-- 2. Políticas SIMPLES sin recursión para projects
CREATE POLICY "Users can view all projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- 3. Políticas SIMPLES para project_members
CREATE POLICY "Users can view all memberships" ON public.project_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert memberships" ON public.project_members
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update memberships" ON public.project_members
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete memberships" ON public.project_members
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Mantener políticas de expenses SIN cambios (estas funcionan)
-- No tocar las políticas de expenses que ya están creadas

-- 5. Mantener políticas de balances SIN cambios (estas funcionan)
-- No tocar las políticas de balances que ya están creadas
