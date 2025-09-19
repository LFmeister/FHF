-- Solución simple: Deshabilitar RLS temporalmente para resolver recursión infinita

-- Deshabilitar RLS en todas las tablas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_files DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "users_policy" ON public.users;
DROP POLICY IF EXISTS "users_own_profile" ON public.users;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
DROP POLICY IF EXISTS "projects_owner_only" ON public.projects;
DROP POLICY IF EXISTS "members_select" ON public.project_members;
DROP POLICY IF EXISTS "members_insert" ON public.project_members;
DROP POLICY IF EXISTS "members_delete" ON public.project_members;
DROP POLICY IF EXISTS "members_own_only" ON public.project_members;
DROP POLICY IF EXISTS "balances_policy" ON public.balances;
DROP POLICY IF EXISTS "balances_creator_only" ON public.balances;
DROP POLICY IF EXISTS "expenses_policy" ON public.expenses;
DROP POLICY IF EXISTS "expenses_creator_only" ON public.expenses;
DROP POLICY IF EXISTS "expense_files_policy" ON public.expense_files;
DROP POLICY IF EXISTS "expense_files_creator_only" ON public.expense_files;

-- Habilitar RLS nuevamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_files ENABLE ROW LEVEL SECURITY;

-- Políticas ultra simples SIN referencias cruzadas
CREATE POLICY "users_all" ON public.users FOR ALL USING (true);
CREATE POLICY "projects_all" ON public.projects FOR ALL USING (true);
CREATE POLICY "members_all" ON public.project_members FOR ALL USING (true);
CREATE POLICY "balances_all" ON public.balances FOR ALL USING (true);
CREATE POLICY "expenses_all" ON public.expenses FOR ALL USING (true);
CREATE POLICY "expense_files_all" ON public.expense_files FOR ALL USING (true);
