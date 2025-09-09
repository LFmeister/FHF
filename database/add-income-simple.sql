-- SQL simplificado para agregar solo la tabla de ingresos
-- Ejecuta estos comandos en tu editor SQL de Supabase

-- 1. Crear la tabla de ingresos
CREATE TABLE public.income (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100),
    income_date DATE NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX idx_income_project_id ON public.income(project_id);
CREATE INDEX idx_income_user_id ON public.income(user_id);
CREATE INDEX idx_income_date ON public.income(income_date);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad para la tabla income
CREATE POLICY "Project members can view income" ON public.income
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = income.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create income" ON public.income
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = income.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own income" ON public.income
    FOR UPDATE USING (user_id = auth.uid());

-- 5. Trigger para actualizar updated_at (solo si la función existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON public.income
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Listo! Ahora tienes la tabla income funcionando.
-- 
-- Para usar el sistema completo:
-- 1. Los ingresos se guardan en la tabla 'income'
-- 2. Los gastos se guardan en la tabla 'expenses' (que ya existe)
-- 3. El balance se calcula en el frontend como: Ingresos - Gastos
--
-- Formato de moneda colombiana:
-- - Los montos se ingresan como números enteros (ej: 100000)
-- - Se muestran formateados como $100,000 COP
