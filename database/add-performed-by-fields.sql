-- SQL migration to add performed_by fields to support role-based access control
-- This allows tracking both who performed the transaction and who registered it
-- Execute these commands in your Supabase SQL editor

-- 1. Add performed_by field to income table
ALTER TABLE public.income 
ADD COLUMN performed_by UUID REFERENCES public.users(id);

-- 2. Add performed_by field to expenses table  
ALTER TABLE public.expenses
ADD COLUMN performed_by UUID REFERENCES public.users(id);

-- 3. Add performed_by field to balances table
ALTER TABLE public.balances
ADD COLUMN performed_by UUID REFERENCES public.users(id);

-- 4. Add date field to balances table (if not exists)
ALTER TABLE public.balances
ADD COLUMN balance_date DATE DEFAULT CURRENT_DATE;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_income_performed_by ON public.income(performed_by);
CREATE INDEX IF NOT EXISTS idx_expenses_performed_by ON public.expenses(performed_by);
CREATE INDEX IF NOT EXISTS idx_balances_performed_by ON public.balances(performed_by);
CREATE INDEX IF NOT EXISTS idx_balances_date ON public.balances(balance_date);

-- 6. Update existing records to set performed_by same as created_by (user_id) for backward compatibility
UPDATE public.income SET performed_by = user_id WHERE performed_by IS NULL;
UPDATE public.expenses SET performed_by = created_by WHERE performed_by IS NULL;
UPDATE public.balances SET performed_by = created_by WHERE performed_by IS NULL;

-- 7. Add NOT NULL constraint after updating existing records
ALTER TABLE public.income ALTER COLUMN performed_by SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN performed_by SET NOT NULL;
ALTER TABLE public.balances ALTER COLUMN performed_by SET NOT NULL;

-- Comments:
-- 
-- New field structure:
-- - performed_by: The user who actually performed the transaction (selectable in forms)
-- - created_by/user_id: The user who registered the transaction (current session user)
-- 
-- This allows for proper audit trails where:
-- - "Realizado por" shows who performed the transaction
-- - "Registrado por" shows who entered it into the system
-- 
-- The migration preserves existing data by setting performed_by = created_by for all existing records.
