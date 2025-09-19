# Migraciones de Base de Datos

## Problema Identificado
Las tablas `expenses` e `income` no tienen las columnas `expense_date` e `income_date` respectivamente, que son necesarias para almacenar la fecha real de las transacciones (diferente de `created_at` que es cuando se registró en el sistema).

## Migraciones Creadas

### 1. `add_expense_date_column.sql`
- **Propósito**: Agregar columna `expense_date` a la tabla `expenses`
- **Tipo**: `DATE`
- **Descripción**: Fecha real en que ocurrió el gasto

### 2. `add_income_date_column.sql`
- **Propósito**: Agregar columna `income_date` a la tabla `income`
- **Tipo**: `DATE`
- **Descripción**: Fecha real en que ocurrió el ingreso

## Cómo Ejecutar las Migraciones

### Opción 1: Panel de Supabase (Recomendado)
1. Ve al panel de Supabase de tu proyecto
2. Navega a **SQL Editor**
3. Copia y pega el contenido de cada archivo `.sql`
4. Ejecuta las migraciones en este orden:
   - Primero: `add_expense_date_column.sql`
   - Segundo: `add_income_date_column.sql`

### Opción 2: CLI de Supabase
```bash
# Si tienes Supabase CLI instalado
supabase db reset
# O ejecutar migraciones específicas
psql -h your-db-host -U postgres -d your-db-name -f add_expense_date_column.sql
psql -h your-db-host -U postgres -d your-db-name -f add_income_date_column.sql
```

### Opción 3: Herramienta de Base de Datos
Usa cualquier cliente PostgreSQL (pgAdmin, DBeaver, etc.) para ejecutar los scripts.

## Qué Hacen las Migraciones

### Para `expenses`:
1. ✅ Agrega columna `expense_date DATE`
2. ✅ Actualiza registros existentes usando `DATE(created_at)`
3. ✅ Hace la columna `NOT NULL`
4. ✅ Agrega comentario de documentación
5. ✅ Crea índice para optimizar consultas

### Para `income`:
1. ✅ Agrega columna `income_date DATE`
2. ✅ Actualiza registros existentes usando `DATE(created_at)`
3. ✅ Hace la columna `NOT NULL`
4. ✅ Agrega comentario de documentación
5. ✅ Crea índice para optimizar consultas

## Verificación Post-Migración

Después de ejecutar las migraciones, verifica que funcionaron:

```sql
-- Verificar columna expense_date
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' AND column_name = 'expense_date';

-- Verificar columna income_date
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'income' AND column_name = 'income_date';

-- Verificar datos existentes
SELECT id, expense_date, created_at FROM expenses LIMIT 5;
SELECT id, income_date, created_at FROM income LIMIT 5;
```

## Impacto en la Aplicación

Una vez ejecutadas las migraciones:
- ✅ **Los formularios funcionarán correctamente**
- ✅ **Se podrán crear gastos e ingresos sin errores**
- ✅ **Los registros existentes tendrán fechas válidas**
- ✅ **Las consultas por fecha funcionarán**

## Rollback (Si es necesario)

Si necesitas revertir las migraciones:

```sql
-- Revertir expenses
ALTER TABLE expenses DROP COLUMN expense_date;
DROP INDEX IF EXISTS idx_expenses_expense_date;

-- Revertir income
ALTER TABLE income DROP COLUMN income_date;
DROP INDEX IF EXISTS idx_income_income_date;
```

## Notas Importantes

- ⚠️ **Haz backup** antes de ejecutar migraciones en producción
- ✅ **Los datos existentes se preservan** usando `created_at` como fecha inicial
- ✅ **Los índices mejoran el rendimiento** de consultas por fecha
- ✅ **Las migraciones son seguras** y no eliminan datos existentes
