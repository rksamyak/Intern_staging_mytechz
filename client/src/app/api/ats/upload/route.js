import 'server-only'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { runAnalysis } from '@/lib/ats/engine'
import { getKeywordsForRoles } from '@/lib/ats/keywords'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let file, jobRoles
  try {
    const form = await req.formData()
    file = form.get('resume_file')
    // job_roles can be sent as repeated fields or a JSON string
    const raw = form.getAll('job_roles')
    if (raw.length === 1 && raw[0].startsWith('[')) {
      jobRoles = JSON.parse(raw[0])
    } else {
      jobRoles = raw.filter(Boolean)
    }
  } catch {
    return NextResponse.json({ error: 'Could not read form data.' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large. Max 10 MB.' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Only PDF, DOCX, DOC, and TXT files accepted.' }, { status: 400 })

  const ext = file.name.split('.').pop().toLowerCase()

  // ── Extract text ────────────────────────────────────────────────────────
  let text = ''
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (ext === 'pdf' || file.type === 'application/pdf') {
      text = await extractPDF(buffer)
    } else if (ext === 'docx' || file.type.includes('wordprocessingml')) {
      text = await extractDOCX(buffer)
    } else {
      text = buffer.toString('utf-8')
    }
  } catch (err) {
    console.error('[ats/upload] extraction error', err)
    return NextResponse.json({ error: 'Failed to extract text from file. Ensure the file is not corrupted or password-protected.' }, { status: 400 })
  }

  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 50) {
    return NextResponse.json({ error: 'Could not extract readable text. Try a different format.' }, { status: 400 })
  }

  // ── Run analysis ────────────────────────────────────────────────────────
  const roleSlugs = (jobRoles || []).map(r => r.toLowerCase().replace(/\s+/g, '-'))
  const keywords = getKeywordsForRoles(roleSlugs)
  const result = runAnalysis(cleaned, keywords)

  const db = getAdminClient()

  // ── Persist analysis job ────────────────────────────────────────────────
  const { data: job, error: jobErr } = await db
    .from('resume_analysis_jobs')
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_type: ext,
      file_size_bytes: file.size,
      extracted_text: cleaned,
      selected_job_roles: jobRoles || [],
      ats_score: result.atsScore,
      keyword_score: result.keywordScore,
      section_score: result.sectionScore,
      format_score: result.formatScore,
      action_verb_score: result.actionVerbScore,
      quantification_score: result.quantificationScore,
      readability_score: result.readabilityScore,
      total_keywords_found: result.totalKeywordsFound,
      total_keywords_expected: result.totalKeywordsExpected,
      total_sections_present: result.totalSectionsPresent,
      total_sections_expected: result.totalSectionsExpected,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (jobErr) {
    console.error('[ats/upload] insert job', jobErr)
    return NextResponse.json({ error: 'Failed to save analysis.' }, { status: 500 })
  }

  const analysisId = job.id

  // ── Persist section results ────────────────────────────────────────────
  const sectionRows = Object.entries(result.sectionData).map(([name, data]) => {
    const { score, feedback } = result.sectionScores[name] || {}
    return {
      analysis_id: analysisId,
      section_name: name,
      is_present: data.isPresent,
      strength_score: score ?? 0,
      word_count: data.wordCount,
      char_count: data.charCount,
      bullet_count: data.bulletCount,
      feedback: feedback ?? '',
      char_start: data.charStart,
      char_end: data.charEnd,
    }
  })
  await db.from('resume_section_results').insert(sectionRows)

  // ── Persist keyword results ────────────────────────────────────────────
  if (result.keywordResults.length > 0) {
    const kwRows = result.keywordResults.map(kw => ({
      analysis_id: analysisId,
      keyword: kw.keyword,
      keyword_type: kw.keywordType,
      job_role_context: kw.jobRoleContext,
      importance_level: kw.importanceLevel,
      importance_score: kw.importanceScore,
      is_present: kw.isPresent,
      frequency: kw.frequency,
      found_in_sections: kw.foundInSections,
      context_snippet: kw.contextSnippet.slice(0, 300),
      char_positions: kw.charPositions,
    }))
    // Insert in chunks to avoid request size limits
    for (let i = 0; i < kwRows.length; i += 100) {
      await db.from('resume_keyword_results').insert(kwRows.slice(i, i + 100))
    }
  }

  // ── Persist insights ───────────────────────────────────────────────────
  if (result.insights.length > 0) {
    const insightRows = result.insights.map(ins => ({
      analysis_id: analysisId,
      insight_type: ins.insightType,
      category: ins.category,
      title: ins.title,
      description: ins.description,
      suggestion: ins.suggestion,
      ai_rewrites: [],
      priority: ins.priority,
      section_name: ins.sectionName,
      char_start: ins.charStart,
      char_end: ins.charEnd,
      highlight_color: ins.highlightColor,
    }))
    await db.from('resume_insights').insert(insightRows)
  }

  return NextResponse.json({
    success: true,
    analysis_id: analysisId,
    ats_score: result.atsScore,
    keyword_score: result.keywordScore,
    section_score: result.sectionScore,
    status: 'completed',
  }, { status: 201 })
}

// ── Text Extraction Helpers ────────────────────────────────────────────────

async function extractPDF(buffer) {
  // Method 1: pdf-parse v2 class API with Node.js-safe options
  try {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({
      data: new Uint8Array(buffer),
      verbosity: 0,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      disableRange: true,
      disableStream: true,
    })
    const result = await parser.getText()
    await parser.destroy()
    const text = result?.text || ''
    if (text.trim().length > 5) return text
  } catch {}

  // Method 2: pdfjs-dist directly with worker disabled
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      disableRange: true,
      disableStream: true,
    }).promise
    let text = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
    }
    await doc.destroy()
    return text
  } catch (e2) {
    throw new Error(`PDF extraction failed: ${e2.message}`)
  }
}

async function extractDOCX(buffer) {
  const mammoth = await import('mammoth')
  const extractor = mammoth.default?.extractRawText ?? mammoth.extractRawText
  const result = await extractor({ buffer })
  return result.value || ''
}
