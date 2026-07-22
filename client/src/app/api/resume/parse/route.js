import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatJSON, safeParseJSON, isLLMConfigured } from '@/lib/ai/llm'
import { rateLimit } from '@/lib/ai/rate-limit'

export async function POST(req) {
  // Check LLM configured first
  if (!isLLMConfigured()) {
    return NextResponse.json(
      { error: 'AI service is not configured. Please set GROQ_API_KEY in your environment.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (await rateLimit(user.id)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again shortly.' }, { status: 429 })
  }

  let file
  try {
    const formData = await req.formData()
    file = formData.get('file')
  } catch {
    return NextResponse.json({ error: 'Could not read uploaded file.' }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!validTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF and DOCX files are supported.' }, { status: 400 })
  }

  // ── Extract text ────────────────────────────────────────────────────────────
  let text = ''

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === 'application/pdf') {
      text = await extractPDF(buffer)
    } else {
      text = await extractDOCX(buffer)
    }
  } catch (err) {
    console.error('[resume/parse] extraction error:', err)
    return NextResponse.json({ error: 'Failed to extract text from the uploaded file. Make sure the file is not password-protected or corrupted.' }, { status: 400 })
  }

  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length < 40) {
    return NextResponse.json({ error: 'Could not extract readable text from the file. Try a different format.' }, { status: 400 })
  }

  // Limit to ~6000 chars for LLM context
  const content = trimmed.slice(0, 6000)

  // ── AI structured extraction ────────────────────────────────────────────────
  let result
  try {
    result = await chatJSON({
      system: `You are a resume parsing expert. Extract ALL available structured data from the resume text below. Return JSON matching exactly this schema:
{
  "basics": {
    "name": "",
    "label": "",
    "email": "",
    "phone": "",
    "summary": "",
    "location": { "city": "", "region": "" },
    "profiles": [{ "network": "", "url": "", "username": "" }]
  },
  "work": [{
    "name": "",
    "position": "",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM",
    "current": false,
    "summary": "",
    "highlights": ["Achievement or responsibility sentence"]
  }],
  "education": [{
    "institution": "",
    "area": "",
    "studyType": "",
    "startDate": "YYYY-MM",
    "endDate": "YYYY-MM",
    "score": ""
  }],
  "skills": [{ "name": "Category name", "level": "", "keywords": ["skill1", "skill2"] }],
  "projects": [{ "name": "", "description": "", "highlights": ["..."], "url": "" }],
  "certificates": [{ "name": "", "issuer": "", "date": "YYYY-MM" }],
  "languages": [{ "language": "", "fluency": "" }]
}

Rules:
- Use YYYY-MM for all dates (e.g. "2021-06"). If only year is known use "YYYY-01".
- Group related skills under one category (e.g. "Frontend": ["React", "TypeScript"]).
- Extract ALL bullet points and responsibilities as highlights arrays.
- Extract ALL certifications, projects, and languages mentioned.
- If a value cannot be determined, use empty string "" not null.
- Return ONLY valid JSON, no explanation text.`,
      user: content,
      json: true,
      max: 2500,
      smart: true,
    })
  } catch (err) {
    console.error('[resume/parse] chatJSON error:', err)
    const msg = err?.message || ''
    if (msg.includes('401') || msg.includes('403')) {
      return NextResponse.json({ error: 'AI API key is invalid or expired. Please check your GROQ_API_KEY.' }, { status: 502 })
    }
    if (msg.includes('429')) {
      return NextResponse.json({ error: 'AI rate limit reached. Please wait a moment and try again.' }, { status: 429 })
    }
    return NextResponse.json({ error: `AI parsing failed: ${msg}` }, { status: 502 })
  }

  const parsed = safeParseJSON(result, null)
  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ error: 'AI could not structure the resume data. Please try again.' }, { status: 502 })
  }

  return NextResponse.json(parsed)
}

// ── PDF text extraction ───────────────────────────────────────────────────────
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
      text += content.items.map((item) => item.str).join(' ') + '\n'
    }
    await doc.destroy()
    return text
  } catch (e2) {
    throw new Error(`PDF extraction failed: ${e2.message}`)
  }
}

// ── DOCX text extraction ─────────────────────────────────────────────────────
async function extractDOCX(buffer) {
  const mammoth = await import('mammoth')
  // mammoth may be default export or named
  const extractor = mammoth.default?.extractRawText ?? mammoth.extractRawText
  if (typeof extractor !== 'function') throw new Error('mammoth.extractRawText not found')
  const result = await extractor({ buffer })
  return result.value || ''
}
