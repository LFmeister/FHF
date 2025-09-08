# Crear Bucket de Storage en Supabase

## Pasos en Supabase Dashboard:

1. **Ve a Storage** en el panel lateral izquierdo
2. **Click en "Create bucket"**
3. **Configuración del bucket:**
   - **Name**: `expense-files`
   - **Public bucket**: ✅ **ACTIVADO** (muy importante)
   - **File size limit**: 50 MB
   - **Allowed MIME types**: 
     ```
     image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.*,application/vnd.ms-excel,text/*
     ```

4. **Click "Create bucket"**

5. **Después ejecuta el SQL** del archivo `setup-storage-bucket.sql` en el SQL Editor

## ¿Por qué es necesario?
- El error 400 indica que el bucket no existe
- Supabase Storage requiere que el bucket sea público para subir archivos
- Las políticas RLS del archivo SQL configuran los permisos correctos
