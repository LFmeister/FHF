-- CONFIGURACIÓN DEL BUCKET DE STORAGE PARA ARCHIVOS DE GASTOS
-- Ejecutar en Supabase SQL Editor

-- 1. Crear el bucket expense-files (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-files', 'expense-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage para el bucket expense-files
-- Permitir subir archivos a usuarios autenticados
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'expense-files' 
  AND auth.role() = 'authenticated'
);

-- Permitir ver archivos a usuarios autenticados
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'expense-files' 
  AND auth.role() = 'authenticated'
);

-- Permitir actualizar archivos al propietario
CREATE POLICY "Allow users to update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'expense-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir eliminar archivos al propietario
CREATE POLICY "Allow users to delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'expense-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
