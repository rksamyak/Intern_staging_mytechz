import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getAdminClient()
  const { data, error } = await db
    .from('resume_analysis_jobs')
    .select(`
      id, file_name, file_type, selected_job_roles, detected_job_role,
      ats_score, keyword_score, section_score,
      total_keywords_found, total_keywords_expected,
      total_sections_present, total_sections_expected,
      status, created_at, completed_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, analyses: data, total: data.length })
}
