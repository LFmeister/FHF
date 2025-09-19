-- SOLUCIÓN DEFINITIVA - RLS SIN RECURSIÓN
-- Ejecutar en Supabase SQL Editor

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view projects they belong to" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view their project memberships" ON public.project_members;
DROP POLICY IF EXISTS "Users can join projects" ON public.project_members;
DROP POLICY IF EXISTS "Users can view expenses from their projects" ON public.expenses;
DROP POLICY IF EXISTS "Users can create expenses in their projects" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view balances from their projects" ON public.balances;
DROP POLICY IF EXISTS "Users can create balances in their projects" ON public.balances;
DROP POLICY IF EXISTS "Users can update their own balances" ON public.balances;
DROP POLICY IF EXISTS "Users can delete their own balances" ON public.balances;

-- 2. POLÍTICAS ULTRA SIMPLES - SIN RECURSIÓN
-- Projects: acceso básico
CREATE POLICY "Enable read access for authenticated users" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND owner_id = auth.uid());

CREATE POLICY "Enable update for owners" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Enable delete for owners" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- Project Members: acceso básico
CREATE POLICY "Enable all for authenticated users on project_members" ON public.project_members
  FOR ALL USING (auth.role() = 'authenticated');

-- Expenses: verificación directa sin joins complejos
CREATE POLICY "Enable read for authenticated users on expenses" ON public.expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Enable update for creators on expenses" ON public.expenses
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Enable delete for creators on expenses" ON public.expenses
  FOR DELETE USING (created_by = auth.uid());

-- Balances: verificación directa sin joins complejos
CREATE POLICY "Enable read for authenticated users on balances" ON public.balances
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users on balances" ON public.balances
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Enable update for creators on balances" ON public.balances
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Enable delete for creators on balances" ON public.balances
  FOR DELETE USING (created_by = auth.uid());
