/**
 * ATS Analysis Engine — pure JS, no external ML deps.
 * Works on plain extracted text from any resume format.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Section Detection Patterns
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_PATTERNS = {
  contact: [
    /\b(contact|email|phone|mobile|address|linkedin|github|portfolio)\b/i,
    /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
    /\+?[\d\s\-().]{7,}/,
  ],
  summary: [
    /\b(summary|profile|objective|about me|career objective|professional summary|personal statement|overview)\b/i,
  ],
  experience: [
    /\b(experience|work experience|employment|work history|professional experience|career history|positions held|job history)\b/i,
  ],
  education: [
    /\b(education|academic|qualification|degree|university|college|school|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|b\.?sc|m\.?sc|mba|phd|bachelor|master)\b/i,
  ],
  skills: [
    /\b(skills|technical skills|core competencies|competencies|expertise|technologies|tech stack|key skills|proficiencies)\b/i,
  ],
  certifications: [
    /\b(certifications?|certificates?|credentials?|licenses?|accreditations?|aws certified|google certified|microsoft certified|pmp|cissp|cfa)\b/i,
  ],
  projects: [
    /\b(projects?|personal projects?|side projects?|portfolio projects?|academic projects?|key projects?)\b/i,
  ],
  achievements: [
    /\b(achievements?|awards?|honors?|accomplishments?|recognition|accolades?|milestones?)\b/i,
  ],
  languages: [
    /\b(languages?|spoken languages?|language proficiency|linguistic skills)\b/i,
    /\b(english|hindi|tamil|telugu|kannada|malayalam|marathi|bengali|gujarati|punjabi|french|german|spanish|mandarin)\b/i,
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Verbs + Weak Phrases
// ─────────────────────────────────────────────────────────────────────────────

const ACTION_VERBS = new Set([
  'led','built','developed','designed','architected','implemented','deployed',
  'launched','created','established','founded','initiated','spearheaded',
  'pioneered','drove','delivered','achieved','managed','directed','oversaw',
  'coordinated','supervised','mentored','coached','trained','onboarded',
  'optimized','improved','enhanced','increased','reduced','decreased','cut',
  'saved','generated','grew','scaled','expanded','negotiated','secured',
  'won','closed','sold','pitched','presented','analyzed','evaluated',
  'assessed','researched','identified','resolved','troubleshot','debugged',
  'fixed','migrated','integrated','automated','streamlined','modernized',
  'revamped','restructured','collaborated','partnered','facilitated',
  'organized','planned','strategized','forecasted','modeled','programmed',
  'coded','engineered','tested','validated','verified','documented','authored',
  'published','contributed','maintained','supported','administered',
  'configured','monitored','tracked','reported','communicated',
])

const WEAK_PATTERNS = [
  /\bresponsible for\b/i,
  /\bworked on\b/i,
  /\bhelped with\b/i,
  /\bassisted in\b/i,
  /\bpart of a team\b/i,
  /\bwas involved in\b/i,
  /\bhandled\b/i,
  /\bdealt with\b/i,
]

// ─────────────────────────────────────────────────────────────────────────────
// Quantification Patterns
// ─────────────────────────────────────────────────────────────────────────────

const QUANT_PATTERNS = [
  /\d+\s*%/,
  /\$\s*\d[\d,]*(?:\.\d+)?[kmb]?/i,
  /₹\s*\d[\d,]*(?:\.\d+)?[lc]?/i,
  /\b\d[\d,]+\+?\s*(users?|clients?|customers?|employees?|team members?)\b/i,
  /\b\d+x\b/i,
  /\b(increased|decreased|reduced|improved|grew|saved)\b.{0,40}\b\d+/i,
  /\b\d+\s*(years?|months?|weeks?)\b/i,
  /\b\d[\d,]*\s*(projects?|applications?|systems?|features?|tickets?)\b/i,
]

// ─────────────────────────────────────────────────────────────────────────────
// Section Detection
// ─────────────────────────────────────────────────────────────────────────────

export function detectSections(text) {
  const lower = text.toLowerCase()
  const result = {}

  for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
    let matchStart = -1

    for (const pattern of patterns) {
      const m = lower.match(pattern)
      if (m) {
        const idx = lower.indexOf(m[0])
        if (matchStart === -1 || idx < matchStart) matchStart = idx
        break
      }
    }

    if (matchStart !== -1) {
      // Estimate section end: first next section that starts after this one
      let nextStart = text.length
      for (const [other, otherPatterns] of Object.entries(SECTION_PATTERNS)) {
        if (other === section) continue
        for (const op of otherPatterns) {
          const searchFrom = matchStart + 10
          const sub = lower.slice(searchFrom)
          const om = sub.match(op)
          if (om) {
            const candidate = searchFrom + sub.indexOf(om[0])
            if (candidate < nextStart && candidate > matchStart) {
              nextStart = candidate
            }
            break
          }
        }
      }

      const sectionText = text.slice(matchStart, Math.min(nextStart, matchStart + 3000))
      const words = sectionText.split(/\s+/).filter(Boolean)
      const bullets = (sectionText.match(/^\s*[•\-*\u2022]/gm) || []).length

      result[section] = {
        isPresent: true,
        charStart: matchStart,
        charEnd: Math.min(nextStart, matchStart + 3000),
        wordCount: words.length,
        charCount: sectionText.length,
        bulletCount: bullets,
      }
    } else {
      result[section] = {
        isPresent: false,
        charStart: null,
        charEnd: null,
        wordCount: 0,
        charCount: 0,
        bulletCount: 0,
      }
    }
  }

  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Scoring
// ─────────────────────────────────────────────────────────────────────────────

export function scoreSection(sectionName, data) {
  if (!data.isPresent) {
    return {
      score: 0,
      feedback: `Section "${capitalize(sectionName)}" is missing. Add it to improve your ATS score.`,
    }
  }

  const { wordCount, bulletCount } = data
  let score = 50
  let feedback = ''

  switch (sectionName) {
    case 'contact':
      score = 90
      feedback = 'Contact info detected.'
      break
    case 'summary':
      if (wordCount < 30) { score = 40; feedback = `Summary too short (${wordCount} words). Aim for 50–80 words.` }
      else if (wordCount > 150) { score = 65; feedback = `Summary too long (${wordCount} words). Keep under 100 words.` }
      else { score = 85; feedback = 'Summary length is good.' }
      break
    case 'experience':
      if (bulletCount === 0) { score = 45; feedback = 'No bullet points in Experience. Use bullets for each role.' }
      else if (bulletCount < 3) { score = 60; feedback = `Only ${bulletCount} bullets found. Aim for 3–5 per role.` }
      else { score = 80; feedback = `${bulletCount} bullet points found — good structure.` }
      if (wordCount < 100) { score = Math.max(score - 15, 30); feedback += ' Experience section seems thin.' }
      break
    case 'education':
      score = wordCount >= 15 ? 80 : 55
      if (wordCount < 15) feedback = 'Add degree, institution, and year.'
      else feedback = 'Education section detected.'
      break
    case 'skills':
      if (wordCount < 10) { score = 45; feedback = 'Very few skills listed. Add 8–12 relevant skills.' }
      else if (wordCount < 25) { score = 65; feedback = 'Consider adding more role-specific skills.' }
      else { score = 85; feedback = 'Good number of skills listed.' }
      break
    case 'certifications':
      score = wordCount >= 5 ? 80 : 55
      feedback = 'Certifications section detected.'
      break
    case 'projects':
      score = bulletCount >= 2 ? 75 : 55
      feedback = bulletCount < 2 ? 'Add bullet points to describe project contributions.' : 'Projects section looks good.'
      break
    default:
      score = wordCount >= 5 ? 70 : 50
      feedback = `${capitalize(sectionName)} section detected.`
  }

  return { score: Math.min(score, 100), feedback }
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword Matching
// ─────────────────────────────────────────────────────────────────────────────

export function matchKeywords(text, keywords) {
  const lower = text.toLowerCase()
  return keywords.map(kw => {
    const needle = kw.keyword.toLowerCase()
    const pattern = needle.includes(' ')
      ? new RegExp(escapeRegex(needle), 'gi')
      : new RegExp(`\\b${escapeRegex(needle)}\\b`, 'gi')

    const matches = [...lower.matchAll(pattern)]
    const isPresent = matches.length > 0
    const charPositions = matches.map(m => [m.index, m.index + m[0].length])

    let contextSnippet = ''
    if (matches.length > 0) {
      const start = Math.max(0, matches[0].index - 40)
      const end = Math.min(text.length, matches[0].index + needle.length + 40)
      contextSnippet = text.slice(start, end).trim()
    }

    return {
      keyword: kw.keyword,
      keywordType: kw.keywordType,
      jobRoleContext: kw.roleName,
      importanceLevel: kw.importance,
      importanceScore: kw.weight * 10,
      isPresent,
      frequency: matches.length,
      foundInSections: [],
      contextSnippet,
      charPositions,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Verb Score
// ─────────────────────────────────────────────────────────────────────────────

export function scoreActionVerbs(text) {
  const bullets = [
    ...(text.match(/^\s*[•\-*\u2022]\s*(.+)/gm) || []),
    ...(text.match(/^\s*([A-Z][^.!?\n]{10,80})/gm) || []),
  ]

  if (bullets.length === 0) return { score: 30, weakPhrases: [] }

  let strong = 0
  const weakPhrases = []

  for (const bullet of bullets) {
    // Strip the bullet marker itself (•, -, *) before reading the first word —
    // otherwise a "- Led the..." bullet reads "-" as the first word and never
    // matches ACTION_VERBS, scoring every hyphen-bulleted resume as 0.
    const withoutMarker = bullet.trim().replace(/^[•\-*•]\s*/, '')
    const firstWord = withoutMarker.split(/\s+/)[0].toLowerCase().replace(/[.,]$/, '')
    if (ACTION_VERBS.has(firstWord)) strong++
    for (const wp of WEAK_PATTERNS) {
      if (wp.test(bullet)) { weakPhrases.push(bullet.trim().slice(0, 100)); break }
    }
  }

  const ratio = strong / bullets.length
  const penalty = Math.min(weakPhrases.length * 8, 30)
  const score = Math.max(0, Math.min(100, Math.round(ratio * 100) - penalty))
  return { score, weakPhrases }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quantification Score
