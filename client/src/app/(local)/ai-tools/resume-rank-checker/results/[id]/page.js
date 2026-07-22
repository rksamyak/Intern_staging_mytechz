'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Below Average'
  return 'Needs Rewrite'
}

function scoreBg(score) {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200'
  if (score >= 60) return 'bg-blue-50 border-blue-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function CircleGauge({ score }) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#059669' : score >= 60 ? '#1d4ed8' : score >= 40 ? '#d97706' : '#dc2626'

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-40 h-40 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${scoreColor(score)}`}>{Math.round(score)}</span>
        <span className="text-xs text-slate-400 font-medium">ATS Score</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color, weight }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {weight && <span className="text-xs text-slate-400">{weight}%</span>}
        </div>
        <span className={`text-sm font-bold ${scoreColor(value)}`}>{Math.round(value)}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-2.5 ${color} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function OverviewTab({ data }) {
  const s = data
  return (
    <div className="space-y-8">
      {/* Strengths */}
      {s.strengths?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Strengths ({s.strengths.length})
          </h3>
          <ul className="space-y-2">
            {s.strengths.slice(0, 5).map(ins => (
              <li key={ins.id} className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <p className="font-semibold text-emerald-800 text-sm">{ins.title}</p>
                <p className="text-emerald-700 text-xs mt-0.5">{ins.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Weaknesses */}
      {s.weaknesses?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Weaknesses ({s.weaknesses.length})
          </h3>
          <ul className="space-y-2">
            {s.weaknesses.map(ins => (
              <li key={ins.id} className={`border rounded-xl px-4 py-3 ${ins.priority === 3 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                <p className={`font-semibold text-sm ${ins.priority === 3 ? 'text-red-800' : 'text-amber-800'}`}>{ins.title}</p>
                <p className={`text-xs mt-0.5 ${ins.priority === 3 ? 'text-red-600' : 'text-amber-600'}`}>{ins.description}</p>
                {ins.suggestion && <p className="text-xs mt-1.5 text-slate-600 italic">💡 {ins.suggestion}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Suggestions */}
      {s.suggestions?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Suggestions ({s.suggestions.length})
          </h3>
          <ul className="space-y-2">
            {s.suggestions.map(ins => (
              <li key={ins.id} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="font-semibold text-blue-800 text-sm">{ins.title}</p>
                <p className="text-blue-700 text-xs mt-0.5">{ins.description}</p>
                {ins.suggestion && <p className="text-xs mt-1.5 text-slate-600 italic">💡 {ins.suggestion}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function KeywordsTab({ keywords }) {
  const grouped = {}
  keywords.forEach(k => {
    if (!grouped[k.keyword_type]) grouped[k.keyword_type] = { found: [], missing: [] }
    grouped[k.keyword_type][k.is_present ? 'found' : 'missing'].push(k)
  })

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([type, { found, missing }]) => (
        <div key={type}>
          <h3 className="font-bold text-slate-700 text-sm mb-3 capitalize">{type.replace(/_/g, ' ')} Keywords</h3>
          {found.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-emerald-600 font-semibold mb-2">Found ({found.length})</p>
              <div className="flex flex-wrap gap-2">
                {found.map(k => (
                  <span key={k.keyword} className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {k.keyword}
                    {k.frequency > 1 && <span className="ml-1 text-emerald-400">×{k.frequency}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
          {missing.length > 0 && (
            <div>
              <p className="text-xs text-red-500 font-semibold mb-2">Missing ({missing.length})</p>
              <div className="flex flex-wrap gap-2">
                {missing.map(k => (
                  <span key={k.keyword} className={`border text-xs font-medium px-2.5 py-1 rounded-full ${k.importance_level === 'critical' ? 'bg-red-50 border-red-300 text-red-600' : k.importance_level === 'high' ? 'bg-amber-50 border-amber-300 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {k.keyword}
                    {k.importance_level === 'critical' && <span className="ml-1">⚠</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionsTab({ sections }) {
  return (
    <div className="space-y-3">
      {sections.map(sec => (
        <div key={sec.section_name} className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${sec.is_present ? 'bg-white border-slate-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sec.is_present ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {sec.is_present
              ? <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              : <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 text-sm capitalize">{sec.section_name}</p>
              {sec.is_present && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sec.strength_score >= 70 ? 'bg-emerald-100 text-emerald-700' : sec.strength_score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  {Math.round(sec.strength_score)}%
                </span>
              )}
            </div>
            {sec.is_present ? (
              <p className="text-xs text-slate-400 mt-0.5">
                {sec.word_count} words · {sec.bullet_count} bullets
                {sec.feedback && ` · ${sec.feedback}`}
              </p>
            ) : (
              <p className="text-xs text-red-500 mt-0.5">Section not detected — add this section to improve your score</p>
            )}
          </div>
          {sec.is_present && (
            <div className="w-16 text-right shrink-0">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-1.5 rounded-full ${sec.strength_score >= 70 ? 'bg-emerald-500' : sec.strength_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${sec.strength_score}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    async function load() {
      try {
        const [mainRes, insightsRes] = await Promise.all([
          fetch(`/api/ats/${id}`),
          fetch(`/api/ats/${id}/insights`),
        ])
        if (!mainRes.ok) {
          const e = await mainRes.json()
          throw new Error(e.error || 'Failed to load analysis.')
        }
        const [main, insights] = await Promise.all([mainRes.json(), insightsRes.json()])
        setData({ ...main, ...insights })
      } catch (err) {
        if (err.message?.includes('Unauthorized')) {
          router.push('/auth/login?next=/ai-tools/resume-rank-checker')
        } else {
          setError(err.message)
        }
      }
    }
    load()
  }, [id, router])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Could not load analysis</h2>
        <p className="text-slate-500 text-sm mb-6">{error}</p>
        <Link href="/ai-tools/resume-rank-checker" className="bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-800">
          Try again
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading your results…</p>
      </div>
    )
  }

  const analysis = data.analysis || data
  const job = analysis.job || analysis
  const sections = analysis.sections || []
  const keywords = analysis.keywords || []

  const atsScore = Number(job.ats_score ?? 0)
  const keywordScore = Number(job.keyword_score ?? 0)
  const sectionScore = Number(job.section_score ?? 0)
  const formatScore = Number(job.format_score ?? 0)
  const actionVerbScore = Number(job.action_verb_score ?? 0)
  const quantScore = Number(job.quantification_score ?? 0)
  const readScore = Number(job.readability_score ?? 0)

  const TABS = ['overview', 'keywords', 'sections']

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-slate-500 flex flex-wrap items-center gap-1">
        <Link href="/" className="hover:text-blue-700">Home</Link>
        <span>›</span>
        <Link href="/ai-tools" className="hover:text-blue-700">AI Tools</Link>
        <span>›</span>
        <Link href="/ai-tools/resume-rank-checker" className="hover:text-blue-700">Resume Rank Checker</Link>
        <span>›</span>
        <span className="text-slate-700">Results</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ATS Analysis — <span className={scoreColor(atsScore)}>{scoreLabel(atsScore)}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {job.file_name} · {job.selected_job_roles?.join(', ') || 'General'} ·{' '}
            {new Date(job.completed_at || job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/ai-tools/resume-rank-checker/results/${id}/editor`}
            className="inline-flex items-center gap-2 bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Open Smart Editor
          </Link>
          <Link
            href="/ai-tools/resume-rank-checker"
            className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-all text-sm"
          >
            Check Another
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Left: Score Panel ─────────────────────────── */}
        <div className="space-y-6">
          {/* Overall Score */}
          <div className={`rounded-2xl border p-6 text-center ${scoreBg(atsScore)}`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Overall ATS Score</p>
            <CircleGauge score={atsScore} />
            <div className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${atsScore >= 80 ? 'bg-emerald-100 text-emerald-700' : atsScore >= 60 ? 'bg-blue-100 text-blue-700' : atsScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
              {scoreLabel(atsScore)}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Score Breakdown</p>
            <ScoreBar label="Keywords" value={keywordScore} color="bg-blue-500" weight={35} />
            <ScoreBar label="Sections" value={sectionScore} color="bg-violet-500" weight={25} />
            <ScoreBar label="Formatting" value={formatScore} color="bg-emerald-500" weight={15} />
            <ScoreBar label="Action Verbs" value={actionVerbScore} color="bg-amber-500" weight={10} />
            <ScoreBar label="Quantification" value={quantScore} color="bg-rose-500" weight={10} />
            <ScoreBar label="Readability" value={readScore} color="bg-cyan-500" weight={5} />
          </div>

          {/* Stats */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 grid grid-cols-2 gap-4">
            {[
              { label: 'Keywords Found', val: `${job.total_keywords_found}/${job.total_keywords_expected}` },
              { label: 'Sections Present', val: `${job.total_sections_present}/9` },
              { label: 'Strengths', val: data.strengths?.length ?? 0 },
              { label: 'Weaknesses', val: data.weaknesses?.length ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-slate-900">{s.val}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Tabs ───────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            {tab === 'overview' && (
              <OverviewTab data={{ strengths: data.strengths, weaknesses: data.weaknesses, suggestions: data.suggestions }} />
            )}
            {tab === 'keywords' && <KeywordsTab keywords={keywords} />}
            {tab === 'sections' && <SectionsTab sections={sections} />}
          </div>
        </div>
      </div>
    </div>
  )
}
