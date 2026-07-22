import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

async function getOwnedJob(userId, id, db) {
  const { data, error } = await db
    .from('resume_analysis_jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data
}

// GET /api/ats/[id] — full analysis with nested data
export async function GET(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()
  const job = await getOwnedJob(user.id, id, db)
  if (!job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  const [{ data: sections }, { data: keywords }, { data: insights }] = await Promise.all([
    db.from('resume_section_results').select('*').eq('analysis_id', id).order('section_name'),
    db.from('resume_keyword_results').select('*').eq('analysis_id', id).order('importance_score', { ascending: false }),
    db.from('resume_insights').select('*').eq('analysis_id', id).order('priority', { ascending: false }),
  ])

  const keywordCoveragePct = job.total_keywords_expected > 0
    ? Math.round((job.total_keywords_found / job.total_keywords_expected) * 100 * 10) / 10
    : 0
  const sectionCoveragePct = Math.round((job.total_sections_present / 9) * 100 * 10) / 10

  return NextResponse.json({
    success: true,
    analysis: {
      ...job,
      keyword_coverage_pct: keywordCoveragePct,
      section_coverage_pct: sectionCoveragePct,
      sections: sections || [],
      keywords: keywords || [],
      insights: insights || [],
    },
  })
}

// DELETE /api/ats/[id] — delete analysis + related rows
export async function DELETE(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()
  const job = await getOwnedJob(user.id, id, db)
  if (!job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  const { error } = await db.from('resume_analysis_jobs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, message: 'Analysis deleted.' })
}
