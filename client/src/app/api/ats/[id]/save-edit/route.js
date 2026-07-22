import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { getKeywordsForRoles } from '@/lib/ats/keywords'
import {
  detectSections, scoreSection, matchKeywords,
  scoreFormat, scoreActionVerbs, scoreQuantification,
  scoreReadability, computeAtsScore,
} from '@/lib/ats/engine'

export async function PATCH(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let editedText
  try {
    const body = await req.json()
    editedText = body?.edited_text
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!editedText || typeof editedText !== 'string' || editedText.trim().length < 20) {
    return NextResponse.json({ error: 'edited_text is required and must have content.' }, { status: 400 })
  }

  const db = getAdminClient()
  const { data: job, error: jobErr } = await db
    .from('resume_analysis_jobs')
    .select('id, ats_score, selected_job_roles')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  // Re-score the edited text
  const roleSlugs = (job.selected_job_roles || []).map(r => r.toLowerCase().replace(/\s+/g, '-'))
  const keywords = getKeywordsForRoles(roleSlugs)
  const kwResults = matchKeywords(editedText, keywords)
  const found = kwResults.filter(k => k.isPresent).length
  const total = kwResults.length

  const sectionData = detectSections(editedText)
  const presentCount = Object.values(sectionData).filter(d => d.isPresent).length
  const sectionScores = {}
  for (const [name, data] of Object.entries(sectionData)) {
    sectionScores[name] = scoreSection(name, data)
  }

  const keywordScore     = total > 0 ? Math.round((found / total) * 100) : 50
  const sectionScore     = Math.round((presentCount / 9) * 100)
  const { score: formatScore }     = scoreFormat(editedText)
  const { score: actionVerbScore } = scoreActionVerbs(editedText)
  const quantificationScore        = scoreQuantification(editedText)
  const readabilityScore           = scoreReadability(editedText)

  const newAts = computeAtsScore({
    keyword: keywordScore, section: sectionScore,
    format: formatScore, actionVerb: actionVerbScore,
    quantification: quantificationScore, readability: readabilityScore,
  })

  const { error: updateErr } = await db
    .from('resume_analysis_jobs')
    .update({
      edited_text: editedText,
      edited_ats_score: newAts,
      last_edited_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    message: 'Resume saved and re-scored.',
    original_ats_score: Number(job.ats_score),
    edited_ats_score: newAts,
    improvement: Math.round((newAts - Number(job.ats_score)) * 100) / 100,
  })
}
