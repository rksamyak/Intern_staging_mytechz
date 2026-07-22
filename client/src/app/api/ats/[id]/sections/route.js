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

  const { data: job } = await db
    .from('resume_analysis_jobs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!job) return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })

  const { data: sections, error } = await db
    .from('resume_section_results')
    .select('*')
    .eq('analysis_id', id)
    .order('section_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, sections: sections || [] })
}
