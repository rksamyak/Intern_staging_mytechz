import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toResumePDF } from '@/lib/resume/export-pdf'
import { toResumeDOCX } from '@/lib/resume/export-docx'

export async function GET(req) {
  const sp = new URL(req.url).searchParams
  const id = sp.get('id')
  const format = sp.get('format') || 'pdf'

  if (!id) return NextResponse.json({ error: 'Missing resume ID' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: resume, error } = await supabase
    .from('resume_documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

  const rawTitle = resume.title || 'Resume'
  // Sanitize filename: keep letters, digits, spaces, hyphens, underscores
  const safeTitle = rawTitle.replace(/[^\w\s\-]/g, '').trim().replace(/\s+/g, '_') || 'Resume'

  if (format === 'docx') {
    const buffer = await toResumeDOCX(resume.resume_data, resume.template_slug)
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
      },
    })
  }

  // Default: PDF
  const buffer = await toResumePDF(resume.resume_data, resume.template_slug)
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
    },
  })
}
