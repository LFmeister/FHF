-- Create logbook_entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create logbook_images table for storing multiple images per entry
CREATE TABLE IF NOT EXISTS logbook_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_logbook_entries_project ON logbook_entries(project_id);
CREATE INDEX idx_logbook_entries_date ON logbook_entries(entry_date DESC);
CREATE INDEX idx_logbook_images_entry ON logbook_images(entry_id);

-- Enable Row Level Security
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for logbook_entries
-- Allow project members to view entries
CREATE POLICY "logbook_entries_select_policy"
  ON logbook_entries
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  );

-- Allow project members with edit permission to insert entries
CREATE POLICY "logbook_entries_insert_policy"
  ON logbook_entries
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'normal')
    )
    AND user_id = auth.uid()
  );

-- Allow entry creator or admins to update entries
CREATE POLICY "logbook_entries_update_policy"
  ON logbook_entries
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT pm.project_id 
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
  );

-- Allow entry creator or admins to delete entries
CREATE POLICY "logbook_entries_delete_policy"
  ON logbook_entries
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR project_id IN (
      SELECT pm.project_id 
      FROM project_members pm
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
  );

-- Create RLS policies for logbook_images
-- Allow viewing images if user can view the entry
CREATE POLICY "logbook_images_select_policy"
  ON logbook_images
  FOR SELECT
  USING (
    entry_id IN (
      SELECT le.id 
      FROM logbook_entries le
      INNER JOIN project_members pm ON le.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
    )
  );

-- Allow inserting images if user can edit the entry
CREATE POLICY "logbook_images_insert_policy"
  ON logbook_images
  FOR INSERT
  WITH CHECK (
    entry_id IN (
      SELECT le.id 
      FROM logbook_entries le
      INNER JOIN project_members pm ON le.project_id = pm.project_id
      WHERE pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin', 'normal')
    )
  );

-- Allow deleting images if user owns the entry or is admin
CREATE POLICY "logbook_images_delete_policy"
  ON logbook_images
  FOR DELETE
  USING (
    entry_id IN (
      SELECT le.id 
      FROM logbook_entries le
      WHERE le.user_id = auth.uid()
        OR le.project_id IN (
          SELECT pm.project_id 
          FROM project_members pm
          WHERE pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    )
  );

-- Create storage bucket for logbook images
INSERT INTO storage.buckets (id, name, public)
VALUES ('logbook-images', 'logbook-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for logbook images
CREATE POLICY "logbook_images_upload_policy"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'logbook-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "logbook_images_view_policy"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'logbook-images'
  );

CREATE POLICY "logbook_images_delete_storage_policy"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'logbook-images'
    AND auth.uid() IS NOT NULL
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_logbook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logbook_entries_updated_at
  BEFORE UPDATE ON logbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_logbook_updated_at();
