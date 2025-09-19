# 👑 Sistema de Usuario Master - Gestión Exclusiva de Usuarios

## 🎯 **Sistema Implementado**

He creado un sistema donde **solo un usuario específico con tipo "master"** puede eliminar usuarios y gestionar el sistema.

### **Características del Sistema:**
- ✅ **Columna `type`** en user_metadata (normal/master)
- ✅ **Todos los usuarios son "normal"** por defecto
- ✅ **Solo usuarios "master"** pueden eliminar usuarios
- ✅ **Panel exclusivo** para usuarios master
- ✅ **Verificación de permisos** en cada acción

## 🔧 **1. Migración de Base de Datos**

### **Archivo:** `database/migrations/add_user_type_column.sql`

**Funciones creadas:**
```sql
-- Actualizar tipo de usuario
update_user_type(user_email, user_type)

-- Obtener tipo de usuario  
get_user_type(user_id)

-- Trigger para usuarios nuevos (tipo 'normal' por defecto)
set_default_user_type_trigger
```

**Para ejecutar:**
1. Ve a **Supabase Dashboard > SQL Editor**
2. Copia y pega el contenido del archivo
3. Ejecuta la migración

## 🔧 **2. Servicio de Admin Actualizado**

### **Archivo:** `src/lib/admin.ts`

**Funciones principales:**
```javascript
// Verificar si es usuario master
await adminService.isMaster(userId)

// Eliminar usuario completamente (solo master)
await adminService.deleteUser(userId)

// Cambiar tipo de usuario (solo master)
await adminService.updateUserType(userId, 'master')

// Obtener lista de usuarios
await adminService.getUsers()
```

## 🎨 **3. Componente Master**

### **Archivo:** `src/components/admin/MasterUserManagement.tsx`

**Características:**
- ✅ **Verificación automática** de permisos master
- ✅ **Lista todos los usuarios** con sus tipos
- ✅ **Eliminar usuarios** con confirmación segura
- ✅ **Cambiar tipos** de normal ↔ master
- ✅ **Interfaz intuitiva** con iconos y colores
- ✅ **Protección** contra auto-eliminación

## 🚀 **4. Página de Admin**

### **URL:** `http://localhost:3000/admin`

**Acceso:**
- ✅ **Usuario autenticado** ✓
- ✅ **Email confirmado** ✓  
- ✅ **Tipo "master"** ✓

**Si no es master:**
```
🛡️ Acceso Denegado
Solo usuarios con tipo "master" pueden acceder a esta herramienta.
Tu tipo actual: normal
```

## 🔐 **Cómo Crear el Primer Usuario Master**

### **Opción 1: Desde Supabase Dashboard**
1. Ve a **Authentication > Users**
2. Haz clic en el usuario que quieres hacer master
3. En **User Metadata**, agrega:
```json
{
  "type": "master"
}
```
4. Guarda los cambios

### **Opción 2: Usando SQL**
```sql
-- Reemplaza 'master@email.com' con el email del usuario
UPDATE auth.users 
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || '{"type": "master"}'::jsonb
WHERE email = 'master@email.com';
```

### **Opción 3: Usando la función creada**
```sql
SELECT update_user_type('master@email.com', 'master');
```

## 🎯 **Flujo de Uso**

### **1. Usuario Normal intenta acceder:**
```
http://localhost:3000/admin
↓
🛡️ Acceso Denegado
"Solo usuarios master pueden acceder"
```

### **2. Usuario Master accede:**
```
http://localhost:3000/admin
↓
👑 Panel Master
- Lista de todos los usuarios
- Botones para eliminar
- Botones para cambiar tipo
```

### **3. Eliminar Usuario:**
```
1. Master hace clic en "Eliminar"
2. Prompt: "Escribe ELIMINAR para confirmar"
3. Sistema elimina TODO:
   - Usuario de Auth
   - Todos sus proyectos
   - Todos sus ingresos/gastos
   - Todo su inventario
   - Sus membresías
```

### **4. Cambiar Tipo de Usuario:**
```
1. Master hace clic en "Hacer Master" o "Hacer Normal"
2. Prompt: "Escribe CONFIRMAR para proceder"
3. Sistema actualiza el tipo de usuario
```

## 🔒 **Medidas de Seguridad**

### **Verificaciones Implementadas:**
- ✅ **No auto-eliminación**: Master no puede eliminarse a sí mismo
- ✅ **Confirmación doble**: Requiere escribir "ELIMINAR" exactamente
- ✅ **Verificación de permisos**: En cada acción
- ✅ **Logs de errores**: Para debugging
- ✅ **Estados de loading**: Para evitar clicks múltiples

### **Protecciones de la Base de Datos:**
- ✅ **Trigger automático**: Nuevos usuarios son "normal"
- ✅ **Funciones seguras**: Con SECURITY DEFINER
- ✅ **Validación de tipos**: Solo 'normal' o 'master'

## 🎨 **Interfaz del Panel Master**

### **Diseño Visual:**
```
👑 Panel Master
⚠️ Acceso Restringido: Solo usuarios master

📋 Usuarios Registrados (3)

┌─────────────────────────────────────────────────┐
│ 👑 Luis F                    [Hacer Normal] [🗑️] │
│    master@email.com                              │
│    Registrado: 15/01/2024 • Email confirmado    │
│    • Tipo: master                                │
├─────────────────────────────────────────────────┤
│ 👤 Juan Pérez               [Hacer Master] [🗑️] │
│    juan@email.com                                │
│    Registrado: 16/01/2024 • Email confirmado    │
│    • Tipo: normal                                │
└─────────────────────────────────────────────────┘

⚠️ Zona de Peligro - Solo Master
• Elimina el usuario de Supabase Auth
• Elimina todos sus proyectos
• Esta acción NO se puede deshacer
```

## 📊 **Estados de Usuario**

| Tipo | Puede Acceder | Puede Eliminar | Puede Cambiar Tipos |
|------|---------------|----------------|---------------------|
| **normal** | ❌ | ❌ | ❌ |
| **master** | ✅ | ✅ | ✅ |

## 🚀 **Próximos Pasos**

1. **Ejecutar la migración** en Supabase
2. **Crear el primer usuario master** usando una de las opciones
3. **Probar el acceso** a `/admin`
4. **Verificar funcionalidades**:
   - Eliminar usuario de prueba
   - Cambiar tipo de usuario
   - Verificar que usuarios normales no pueden acceder

## 🔧 **Comandos Útiles**

### **Verificar tipos de usuarios:**
```sql
SELECT 
  email,
  user_metadata->>'type' as user_type,
  created_at
FROM auth.users 
ORDER BY created_at DESC;
```

### **Contar usuarios por tipo:**
```sql
SELECT 
  COALESCE(user_metadata->>'type', 'normal') as user_type,
  COUNT(*) as count
FROM auth.users 
GROUP BY user_metadata->>'type';
```

### **Hacer master a un usuario:**
```sql
SELECT update_user_type('usuario@email.com', 'master');
```

### **Quitar permisos master:**
```sql
SELECT update_user_type('usuario@email.com', 'normal');
```

## ✅ **Resultado Final**

- 🔐 **Solo usuarios master** pueden eliminar usuarios
- 🗑️ **Eliminación completa** de todos los datos
- 👑 **Panel exclusivo** con interfaz profesional
- 🛡️ **Múltiples capas** de seguridad
- 📱 **Diseño responsive** para móviles
- ⚠️ **Confirmaciones obligatorias** para acciones peligrosas

**¡El sistema está listo para usar! Solo necesitas crear el primer usuario master.** 🎉
