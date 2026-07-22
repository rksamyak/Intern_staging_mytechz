import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()

  // Verify ownership
  const { data: job } = await db
    .from('resume_analysis_jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  const { data: keywords, error } = await db
    .from('resume_keyword_results')
    .select('*')
    .eq('analysis_id', id)
    .order('importance_score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by keyword_type
  const grouped = {}
  for (const kw of keywords || []) {
    if (!grouped[kw.keyword_type]) grouped[kw.keyword_type] = { found: [], missing: [] }
    grouped[kw.keyword_type][kw.is_present ? 'found' : 'missing'].push(kw)
  }

  return NextResponse.json({ success: true, grouped, total: keywords?.length ?? 0 })
}
