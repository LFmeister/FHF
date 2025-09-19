-- Migración: Agregar columna expense_date a la tabla expenses (SEGURA)
-- Fecha: 2024-01-19
-- Descripción: Agrega la columna expense_date para almacenar la fecha real del gasto (diferente de created_at)

-- Verificar si la columna ya existe antes de crearla
DO $$ 
BEGIN
    -- Agregar la columna expense_date solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'expense_date'
    ) THEN
        ALTER TABLE expenses ADD COLUMN expense_date DATE;
        RAISE NOTICE 'Columna expense_date agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna expense_date ya existe, saltando creación';
    END IF;

    -- Actualizar registros existentes para usar created_at como expense_date inicial
    UPDATE expenses 
    SET expense_date = DATE(created_at) 
    WHERE expense_date IS NULL;

    -- Hacer la columna NOT NULL después de actualizar los datos existentes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'expense_date' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE expenses ALTER COLUMN expense_date SET NOT NULL;
        RAISE NOTICE 'Columna expense_date configurada como NOT NULL';
    ELSE
        RAISE NOTICE 'Columna expense_date ya es NOT NULL';
    END IF;

    -- Crear índice solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'expenses' AND indexname = 'idx_expenses_expense_date'
    ) THEN
        CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
        RAISE NOTICE 'Índice idx_expenses_expense_date creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice idx_expenses_expense_date ya existe';
    END IF;

END $$;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN expenses.expense_date IS 'Fecha real en que ocurrió el gasto (diferente de created_at que es cuando se registró)';

-- Verificar que la migración fue exitosa
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name = 'expense_date';
