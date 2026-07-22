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

  const { data: job, error: jobErr } = await db
    .from('resume_analysis_jobs')
    .select('id, extracted_text, edited_text, ats_score, edited_ats_score, selected_job_roles, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })
  if (job.status !== 'completed') return NextResponse.json({ error: 'Analysis not yet complete.' }, { status: 400 })

  const [{ data: sections }, { data: insights }] = await Promise.all([
    db.from('resume_section_results').select('*').eq('analysis_id', id).order('section_name'),
    db.from('resume_insights')
      .select('id, insight_type, highlight_color, char_start, char_end, title, description, suggestion, ai_rewrites, section_name')
      .eq('analysis_id', id)
      .not('char_start', 'is', null)
      .order('priority', { ascending: false }),
  ])

  const highlights = (insights || []).map(ins => ({
    insight_id: ins.id,
    type: ins.insight_type,
    color: ins.highlight_color,
    char_start: ins.char_start,
    char_end: ins.char_end,
    title: ins.title,
    description: ins.description,
    suggestion: ins.suggestion,
    ai_rewrites: ins.ai_rewrites || [],
    section_name: ins.section_name,
  }))

  return NextResponse.json({
    success: true,
    editor: {
      id: job.id,
      extracted_text: job.extracted_text,
      edited_text: job.edited_text,
      ats_score: job.ats_score,
      edited_ats_score: job.edited_ats_score,
      selected_job_roles: job.selected_job_roles,
      sections: sections || [],
      highlights,
    },
  })
}
