-- Migración: Agregar columna expense_date a la tabla expenses
-- Fecha: 2024-01-19
-- Descripción: Agrega la columna expense_date para almacenar la fecha real del gasto (diferente de created_at)

-- Agregar la columna expense_date
ALTER TABLE expenses 
ADD COLUMN expense_date DATE;

-- Actualizar registros existentes para usar created_at como expense_date inicial
UPDATE expenses 
SET expense_date = DATE(created_at) 
WHERE expense_date IS NULL;

-- Hacer la columna NOT NULL después de actualizar los datos existentes
ALTER TABLE expenses 
ALTER COLUMN expense_date SET NOT NULL;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN expenses.expense_date IS 'Fecha real en que ocurrió el gasto (diferente de created_at que es cuando se registró)';

-- Crear índice para mejorar consultas por fecha
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- Verificar que la migración fue exitosa
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name = 'expense_date';
