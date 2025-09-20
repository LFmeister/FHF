import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// DELETE /api/account/delete
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = authHeader.split(' ')[1]
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user from the access token
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.getUser(accessToken)
    if (getUserError || !userData?.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = userData.user.id

    // Delete the user using the service role key
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message || 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 })
  }
}
