-- Inventory schema for Supabase
-- Run these statements in Supabase SQL editor or include in your migration pipeline

-- 1) Types
DO $$ BEGIN
  CREATE TYPE inventory_state AS ENUM ('bodega', 'uso', 'gastado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE inventory_from_state AS ENUM ('externo', 'bodega', 'uso');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  unit_value numeric(12,2) NULL,
  thumbnail_url text NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  from_state inventory_from_state NOT NULL,
  to_state inventory_state NOT NULL,
  note text NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NULL,
  file_size integer NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Storage bucket (create once)
-- In Supabase Storage, create a bucket named 'inventory-files' with public read access.
-- This file documents the requirement; bucket creation is not done via SQL here.

-- 4) Helper view (optional): current quantities per state per item
CREATE OR REPLACE VIEW public.inventory_item_state_quantities AS
SELECT
  i.id AS item_id,
  i.project_id,
  COALESCE(SUM(CASE WHEN m.from_state = 'externo' AND m.to_state = 'bodega' THEN m.quantity ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN m.from_state = 'bodega' AND m.to_state IN ('uso', 'gastado') THEN m.quantity ELSE 0 END), 0) AS qty_bodega,
  COALESCE(SUM(CASE WHEN m.from_state = 'bodega' AND m.to_state = 'uso' THEN m.quantity ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN m.from_state = 'uso' AND m.to_state = 'gastado' THEN m.quantity ELSE 0 END), 0) AS qty_uso,
  COALESCE(SUM(CASE WHEN m.to_state = 'gastado' THEN m.quantity ELSE 0 END), 0) AS qty_gastado
FROM public.inventory_items i
LEFT JOIN public.inventory_movements m ON m.item_id = i.id
GROUP BY i.id, i.project_id;
