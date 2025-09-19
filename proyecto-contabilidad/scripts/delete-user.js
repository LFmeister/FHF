// Script para eliminar usuario completamente
// Uso: node scripts/delete-user.js USER_EMAIL

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase (usar variables de entorno en producción)
const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseServiceKey = 'TU_SERVICE_ROLE_KEY' // ¡NUNCA en el frontend!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteUserCompletely(userEmail) {
  try {
    console.log(`🔍 Buscando usuario: ${userEmail}`)
    
    // 1. Buscar el usuario por email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Error buscando usuarios: ${listError.message}`)
    }

    const user = users.users.find(u => u.email === userEmail)
    
    if (!user) {
      console.log(`❌ Usuario no encontrado: ${userEmail}`)
      return
    }

    const userId = user.id
    console.log(`✅ Usuario encontrado: ${userId}`)

    // 2. Eliminar datos relacionados
    console.log('🗑️ Eliminando datos relacionados...')

    // Eliminar membresías de proyectos
    const { error: memberError } = await supabase
      .from('project_members')
      .delete()
      .eq('user_id', userId)
    
    if (memberError) {
      console.warn('⚠️ Error eliminando membresías:', memberError.message)
    } else {
      console.log('✅ Membresías eliminadas')
    }

    // Eliminar proyectos del usuario
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('created_by', userId)
    
    if (projectError) {
      console.warn('⚠️ Error eliminando proyectos:', projectError.message)
    } else {
      console.log('✅ Proyectos eliminados')
    }

    // Eliminar ingresos
    const { error: incomeError } = await supabase
      .from('income')
      .delete()
      .eq('created_by', userId)
    
    if (incomeError) {
      console.warn('⚠️ Error eliminando ingresos:', incomeError.message)
    } else {
      console.log('✅ Ingresos eliminados')
    }

    // Eliminar gastos
    const { error: expenseError } = await supabase
      .from('expenses')
      .delete()
      .eq('created_by', userId)
    
    if (expenseError) {
      console.warn('⚠️ Error eliminando gastos:', expenseError.message)
    } else {
      console.log('✅ Gastos eliminados')
    }

    // Eliminar inventario
    const { error: inventoryError } = await supabase
      .from('inventory_items')
      .delete()
      .eq('created_by', userId)
    
    if (inventoryError) {
      console.warn('⚠️ Error eliminando inventario:', inventoryError.message)
    } else {
      console.log('✅ Inventario eliminado')
    }

    // 3. Eliminar usuario de Auth
    console.log('🗑️ Eliminando usuario de Auth...')
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    
    if (authError) {
      throw new Error(`Error eliminando usuario de Auth: ${authError.message}`)
    }

    console.log('🎉 Usuario eliminado completamente!')
    console.log(`📧 Email: ${userEmail}`)
    console.log(`🆔 ID: ${userId}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Obtener email del argumento de línea de comandos
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('❌ Uso: node scripts/delete-user.js USER_EMAIL')
  console.log('📧 Ejemplo: node scripts/delete-user.js usuario@email.com')
  process.exit(1)
}

// Confirmar antes de proceder
console.log(`⚠️  ADVERTENCIA: Vas a eliminar completamente al usuario: ${userEmail}`)
console.log('⚠️  Esta acción NO se puede deshacer')
console.log('⚠️  Se eliminarán TODOS los datos relacionados')
console.log('')
console.log('Para continuar, ejecuta el script nuevamente con --confirm:')
console.log(`node scripts/delete-user.js ${userEmail} --confirm`)

if (process.argv[3] === '--confirm') {
  deleteUserCompletely(userEmail)
} else {
  process.exit(0)
}
