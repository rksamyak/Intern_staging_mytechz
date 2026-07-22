import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function POST(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()

  const { data: job } = await db
    .from('resume_analysis_jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  // Return all amber (medium-priority) weaknesses with actionable suggestions
  const { data: fixes, error } = await db
    .from('resume_insights')
    .select('id, title, suggestion, char_start, char_end, section_name, description')
    .eq('analysis_id', id)
    .eq('insight_type', 'weakness')
    .eq('priority', 2)
    .eq('highlight_color', 'amber')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    quick_fixes: fixes || [],
    total: fixes?.length ?? 0,
  })
}
