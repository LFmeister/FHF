-- SQL para agregar la funcionalidad de ingresos a la base de datos existente
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

-- 5. Trigger para actualizar updated_at
CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON public.income
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Función para calcular el balance del proyecto incluyendo ingresos
CREATE OR REPLACE FUNCTION calculate_project_balance(project_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total_income DECIMAL(15,2) := 0;
    total_expenses DECIMAL(15,2) := 0;
    initial_balance DECIMAL(15,2) := 0;
BEGIN
    -- Calcular total de ingresos aprobados
    SELECT COALESCE(SUM(amount), 0) INTO total_income
    FROM public.income
    WHERE project_id = project_uuid AND status = 'approved';
    
    -- Calcular total de gastos aprobados
    SELECT COALESCE(SUM(amount), 0) INTO total_expenses
    FROM public.expenses
    WHERE project_id = project_uuid AND status = 'approved';
    
    -- Obtener balance inicial del proyecto
    SELECT COALESCE(initial_balance, 0) INTO initial_balance
    FROM public.projects
    WHERE id = project_uuid;
    
    -- Retornar ingresos - gastos + balance inicial
    RETURN total_income - total_expenses + initial_balance;
END;
$$ language 'plpgsql';

-- 7. Función para actualizar el balance del proyecto cuando cambien ingresos/gastos
CREATE OR REPLACE FUNCTION update_project_balance_on_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET current_balance = calculate_project_balance(
            CASE 
                WHEN TG_OP = 'DELETE' THEN OLD.project_id
                ELSE NEW.project_id
            END
        )
        WHERE id = CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.project_id
            ELSE NEW.project_id
        END;
        
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 8. Triggers para actualización automática del balance
CREATE TRIGGER trigger_update_balance_on_income_change
    AFTER INSERT OR UPDATE OR DELETE ON public.income
    FOR EACH ROW EXECUTE FUNCTION update_project_balance_on_change();

-- 9. Actualizar trigger existente para gastos (si no existe)
DROP TRIGGER IF EXISTS trigger_update_balance_on_expense_change ON public.expenses;
CREATE TRIGGER trigger_update_balance_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_project_balance_on_change();

-- 11. Actualizar balances existentes de todos los proyectos
UPDATE public.projects 
SET current_balance = calculate_project_balance(id);

-- Comentarios sobre el funcionamiento:
-- 
-- La nueva estructura funciona así:
-- - INGRESOS: Dinero que entra al proyecto (ventas, pagos recibidos, etc.)
-- - GASTOS: Dinero que sale del proyecto (compras, costos, etc.)
-- - BALANCE INICIAL: Balance inicial del proyecto (campo initial_balance en projects)
-- - BALANCE FINAL = Ingresos - Gastos + Balance Inicial
--
-- El balance se actualiza automáticamente cada vez que se agrega, modifica o elimina:
-- - Un ingreso
-- - Un gasto
--
-- Formato de moneda colombiana:
-- - Los montos se ingresan como números enteros (ej: 100000)
-- - Se muestran formateados como $100,000 COP
