-- SOLUCIÓN COMPLETA PARA ERROR RLS EN EXPENSES
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. Eliminar todas las políticas problemáticas
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.balances;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.project_members;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.projects;

-- 2. Crear políticas específicas para project_members (necesario para las otras políticas)
CREATE POLICY "Users can view their project memberships" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Project owners can manage members" ON public.project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_members.project_id 
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join projects" ON public.project_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Políticas para projects
CREATE POLICY "Users can view projects they belong to" ON public.projects
  FOR SELECT USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can update projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Project owners can delete projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- 4. Políticas para expenses (SOLUCIÓN PRINCIPAL)
CREATE POLICY "Users can view expenses from their projects" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = expenses.project_id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses in their projects" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = expenses.project_id 
      AND pm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (created_by = auth.uid());

-- 5. Políticas para balances
CREATE POLICY "Users can view balances from their projects" ON public.balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = balances.project_id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create balances in their projects" ON public.balances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = balances.project_id 
      AND pm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own balances" ON public.balances
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own balances" ON public.balances
  FOR DELETE USING (created_by = auth.uid());
