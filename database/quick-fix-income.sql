-- Solución rápida: Eliminar y recrear políticas de income para que funcionen
-- Ejecuta todo este bloque en Supabase SQL Editor

-- 1. Eliminar todas las políticas problemáticas de income
DROP POLICY IF EXISTS "Project members can view income" ON public.income;
DROP POLICY IF EXISTS "Project members can create income" ON public.income; 
DROP POLICY IF EXISTS "Users can update own income" ON public.income;

-- 2. Crear políticas simples que funcionen (como balances y expenses)
CREATE POLICY "Enable read for authenticated users on income" ON public.income
    FOR SELECT USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Enable insert for authenticated users on income" ON public.income
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for creators on income" ON public.income
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Enable delete for creators on income" ON public.income
    FOR DELETE USING (user_id = auth.uid());

-- 3. Verificar que funcionó
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'income';
