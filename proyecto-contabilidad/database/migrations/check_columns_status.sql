-- Script de verificación: Estado actual de las columnas de fecha
-- Ejecutar este script para verificar qué columnas existen y su configuración

-- 1. Verificar columnas de la tabla expenses
SELECT 
    'expenses' as tabla,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('expense_date', 'created_at', 'updated_at')
ORDER BY column_name;

-- 2. Verificar columnas de la tabla income
SELECT 
    'income' as tabla,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'income' 
AND column_name IN ('income_date', 'created_at', 'updated_at')
ORDER BY column_name;

-- 3. Verificar índices existentes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('expenses', 'income')
AND indexname LIKE '%date%'
ORDER BY tablename, indexname;

-- 4. Contar registros con fechas NULL
SELECT 
    'expenses' as tabla,
    COUNT(*) as total_registros,
    COUNT(expense_date) as con_expense_date,
    COUNT(*) - COUNT(expense_date) as sin_expense_date
FROM expenses
UNION ALL
SELECT 
    'income' as tabla,
    COUNT(*) as total_registros,
    COUNT(income_date) as con_income_date,
    COUNT(*) - COUNT(income_date) as sin_income_date
FROM income;

-- 5. Mostrar algunos registros de ejemplo
SELECT 
    'expenses' as tabla,
    id,
    expense_date,
    created_at,
    CASE 
        WHEN expense_date IS NULL THEN 'FALTA FECHA'
        ELSE 'OK'
    END as estado
FROM expenses 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 
    'income' as tabla,
    id,
    income_date,
    created_at,
    CASE 
        WHEN income_date IS NULL THEN 'FALTA FECHA'
        ELSE 'OK'
    END as estado
FROM income 
ORDER BY created_at DESC 
LIMIT 5;
