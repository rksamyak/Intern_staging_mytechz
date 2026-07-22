'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Color helpers ─────────────────────────────────────────────────────────────

const COLOR_MAP = {
  red:   { bg: 'bg-red-200',   text: 'text-red-900',   border: 'border-red-400',   badge: 'bg-red-100 text-red-700 border-red-200',   label: 'Critical' },
  amber: { bg: 'bg-amber-200', text: 'text-amber-900', border: 'border-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Quick Win' },
  blue:  { bg: 'bg-blue-200',  text: 'text-blue-900',  border: 'border-blue-400',  badge: 'bg-blue-100 text-blue-700 border-blue-200',  label: 'Suggestion' },
  green: { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400', badge: 'bg-green-100 text-green-700 border-green-200', label: 'Strength' },
}

function scoreColor(s) {
  if (s >= 80) return 'text-emerald-600'
  if (s >= 60) return 'text-blue-600'
  if (s >= 40) return 'text-amber-500'
  return 'text-red-600'
}

// ── Build highlighted segments from plain text + highlights ──────────────────

function buildSegments(text, highlights, activeId) {
  if (!highlights?.length) return [{ text, color: null, insightId: null }]

  // Sort highlights by char_start; filter out invalid
  const valid = highlights
    .filter(h => h.char_start != null && h.char_end != null && h.char_start < h.char_end)
    .sort((a, b) => a.char_start - b.char_start)

  const segments = []
  let pos = 0

  for (const h of valid) {
    const start = Math.max(h.char_start, pos)
    const end = Math.min(h.char_end, text.length)
    if (start >= end) continue
    if (start > pos) segments.push({ text: text.slice(pos, start), color: null, insightId: null })
    segments.push({
      text: text.slice(start, end),
      color: h.color,
      insightId: h.insight_id,
      active: h.insight_id === activeId,
    })
    pos = end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), color: null, insightId: null })
  return segments
}

// ── Score Mini Gauge ──────────────────────────────────────────────────────────