// ─────────────────────────────────────────────────────────────────────────────

export function scoreQuantification(text) {
  const bullets = [
    ...(text.match(/^\s*[•\-*\u2022]\s*(.+)/gm) || []),
    ...(text.match(/^\s*([A-Z][^.!?\n]{10,80})/gm) || []),
  ]
  if (bullets.length === 0) return 25
  let quantified = 0
  for (const b of bullets) {
    if (QUANT_PATTERNS.some(p => p.test(b))) quantified++
  }
  return Math.min(100, Math.round((quantified / bullets.length) * 120))
}

// ─────────────────────────────────────────────────────────────────────────────
// Format Score
// ─────────────────────────────────────────────────────────────────────────────

export function scoreFormat(text) {
  let score = 100
  const deductions = []
  const wordCount = text.split(/\s+/).filter(Boolean).length

  if (wordCount < 150) { score -= 25; deductions.push('Resume seems very short (under 150 words).') }
  else if (wordCount > 1200) { score -= 10; deductions.push('Resume may be too long (over 1200 words).') }
  if (!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text)) { score -= 15; deductions.push('No email address detected.') }
  if (!/\+?[\d\s\-().]{7,}/.test(text)) { score -= 10; deductions.push('No phone number detected.') }

  return { score: Math.max(0, score), deductions }
}

