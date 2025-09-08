-- FIX RLS POLICIES FOR EXPENSES TABLE
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar políticas existentes de expenses
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.expenses;

-- 2. Crear políticas más específicas para expenses
CREATE POLICY "Users can view expenses from their projects" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = expenses.project_id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert expenses to their projects" ON public.expenses
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

-- 3. También actualizar políticas de balances para consistencia
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.balances;

CREATE POLICY "Users can view balances from their projects" ON public.balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm 
      WHERE pm.project_id = balances.project_id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert balances to their projects" ON public.balances
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
