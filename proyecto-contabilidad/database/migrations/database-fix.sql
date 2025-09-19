-- Políticas RLS corregidas para resolver errores 406/409

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "users_own_profile" ON public.users;
DROP POLICY IF EXISTS "projects_owner_only" ON public.projects;
DROP POLICY IF EXISTS "members_own_only" ON public.project_members;
DROP POLICY IF EXISTS "balances_creator_only" ON public.balances;
DROP POLICY IF EXISTS "expenses_creator_only" ON public.expenses;
DROP POLICY IF EXISTS "expense_files_creator_only" ON public.expense_files;

-- Nuevas políticas más permisivas
-- Users: pueden ver/editar su propio perfil
CREATE POLICY "users_policy" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Projects: pueden crear, ver proyectos donde son miembros, y consultar por invite_code
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = id
    )
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project members: pueden gestionar membresías de proyectos donde participan
CREATE POLICY "members_select" ON public.project_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.projects WHERE id = project_id
    )
  );

CREATE POLICY "members_insert" ON public.project_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.projects WHERE id = project_id
    )
  );

CREATE POLICY "members_delete" ON public.project_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.projects WHERE id = project_id
    )
  );

-- Balances: pueden gestionar balances de proyectos donde son miembros
CREATE POLICY "balances_policy" ON public.balances
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = balances.project_id
    )
  );

-- Expenses: pueden gestionar gastos de proyectos donde son miembros
CREATE POLICY "expenses_policy" ON public.expenses
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = expenses.project_id
    )
  );

-- Expense files: pueden gestionar archivos de gastos de proyectos donde son miembros
CREATE POLICY "expense_files_policy" ON public.expense_files
  FOR ALL USING (
    expense_id IN (
      SELECT e.id FROM public.expenses e
      JOIN public.project_members pm ON pm.project_id = e.project_id
      WHERE pm.user_id = auth.uid()
    )
  );
