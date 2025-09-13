-- Corregir las políticas de la tabla income para que coincidan con tu estructura existente
-- Ejecuta este SQL en Supabase

-- 1. Eliminar políticas existentes de income
DROP POLICY IF EXISTS "Project members can view income" ON public.income;
DROP POLICY IF EXISTS "Project members can create income" ON public.income;
DROP POLICY IF EXISTS "Users can update own income" ON public.income;

-- 2. Crear políticas simples como las otras tablas
CREATE POLICY "Enable read for authenticated users on income" ON public.income
    FOR SELECT USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Enable insert for authenticated users on income" ON public.income
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for creators on income" ON public.income
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Enable delete for creators on income" ON public.income
    FOR DELETE USING (user_id = auth.uid());

-- 3. Verificar que la tabla income tenga la estructura correcta
-- Si falta algún campo, agrégalo:
DO $$
BEGIN
    -- Verificar si falta el campo created_by (como en balances y expenses)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'income' AND column_name = 'created_by') THEN
        ALTER TABLE public.income ADD COLUMN created_by UUID REFERENCES auth.users(id);
        -- Actualizar registros existentes
        UPDATE public.income SET created_by = user_id WHERE created_by IS NULL;
    END IF;
END $$;
