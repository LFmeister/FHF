-- Fix duplicate category preferences
-- Run this in Supabase SQL editor to clean up any duplicate records

-- First, let's see if there are any duplicates
-- SELECT project_id, user_id, type, COUNT(*) as count
-- FROM public.category_preferences
-- GROUP BY project_id, user_id, type
-- HAVING COUNT(*) > 1;

-- Remove duplicate records, keeping only the most recent one
WITH ranked_preferences AS (
  SELECT 
    id,
    project_id,
    user_id,
    type,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, user_id, type 
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM public.category_preferences
)
DELETE FROM public.category_preferences
WHERE id IN (
  SELECT id 
  FROM ranked_preferences 
  WHERE rn > 1
);

-- Verify the unique constraint is working
-- This should return 0 rows if successful
SELECT project_id, user_id, type, COUNT(*) as count
FROM public.category_preferences
GROUP BY project_id, user_id, type
HAVING COUNT(*) > 1;
