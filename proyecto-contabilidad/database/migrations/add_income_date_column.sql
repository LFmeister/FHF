-- Migración: Agregar columna income_date a la tabla income (SEGURA)
-- Fecha: 2024-01-19
-- Descripción: Agrega la columna income_date para almacenar la fecha real del ingreso (diferente de created_at)

-- Verificar si la columna ya existe antes de crearla
DO $$ 
BEGIN
    -- Agregar la columna income_date solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'income' AND column_name = 'income_date'
    ) THEN
        ALTER TABLE income ADD COLUMN income_date DATE;
        RAISE NOTICE 'Columna income_date agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna income_date ya existe, saltando creación';
    END IF;

    -- Actualizar registros existentes para usar created_at como income_date inicial
    UPDATE income 
    SET income_date = DATE(created_at) 
    WHERE income_date IS NULL;

    -- Hacer la columna NOT NULL después de actualizar los datos existentes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'income' AND column_name = 'income_date' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE income ALTER COLUMN income_date SET NOT NULL;
        RAISE NOTICE 'Columna income_date configurada como NOT NULL';
    ELSE
        RAISE NOTICE 'Columna income_date ya es NOT NULL';
    END IF;

    -- Crear índice solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'income' AND indexname = 'idx_income_income_date'
    ) THEN
        CREATE INDEX idx_income_income_date ON income(income_date);
        RAISE NOTICE 'Índice idx_income_income_date creado exitosamente';
    ELSE
        RAISE NOTICE 'Índice idx_income_income_date ya existe';
    END IF;

END $$;

-- Agregar comentario a la columna para documentación
COMMENT ON COLUMN income.income_date IS 'Fecha real en que ocurrió el ingreso (diferente de created_at que es cuando se registró)';

-- Verificar que la migración fue exitosa
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'income' 
AND column_name = 'income_date';