// ─────────────────────────────────────────────────────────────────────────────
// Readability Score
// ─────────────────────────────────────────────────────────────────────────────

export function scoreReadability(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)
  if (sentences.length === 0) return 50
  const avgWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
  if (avgWords >= 10 && avgWords <= 25) return 90
  if (avgWords < 10) return 65
  return Math.max(40, 90 - Math.round((avgWords - 25) * 3))
}

// ─────────────────────────────────────────────────────────────────────────────
// Composite ATS Score
// ─────────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  keyword: 0.35,
  section: 0.25,
  format: 0.15,
  actionVerb: 0.10,
  quantification: 0.10,
  readability: 0.05,
}

export function computeAtsScore({ keyword, section, format, actionVerb, quantification, readability }) {
  return Math.round(
    keyword * WEIGHTS.keyword
    + section * WEIGHTS.section
    + format * WEIGHTS.format
    + actionVerb * WEIGHTS.actionVerb
    + quantification * WEIGHTS.quantification
    + readability * WEIGHTS.readability
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight Generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateInsights(sectionData, sectionScores, keywordResults, weakPhrases, formatDeductions) {
  const insights = []

  // Section insights
  for (const [name, data] of Object.entries(sectionData)) {
    const { score, feedback } = sectionScores[name] || {}
    if (data.isPresent) {
      if (score >= 75) {
        insights.push({
          insightType: 'strength', category: 'section',
          title: `${capitalize(name)} section is strong`,
          description: feedback, suggestion: '',
          priority: 1, sectionName: name, highlightColor: 'green',
          charStart: data.charStart, charEnd: data.charEnd,
        })
      } else if (score < 60) {
        insights.push({
          insightType: 'weakness', category: 'section',
          title: `${capitalize(name)} section needs improvement`,
          description: feedback,
          suggestion: `Expand your ${name} section with more specific details.`,
          priority: 2, sectionName: name, highlightColor: 'amber',
          charStart: data.charStart, charEnd: data.charEnd,
        })
      }
    } else {
      insights.push({
        insightType: 'weakness', category: 'section',
        title: `Missing section: ${capitalize(name)}`,
        description: `The ${capitalize(name)} section was not detected in your resume.`,
        suggestion: `Add a clearly labelled "${capitalize(name)}" section.`,
        priority: 3, sectionName: name, highlightColor: 'red',
        charStart: null, charEnd: null,
      })
    }
  }

  // Keyword insights
  const missingRequired = keywordResults.filter(k => !k.isPresent && k.importanceLevel === 'required')
  const presentKw = keywordResults.filter(k => k.isPresent)

  if (missingRequired.length > 0) {
    const names = missingRequired.slice(0, 5).map(k => k.keyword).join(', ')
    insights.push({
      insightType: 'weakness', category: 'keyword',
      title: `${missingRequired.length} required keywords missing`,
      description: `Missing: ${names}${missingRequired.length > 5 ? '…' : ''}`,
      suggestion: 'Add these keywords naturally in your Skills and Experience sections.',
      priority: 3, sectionName: 'skills', highlightColor: 'red',
      charStart: null, charEnd: null,
    })
  }

  if (presentKw.length >= 5) {
    insights.push({
      insightType: 'strength', category: 'keyword',
      title: `${presentKw.length} keywords matched`,
      description: `Your resume contains ${presentKw.length} relevant keywords for the selected role.`,
      suggestion: '', priority: 1, sectionName: '', highlightColor: 'green',
      charStart: null, charEnd: null,
    })
  }

  // Weak phrase insights
  for (const phrase of weakPhrases.slice(0, 3)) {
    insights.push({
      insightType: 'weakness', category: 'action_verb',
      title: 'Weak phrasing detected',
      description: `Passive phrase: "${phrase.slice(0, 80)}"`,
      suggestion: 'Replace with a strong action verb (e.g. "Led", "Built", "Increased").',
      priority: 2, sectionName: 'experience', highlightColor: 'amber',
      charStart: null, charEnd: null,
    })
  }

  // Format insights
  for (const d of formatDeductions) {
    insights.push({
      insightType: 'weakness', category: 'format',
      title: 'Format issue detected',
      description: d,
      suggestion: 'Fix this to improve ATS parseability.',
      priority: 2, sectionName: 'contact', highlightColor: 'amber',
      charStart: null, charEnd: null,
    })
  }

  return insights
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Analysis Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export function runAnalysis(text, keywords) {
  // 1. Detect sections
  const sectionData = detectSections(text)

  // 2. Score each section
  const sectionScores = {}
  for (const [name, data] of Object.entries(sectionData)) {
    sectionScores[name] = scoreSection(name, data)
  }

  // 3. Match keywords
  const keywordResults = matchKeywords(text, keywords)

  // 4. Individual scores
  const presentCount = Object.values(sectionData).filter(d => d.isPresent).length
  const foundKw = keywordResults.filter(k => k.isPresent).length
  const totalKw = keywordResults.length

  const keywordScore = totalKw > 0 ? Math.round((foundKw / totalKw) * 100) : 50
  const sectionScore = Math.round((presentCount / 9) * 100)
  const { score: formatScore, deductions: formatDeductions } = scoreFormat(text)
  const { score: actionVerbScore, weakPhrases } = scoreActionVerbs(text)
  const quantificationScore = scoreQuantification(text)
  const readabilityScore = scoreReadability(text)

  // 5. Composite ATS score
  const atsScore = computeAtsScore({
    keyword: keywordScore,
    section: sectionScore,
    format: formatScore,
    actionVerb: actionVerbScore,
    quantification: quantificationScore,
    readability: readabilityScore,
  })

  // 6. Insights
  const insights = generateInsights(sectionData, sectionScores, keywordResults, weakPhrases, formatDeductions)

  return {
    atsScore,
    keywordScore,
    sectionScore,
    formatScore,
    actionVerbScore,
    quantificationScore,
    readabilityScore,
    totalKeywordsFound: foundKw,
    totalKeywordsExpected: totalKw,
    totalSectionsPresent: presentCount,
    totalSectionsExpected: 9,
    sectionData,
    sectionScores,
    keywordResults,
    insights,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
