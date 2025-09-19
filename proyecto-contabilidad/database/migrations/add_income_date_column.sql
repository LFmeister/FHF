-- Migración: Agregar columna income_date a la tabla income
-- Fecha: 2024-01-19
-- Descripción: Agrega la columna income_date para almacenar la fecha real del ingreso (diferente de created_at)

-- Agregar la columna income_date
ALTER TABLE income 
ADD COLUMN income_date DATE;

-- Actualizar registros existentes para usar created_at como income_date inicial
UPDATE income 
SET income_date = DATE(created_at) 
WHERE income_date IS NULL;

-- Hacer la columna NOT NULL después de actualizar los datos existentes
ALTER TABLE income 
ALTER COLUMN income_date SET NOT NULL;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN income.income_date IS 'Fecha real en que ocurrió el ingreso (diferente de created_at que es cuando se registró)';

-- Crear índice para mejorar consultas por fecha
CREATE INDEX idx_income_income_date ON income(income_date);

-- Verificar que la migración fue exitosa
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'income' 
AND column_name = 'income_date';
