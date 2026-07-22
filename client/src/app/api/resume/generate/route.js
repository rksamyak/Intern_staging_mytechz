import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatJSON, safeParseJSON, isLLMConfigured } from '@/lib/ai/llm'
import { rateLimit } from '@/lib/ai/rate-limit'

export async function POST(req) {
  // Check LLM is configured before auth round-trip
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

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, context } = body

  try {
    if (action === 'summary') {
      const result = await chatJSON({
        system: `You are a professional resume writer. Generate a compelling 3-4 sentence professional summary based on the provided context. Focus on years of experience, key skills, notable achievements, and value proposition. Write in first person implied (no "I"). Be concise and impactful. Return JSON: { "summary": "..." }`,
        user: JSON.stringify(context),
        json: true,
        max: 400,
        smart: true,
      })
      const parsed = safeParseJSON(result, { summary: '' })
      if (!parsed?.summary) return NextResponse.json({ error: 'AI returned an empty summary. Please try again.' }, { status: 502 })
      return NextResponse.json(parsed)
    }

    if (action === 'improve-bullets') {
      const allHighlights = context?.bullets
      if (!allHighlights?.length) {
        return NextResponse.json({ error: 'No bullet points found. Add work experience first.' }, { status: 400 })
      }
      const result = await chatJSON({
        system: `You are a professional resume writer. Improve the given bullet points using the STAR method (Situation, Task, Action, Result). Make them quantifiable where possible. Start with strong action verbs. Keep each bullet under 20 words. Return JSON: { "improved": ["bullet1", "bullet2", ...] }`,
        user: JSON.stringify(context),
        json: true,
        max: 600,
        smart: true,
      })
      const parsed = safeParseJSON(result, { improved: [] })
      if (!parsed?.improved?.length) return NextResponse.json({ error: 'AI returned no improved bullets. Please try again.' }, { status: 502 })
      return NextResponse.json(parsed)
    }

    if (action === 'parse-text') {
      if (!context?.text?.trim()) {
        return NextResponse.json({ error: 'No text provided.' }, { status: 400 })
      }
      const result = await chatJSON({
        system: `You are a resume data extraction expert. The user provides a free-text description of their background and a target role. Extract and structure this into JSON Resume format. Be precise with dates, titles, skills, and achievements. Return JSON matching this schema:
{
  "basics": { "name": "", "label": "", "summary": "" },
  "work": [{ "name": "", "position": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "highlights": ["..."] }],
  "education": [{ "institution": "", "area": "", "studyType": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM" }],
  "skills": [{ "name": "", "level": "", "keywords": ["..."] }]
}
Only include fields you can extract with confidence.`,
        user: JSON.stringify(context),
        json: true,
        max: 1500,
        smart: true,
      })
      const parsed = safeParseJSON(result, {})
      return NextResponse.json(parsed)
    }

    if (action === 'ats-score') {
      if (!context?.jobDescription?.trim()) {
        return NextResponse.json({ error: 'No job description provided.' }, { status: 400 })
      }
      const result = await chatJSON({
        system: `You are an ATS (Applicant Tracking System) scoring expert. Analyze the resume data against the job description. Score it 0-100 based on keyword match, skills alignment, experience relevance, and formatting quality. Provide specific improvement suggestions. Return JSON:
{
  "score": 75,
  "breakdown": { "keywords": 80, "skills": 70, "experience": 75, "formatting": 85 },
  "missing_keywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`,
        user: JSON.stringify(context),
        json: true,
        max: 800,
        smart: true,
      })
      const parsed = safeParseJSON(result, { score: 0, breakdown: {}, missing_keywords: [], suggestions: [] })
      return NextResponse.json(parsed)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[resume/generate]', err)
    const msg = err?.message || 'AI request failed'
    if (msg.includes('401') || msg.includes('403')) {
      return NextResponse.json({ error: 'AI API key is invalid or expired. Please check your GROQ_API_KEY.' }, { status: 502 })
    }
    if (msg.includes('429')) {
      return NextResponse.json({ error: 'AI provider rate limit reached. Please wait a moment and try again.' }, { status: 429 })
    }
    return NextResponse.json({ error: `AI request failed: ${msg}` }, { status: 502 })
  }
}
