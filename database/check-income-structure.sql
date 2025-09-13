-- Verificar la estructura actual de la tabla income
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'income' AND table_schema = 'public'
ORDER BY ordinal_position;

-- También verificar si hay datos de prueba
SELECT COUNT(*) as total_records FROM public.income;
