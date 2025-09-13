-- Update project_members table to support new role system
-- This script updates the existing role system from 'owner'/'member' to 'owner'/'admin'/'normal'/'view'

-- First, let's see the current structure
SELECT DISTINCT role FROM project_members;

-- Step 1: Drop the existing check constraint that's preventing the update
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_role_check;

-- Step 2: Update existing 'member' roles to 'view' (new default for members)
UPDATE project_members 
SET role = 'view' 
WHERE role = 'member';

-- Step 3: Add new constraint to ensure only valid roles are used
ALTER TABLE project_members ADD CONSTRAINT project_members_role_check 
CHECK (role IN ('owner', 'admin', 'normal', 'view'));

-- Verify the changes
SELECT role, COUNT(*) as count 
FROM project_members 
GROUP BY role 
ORDER BY role;
