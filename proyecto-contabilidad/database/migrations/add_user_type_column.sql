-- Migración: Configurar tipos de usuario (normal/master)
-- Fecha: 2024-01-20
-- Descripción: Configura sistema de tipos de usuario usando raw_user_meta_data

-- IMPORTANTE: En Supabase, usar raw_user_meta_data en lugar de user_metadata

-- Función para actualizar el tipo de usuario
CREATE OR REPLACE FUNCTION update_user_type(user_email text, user_type text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('type', user_type)
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el tipo de usuario
CREATE OR REPLACE FUNCTION get_user_type(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'type' FROM auth.users WHERE id = user_id),
    'normal'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si un usuario es master
CREATE OR REPLACE FUNCTION is_user_master(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT raw_user_meta_data->>'type' FROM auth.users WHERE id = user_id) = 'master',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Establecer todos los usuarios existentes como 'normal' por defecto
-- Solo actualizar usuarios que no tienen tipo definido
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"type": "normal"}'::jsonb
WHERE raw_user_meta_data->>'type' IS NULL OR raw_user_meta_data IS NULL;

-- Crear un trigger para establecer tipo 'normal' por defecto en nuevos usuarios
CREATE OR REPLACE FUNCTION set_default_user_type()
RETURNS trigger AS $$
BEGIN
  -- Solo agregar tipo si no existe
  IF NEW.raw_user_meta_data IS NULL OR NEW.raw_user_meta_data->>'type' IS NULL THEN
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"type": "normal"}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar el trigger (verificar si existe primero)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS set_default_user_type_trigger ON auth.users;
  CREATE TRIGGER set_default_user_type_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_user_type();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No se pudo crear el trigger. Esto es normal en algunos entornos de Supabase.';
END $$;

-- Comentarios para documentación
COMMENT ON FUNCTION update_user_type(text, text) IS 'Actualiza el tipo de usuario (normal/master)';
COMMENT ON FUNCTION get_user_type(uuid) IS 'Obtiene el tipo de usuario, devuelve normal por defecto';
COMMENT ON FUNCTION is_user_master(uuid) IS 'Verifica si un usuario es de tipo master';

-- Verificar que la migración fue exitosa
SELECT 
  email,
  user_metadata->>'type' as user_type,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;
