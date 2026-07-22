import 'server-only'
import PDFDocument from 'pdfkit'

// Color palette per template
const PALETTES = {
  classic:      { primary: '#1e40af', heading: '#0f172a', text: '#334155', light: '#94a3b8' },
  modern:       { primary: '#7c3aed', heading: '#0f172a', text: '#334155', light: '#94a3b8' },
  minimal:      { primary: '#374151', heading: '#111827', text: '#4b5563', light: '#9ca3af' },
  creative:     { primary: '#059669', heading: '#0f172a', text: '#334155', light: '#94a3b8' },
  professional: { primary: '#0f172a', heading: '#0f172a', text: '#334155', light: '#64748b' },
  tech:         { primary: '#ea580c', heading: '#0f172a', text: '#334155', light: '#94a3b8' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month] = dateStr.split('-')
  if (!year) return dateStr
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  if (month) return `${months[parseInt(month, 10) - 1]} ${year}`
  return year
}

// Hex color string → PDFKit-compatible hex
function hex(c) { return c.startsWith('#') ? c : `#${c}` }

export function toResumePDF(resumeData, templateSlug = 'classic') {
  return new Promise((resolve, reject) => {
    const colors = PALETTES[templateSlug] || PALETTES.classic
    const d = resumeData || {}
    const basics       = d.basics       || {}
    const work         = d.work         || []
    const education    = d.education    || []
    const skills       = d.skills       || []
    const projects     = d.projects     || []
    const certificates = d.certificates || []
    const languages    = d.languages    || []

    const doc = new PDFDocument({ size: 'A4', margins: { top: 44, bottom: 44, left: 52, right: 52 } })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const ml  = doc.page.margins.left
    const mr  = doc.page.margins.right
    const mt  = doc.page.margins.top
    const mb  = doc.page.margins.bottom
    const pageW = doc.page.width - ml - mr

    // ── Helpers ────────────────────────────────────────────────────────────────

    function checkBreak(needed = 60) {
      if (doc.y + needed > doc.page.height - mb - 20) doc.addPage()
    }

    // Section heading with a colored underline
    function sectionHeading(label) {
      checkBreak(40)
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(hex(colors.heading))
        .text(label.toUpperCase(), ml, doc.y, { width: pageW, characterSpacing: 0.8 })
      const y = doc.y
      doc.moveTo(ml, y).lineTo(ml + pageW, y)
        .strokeColor(hex(colors.primary)).lineWidth(1).stroke()
      doc.y = y + 4
    }

    // Title row: bold left + light date right — uses explicit x/y to avoid PDFKit continued-text bugs
    function titleRow(titleText, dateText) {
      checkBreak(16)
      const y        = doc.y
      const dateColW = 108

      // Date on the right
      doc.font('Helvetica').fontSize(8.5).fillColor(hex(colors.light))
        .text(dateText, ml + pageW - dateColW, y, {
          width: dateColW, align: 'right', lineBreak: false,
        })

      // Bold title on the left (leaves room for date)
      doc.font('Helvetica-Bold').fontSize(10).fillColor(hex(colors.heading))
        .text(titleText, ml, y, {
          width: pageW - dateColW - 6, lineBreak: false,
        })

      doc.y = y + 13
    }

    // Sub-label (company / institution) in accent color
    function subLabel(text) {
      doc.font('Helvetica').fontSize(9.5).fillColor(hex(colors.primary))
        .text(text, ml, doc.y, { width: pageW })
    }

    // Body paragraph
    function bodyText(text) {
      doc.font('Helvetica').fontSize(9).fillColor(hex(colors.text))
        .text(text, ml, doc.y, { width: pageW, lineGap: 1.5 })
    }

    // Bullet point
    function bulletItem(text) {
      checkBreak(14)
      const bx = ml + 10
      doc.font('Helvetica').fontSize(9).fillColor(hex(colors.text))
        .text(`\u2022  ${text}`, bx, doc.y, { width: pageW - 10, lineGap: 1 })
    }

    // ── HEADER ─────────────────────────────────────────────────────────────────

    doc.font('Helvetica-Bold').fontSize(24).fillColor(hex(colors.heading))
      .text(basics.name || 'Your Name', ml, mt, { width: pageW })

    if (basics.label) {
      doc.moveDown(0.15)
      doc.font('Helvetica').fontSize(11.5).fillColor(hex(colors.primary))
        .text(basics.label, ml, doc.y, { width: pageW })
    }

    // Contact line
    const contactParts = []
    if (basics.email)          contactParts.push(basics.email)
    if (basics.phone)          contactParts.push(basics.phone)
    if (basics.location?.city) {
      let loc = basics.location.city
      if (basics.location.region) loc += `, ${basics.location.region}`
      contactParts.push(loc)
    }
    if (basics.url) contactParts.push(basics.url)
    basics.profiles?.forEach((p) => {
      if (p.url || p.username) contactParts.push(`${p.network}: ${p.url || p.username}`)
    })
    if (contactParts.length) {
      doc.moveDown(0.2)
      doc.font('Helvetica').fontSize(8.5).fillColor(hex(colors.light))
        .text(contactParts.join('   \u2022   '), ml, doc.y, { width: pageW })
    }

    // Header divider
    doc.moveDown(0.4)
    const divY = doc.y
    doc.moveTo(ml, divY).lineTo(ml + pageW, divY)
      .strokeColor(hex(colors.primary)).lineWidth(2).stroke()
    doc.y = divY + 8

    // ── SUMMARY ────────────────────────────────────────────────────────────────

    if (basics.summary) {
      sectionHeading('Professional Summary')
      doc.moveDown(0.2)
      bodyText(basics.summary)
      doc.moveDown(0.7)
    }

    // ── EXPERIENCE ─────────────────────────────────────────────────────────────

    if (work.length > 0) {
      sectionHeading('Experience')
      doc.moveDown(0.3)

      work.forEach((w, i) => {
        if (i > 0) doc.moveDown(0.4)
        checkBreak(50)

        const dateStr = `${formatDate(w.startDate)} \u2014 ${w.current ? 'Present' : formatDate(w.endDate)}`
        titleRow(w.position || '', dateStr)
        if (w.name) subLabel(w.name)

        if (w.summary) {
          doc.moveDown(0.15)
          bodyText(w.summary)
        }

        const highlights = (w.highlights || []).filter(Boolean)
        if (highlights.length) {
          doc.moveDown(0.2)
          highlights.forEach((h) => bulletItem(h))
        }
      })
      doc.moveDown(0.7)
    }

    // ── EDUCATION ──────────────────────────────────────────────────────────────

    if (education.length > 0) {
      sectionHeading('Education')
      doc.moveDown(0.3)

      education.forEach((e, i) => {
        if (i > 0) doc.moveDown(0.35)
        checkBreak(35)

        const degree  = [e.studyType ? `${e.studyType} in` : '', e.area || ''].filter(Boolean).join(' ')
        const dateStr = `${formatDate(e.startDate)} \u2014 ${formatDate(e.endDate)}`
        titleRow(degree, dateStr)
        if (e.institution) subLabel(e.institution)
        if (e.score) {
          doc.font('Helvetica').fontSize(8.5).fillColor(hex(colors.light))
            .text(`Score: ${e.score}`, ml, doc.y, { width: pageW })
        }
      })
      doc.moveDown(0.7)
    }

    // ── SKILLS ─────────────────────────────────────────────────────────────────

    if (skills.length > 0) {
      sectionHeading('Skills')
      doc.moveDown(0.3)

      skills.forEach((s) => {
        doc.font('Helvetica-Bold').fontSize(9).fillColor(hex(colors.heading))
          .text(`${s.name}:  `, ml, doc.y, { continued: true, width: pageW })
        doc.font('Helvetica').fontSize(9).fillColor(hex(colors.text))
          .text((s.keywords || []).join(', '), { width: pageW, lineGap: 1 })
      })
      doc.moveDown(0.7)
    }

    // ── PROJECTS ───────────────────────────────────────────────────────────────

    if (projects.length > 0) {
      sectionHeading('Projects')
      doc.moveDown(0.3)

      projects.forEach((p, i) => {
        if (i > 0) doc.moveDown(0.35)
        checkBreak(30)

        doc.font('Helvetica-Bold').fontSize(10).fillColor(hex(colors.heading))
          .text(p.name || '', ml, doc.y, { width: pageW })

        if (p.url) {
          doc.font('Helvetica').fontSize(8.5).fillColor(hex(colors.primary))
            .text(p.url, ml, doc.y, { width: pageW })
        }
        if (p.description) {
          doc.moveDown(0.1)
          bodyText(p.description)
        }
        const highlights = (p.highlights || []).filter(Boolean)
        if (highlights.length) {
          doc.moveDown(0.15)
          highlights.forEach((h) => bulletItem(h))
        }
      })
      doc.moveDown(0.7)
    }

    // ── CERTIFICATIONS ─────────────────────────────────────────────────────────

    if (certificates.length > 0) {
      sectionHeading('Certifications')
      doc.moveDown(0.3)

      certificates.forEach((c) => {
        checkBreak(14)
        const dateStr = c.date ? formatDate(c.date) : ''

        if (dateStr) {
          titleRow(
            `${c.name}  \u2014  ${c.issuer}`,
            dateStr,
          )
        } else {
          doc.font('Helvetica-Bold').fontSize(9).fillColor(hex(colors.heading))
            .text(c.name, ml, doc.y, { continued: true })
          doc.font('Helvetica').fillColor(hex(colors.text))
            .text(`  \u2014  ${c.issuer}`)
        }
      })
      doc.moveDown(0.7)
    }

    // ── LANGUAGES ──────────────────────────────────────────────────────────────

    if (languages.length > 0) {
      sectionHeading('Languages')
      doc.moveDown(0.3)
      const langText = languages.map((l) => `${l.language} (${l.fluency})`).join('   \u2022   ')
      doc.font('Helvetica').fontSize(9).fillColor(hex(colors.text))
        .text(langText, ml, doc.y, { width: pageW })
    }

    doc.end()
  })
}
