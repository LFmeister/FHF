-- Custom categories schema for projects
-- Run this in Supabase SQL editor

-- Create custom categories table
CREATE TABLE IF NOT EXISTS public.custom_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, name, type)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_custom_categories_project_type ON public.custom_categories(project_id, type);

-- Enable RLS
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view custom categories for projects they are members of
DROP POLICY IF EXISTS "Users can view custom categories for their projects" ON public.custom_categories;
CREATE POLICY "Users can view custom categories for their projects"
  ON public.custom_categories FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create custom categories for projects they are members of (not view-only)
DROP POLICY IF EXISTS "Users can create custom categories for their projects" ON public.custom_categories;
CREATE POLICY "Users can create custom categories for their projects"
  ON public.custom_categories FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role != 'view'
    )
  );

-- Users can update custom categories they created in projects they are members of
DROP POLICY IF EXISTS "Users can update their custom categories" ON public.custom_categories;
CREATE POLICY "Users can update their custom categories"
  ON public.custom_categories FOR UPDATE
  USING (
    created_by = auth.uid() AND
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role != 'view'
    )
  );

-- Users can delete custom categories they created in projects they are members of
DROP POLICY IF EXISTS "Users can delete their custom categories" ON public.custom_categories;
CREATE POLICY "Users can delete their custom categories"
  ON public.custom_categories FOR DELETE
  USING (
    created_by = auth.uid() AND
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid() AND role != 'view'
    )
  );

-- Create table for category preferences
CREATE TABLE IF NOT EXISTS public.category_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  hidden_categories text[] DEFAULT '{}',
  show_default_categories boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id, type)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_category_preferences_project_user_type ON public.category_preferences(project_id, user_id, type);

-- Enable RLS for category preferences
ALTER TABLE public.category_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for category preferences
DROP POLICY IF EXISTS "Users can manage their own category preferences" ON public.category_preferences;
CREATE POLICY "Users can manage their own category preferences"
  ON public.category_preferences FOR ALL
  USING (
    user_id = auth.uid() AND
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    project_id IN (
      SELECT project_id FROM public.project_members 
      WHERE user_id = auth.uid()
    )
  );
