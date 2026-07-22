import 'server-only'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, TabStopPosition, TabStopType,
} from 'docx'

const COLORS = {
  classic: '1E40AF',
  modern: '7C3AED',
  minimal: '374151',
  creative: '059669',
  professional: '0F172A',
  tech: 'EA580C',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-')
  if (!year) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (month) return `${months[parseInt(month, 10) - 1]} ${year}`
  return year
}

function heading(text, color) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color, font: 'Calibri' })],
  })
}

function titleDate(left, right, color) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: left, bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
      new TextRun({ text: `\t${right}`, size: 18, color: '94A3B8', font: 'Calibri' }),
    ],
  })
}

function body(text, color = '334155') {
  return new Paragraph({
    children: [new TextRun({ text, size: 19, color, font: 'Calibri' })],
  })
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 19, color: '334155', font: 'Calibri' })],
  })
}

export async function toResumeDOCX(resumeData, templateSlug = 'classic') {
  const color = COLORS[templateSlug] || COLORS.classic
  const d = resumeData || {}
  const basics = d.basics || {}
  const work = d.work || []
  const education = d.education || []
  const skills = d.skills || []
  const projects = d.projects || []
  const certificates = d.certificates || []
  const languages = d.languages || []

  const children = []

  // Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [new TextRun({ text: basics.name || 'Your Name', bold: true, size: 36, color: '0F172A', font: 'Calibri' })],
    })
  )
  if (basics.label) {
    children.push(body(basics.label, color))
  }

  // Contact
  const parts = []
  if (basics.email) parts.push(basics.email)
  if (basics.phone) parts.push(basics.phone)
  if (basics.location?.city) {
    let loc = basics.location.city
    if (basics.location.region) loc += `, ${basics.location.region}`
    parts.push(loc)
  }
  if (basics.url) parts.push(basics.url)
  basics.profiles?.forEach((p) => {
    if (p.url || p.username) parts.push(`${p.network}: ${p.url || p.username}`)
  })
  if (parts.length) {
    children.push(new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: parts.join('  |  '), size: 17, color: '94A3B8', font: 'Calibri' })],
    }))
  }

  // Summary
  if (basics.summary) {
    children.push(heading('Professional Summary', color))
    children.push(body(basics.summary))
  }

  // Experience
  if (work.length > 0) {
    children.push(heading('Experience', color))
    work.forEach((w, i) => {
      if (i > 0) children.push(new Paragraph({ spacing: { before: 120 } }))
      const dateStr = `${formatDate(w.startDate)} — ${w.current ? 'Present' : formatDate(w.endDate)}`
      children.push(titleDate(w.position || '', dateStr, color))
      children.push(body(w.name || '', color))
      if (w.summary) children.push(body(w.summary))
      ;(w.highlights || []).filter(Boolean).forEach((h) => children.push(bullet(h)))
    })
  }

  // Education
  if (education.length > 0) {
    children.push(heading('Education', color))
    education.forEach((e, i) => {
      if (i > 0) children.push(new Paragraph({ spacing: { before: 100 } }))
      const degree = `${e.studyType ? `${e.studyType} in ` : ''}${e.area || ''}`
      const dateStr = `${formatDate(e.startDate)} — ${formatDate(e.endDate)}`
      children.push(titleDate(degree, dateStr, color))
      children.push(body(e.institution || '', color))
      if (e.score) children.push(body(`Score: ${e.score}`, '94A3B8'))
    })
  }

  // Skills
  if (skills.length > 0) {
    children.push(heading('Skills', color))
    skills.forEach((s) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${s.name}: `, bold: true, size: 19, color: '0F172A', font: 'Calibri' }),
          new TextRun({ text: (s.keywords || []).join(', '), size: 19, color: '334155', font: 'Calibri' }),
        ],
      }))
    })
  }

  // Projects
  if (projects.length > 0) {
    children.push(heading('Projects', color))
    projects.forEach((p) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.name || '', bold: true, size: 20, color: '0F172A', font: 'Calibri' })],
      }))
      if (p.description) children.push(body(p.description))
      ;(p.highlights || []).filter(Boolean).forEach((h) => children.push(bullet(h)))
    })
  }

  // Certifications
  if (certificates.length > 0) {
    children.push(heading('Certifications', color))
    certificates.forEach((c) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: c.name, bold: true, size: 19, color: '0F172A', font: 'Calibri' }),
          new TextRun({ text: ` — ${c.issuer}${c.date ? ` (${formatDate(c.date)})` : ''}`, size: 19, color: '334155', font: 'Calibri' }),
        ],
      }))
    })
  }

  // Languages
  if (languages.length > 0) {
    children.push(heading('Languages', color))
    const langText = languages.map((l) => `${l.language} (${l.fluency})`).join('  |  ')
    children.push(body(langText))
  }

  const doc = new Document({
    creator: 'MyTechZ Resume Builder',
    title: `${basics.name || 'Resume'} — Resume`,
    styles: { default: { document: { run: { font: 'Calibri', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    720,   // 0.5 in
            bottom: 720,
            left:   1080,  // 0.75 in
            right:  1080,
          },
        },
      },
      children,
    }],
  })

  return Packer.toBuffer(doc)
}