function MiniGauge({ score, label }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#059669' : score >= 60 ? '#1d4ed8' : score >= 40 ? '#d97706' : '#dc2626'

  return (
    <div className="flex items-center gap-2">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
        <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div>
        <div className={`text-lg font-black ${scoreColor(score)}`}>{Math.round(score)}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  )
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export default function SmartEditorPage() {
  const { id } = useParams()
  const router = useRouter()

  const [editorData, setEditorData] = useState(null)
  const [error, setError] = useState('')
  const [activeInsight, setActiveInsight] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState(null)
  const [filterColor, setFilterColor] = useState('all')
  const sidebarRef = useRef(null)

  useEffect(() => {
    fetch(`/api/ats/${id}/editor-data`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          if (data.error === 'Unauthorized') router.push('/auth/login')
          else setError(data.error)
          return
        }
        setEditorData(data.editor)
        setEditedText(data.editor.edited_text || data.editor.extracted_text || '')
      })
      .catch(() => setError('Failed to load editor data.'))
  }, [id, router])

  const displayText = editMode ? null : (editorData?.edited_text || editorData?.extracted_text || '')
  const highlights = editorData?.highlights || []

  const filteredHighlights = filterColor === 'all'
    ? highlights
    : highlights.filter(h => h.color === filterColor)

  const segments = editMode ? [] : buildSegments(displayText || '', filteredHighlights, activeInsight?.insight_id)

  const handleSave = useCallback(async () => {
    if (!editedText.trim()) return
    setSaving(true)
    setSaveResult(null)
    try {
      const res = await fetch(`/api/ats/${id}/save-edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_text: editedText }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setSaveResult(result)
      setEditMode(false)
      // Update editorData with new edited_text and score
      setEditorData(prev => ({
        ...prev,
        edited_text: editedText,
        edited_ats_score: result.edited_ats_score,
      }))
    } catch (err) {
      setSaveResult({ error: err.message })
    } finally {
      setSaving(false)
    }
  }, [id, editedText])

  const scrollToInsight = (insightId) => {
    const el = document.getElementById(`insight-${insightId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Could not load editor</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link href={`/ai-tools/resume-rank-checker/results/${id}`} className="bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-800">
          Back to Results
        </Link>
      </div>
    )
  }

  if (!editorData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading Smart Editor…</p>
      </div>
    )
  }

  const originalScore = Number(editorData.ats_score ?? 0)
  const editedScore = Number(editorData.edited_ats_score ?? originalScore)
  const improvement = Math.round((editedScore - originalScore) * 10) / 10

  // Count by color
  const colorCounts = highlights.reduce((acc, h) => {
    acc[h.color] = (acc[h.color] || 0) + 1
    return acc
  }, {})

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/ai-tools/resume-rank-checker/results/${id}`} className="text-slate-400 hover:text-slate-700 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900">Smart Editor</h1>
            <p className="text-xs text-slate-400 truncate max-w-xs">{editorData.file_name || 'Resume'}</p>
          </div>
        </div>

        {/* Score meters */}
        <div className="flex items-center gap-4">
          <MiniGauge score={originalScore} label="Original" />
          {editedScore !== originalScore && (
            <>
              <div className="text-slate-300">→</div>
              <MiniGauge score={editedScore} label="Edited" />
              <span className={`text-sm font-bold ${improvement > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {improvement > 0 ? '+' : ''}{improvement}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <button
                onClick={() => { setEditMode(false); setEditedText(editorData.edited_text || editorData.extracted_text || '') }}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-800 disabled:opacity-60 flex items-center gap-1.5"
              >
                {saving ? <><span className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />Saving…</> : 'Save & Re-score'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit Resume
            </button>
          )}
        </div>
      </header>

      {/* Save result toast */}
      {saveResult && (
        <div className={`px-6 py-2 text-sm font-medium text-center ${saveResult.error ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {saveResult.error
            ? `Error: ${saveResult.error}`
            : `Saved! Score updated: ${saveResult.original_ats_score} → ${saveResult.edited_ats_score} (${saveResult.improvement > 0 ? '+' : ''}${saveResult.improvement})`
          }
        </div>
      )}

      {/* ── Body: Editor + Sidebar ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Resume Panel */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Filter pills */}
          {!editMode && (
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setFilterColor('all')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filterColor === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                All ({highlights.length})
              </button>
              {['red', 'amber', 'blue', 'green'].map(c => colorCounts[c] ? (
                <button
                  key={c}
                  onClick={() => setFilterColor(prev => prev === c ? 'all' : c)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filterColor === c ? `${COLOR_MAP[c].bg} ${COLOR_MAP[c].text} ${COLOR_MAP[c].border}` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                >
                  {COLOR_MAP[c].label} ({colorCounts[c]})
                </button>
              ) : null)}
            </div>
          )}

          {editMode ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-400">Edit mode — changes won't be highlighted until saved</span>
              </div>
              <textarea
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                className="w-full font-mono text-sm leading-relaxed p-6 min-h-[60vh] focus:outline-none resize-none"
                placeholder="Your resume text…"
                spellCheck
              />
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 lg:p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {segments.map((seg, i) => {
                if (!seg.color) return <span key={i}>{seg.text}</span>
                const cm = COLOR_MAP[seg.color] || COLOR_MAP.blue
                const isActive = seg.active
                return (
                  <span
                    key={i}
                    id={`text-${seg.insightId}`}
                    onClick={() => {
                      const insight = highlights.find(h => h.insight_id === seg.insightId)
                      setActiveInsight(insight || null)
                      if (insight) scrollToInsight(insight.insight_id)
                    }}
                    className={`cursor-pointer rounded px-0.5 transition-all ${cm.bg} ${cm.text} ${isActive ? `ring-2 ring-offset-1 ${cm.border}` : ''}`}
                    title={seg.insightId ? 'Click for details' : ''}
                  >
                    {seg.text}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Insights Sidebar */}
        <aside ref={sidebarRef} className="w-80 xl:w-96 border-l border-slate-200 bg-white overflow-y-auto shrink-0 hidden md:block">
          <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
            <h2 className="text-sm font-bold text-slate-900">Insights</h2>
            <p className="text-xs text-slate-400">{filteredHighlights.length} annotations — click to jump</p>
          </div>

          {/* Active insight detail */}
          {activeInsight && (
            <div className={`m-3 rounded-xl border p-4 ${COLOR_MAP[activeInsight.color]?.badge || 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-semibold text-sm">{activeInsight.title}</p>
                <button onClick={() => setActiveInsight(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {activeInsight.description && <p className="text-xs mb-2 opacity-80">{activeInsight.description}</p>}
              {activeInsight.suggestion && (
                <div className="bg-white/60 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs font-semibold mb-0.5">Suggested fix</p>
                  <p className="text-xs">{activeInsight.suggestion}</p>
                </div>
              )}
            </div>
          )}

          {/* Insight list */}
          <div className="p-3 space-y-2">
            {filteredHighlights.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No annotations for this filter.</p>
            )}
            {filteredHighlights.map(h => {
              const cm = COLOR_MAP[h.color] || COLOR_MAP.blue
              const isActive = activeInsight?.insight_id === h.insight_id
              return (
                <div
                  key={h.insight_id}
                  id={`insight-${h.insight_id}`}
                  onClick={() => {
                    setActiveInsight(isActive ? null : h)
                    const textEl = document.getElementById(`text-${h.insight_id}`)
                    textEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className={`rounded-xl border px-3 py-3 cursor-pointer transition-all ${isActive ? `${cm.bg} ${cm.border}` : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cm.badge}`}>{cm.label}</span>
                    {h.section_name && <span className="text-xs text-slate-400 capitalize">{h.section_name}</span>}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{h.title}</p>
                  {h.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{h.description}</p>}
                </div>
              )
            })}
          </div>
        </aside>
      </div>

      {/* ── Mobile Insight Sheet ──────────────────────────────────────────── */}
      {activeInsight && (
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 rounded-t-2xl p-5 z-50 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-sm text-slate-900">{activeInsight.title}</p>
            <button onClick={() => setActiveInsight(null)} className="text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {activeInsight.description && <p className="text-sm text-slate-500 mb-3">{activeInsight.description}</p>}
          {activeInsight.suggestion && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-blue-700 mb-1">Suggested fix</p>
              <p className="text-sm text-blue-800">{activeInsight.suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
