import { useState, useRef } from "react"
import { runAudit } from "./api"
import type { AuditReport } from "./types"
import ScoreGauge from "./components/ScoreGauge"
import IssuesList from "./components/IssuesList"
import PerformanceCard from "./components/PerformanceCard"
import OnPageSEO from "./components/OnPageSEO"
import TechnicalSEO from "./components/TechnicalSEO"
import ActionPlan from "./components/ActionPlan"
import Competitors from "./components/Competitors"
import AuditSummary from "./components/AuditSummary"
import FixesPanel from "./components/FixesPanel"
import DeployPanel from "./components/DeployPanel"
import GuidePage from "./components/GuidePage"

type Page = "audit" | "guide"

export default function App() {
  const [page, setPage] = useState<Page>("audit")
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleAudit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const result = await runAudit(url.trim())
      if (result.error) {
        setError(result.error)
      } else {
        setReport(result)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-gray-800 text-lg">SEO Agent</span>
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">v1</span>

          {/* Nav */}
          <nav className="ml-auto flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { id: "audit", label: "🔍 Audit" },
              { id: "guide", label: "📖 Deploy Guide" },
            ] as { id: Page; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  page === id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Guide page */}
      {page === "guide" && <GuidePage />}

      {/* Audit page */}
      {page === "audit" && <>
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Instant SEO Audit
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Paste any URL — the agent crawls, analyses, and gives you a full action plan.
        </p>
        <form onSubmit={handleAudit} className="flex gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
          >
            {loading ? "Analysing..." : "Run Audit"}
          </button>
        </form>

        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              Agent is crawling the page, checking performance, and gathering SEO data...
            </p>
            <p className="text-gray-400 text-xs">This takes 20–40 seconds</p>
          </div>
        )}

        {error && (
          <div className="mt-6 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}
      </section>

      {/* Results */}
      {report && (
        <div ref={resultsRef} className="max-w-5xl mx-auto px-6 pb-16 space-y-6">
          {/* Score header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ScoreGauge score={report.overall_score} grade={report.grade} />
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Audited URL</p>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline text-sm font-medium break-all"
                >
                  {report.url}
                </a>
                <p className="text-gray-600 mt-3 text-sm leading-relaxed">{report.summary}</p>
                <div className="flex gap-4 mt-4 text-sm flex-wrap justify-center md:justify-start">
                  <span className="text-red-600 font-semibold">{report.issues?.critical?.length || 0} Critical</span>
                  <span className="text-yellow-600 font-semibold">{report.issues?.warnings?.length || 0} Warnings</span>
                  <span className="text-blue-600 font-semibold">{report.issues?.info?.length || 0} Info</span>
                </div>
              </div>
            </div>
          </div>

          {/* Issues */}
          <IssuesList
            critical={report.issues?.critical || []}
            warnings={report.issues?.warnings || []}
            info={report.issues?.info || []}
          />

          {/* On-page + Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OnPageSEO onPage={report.on_page_seo} />
            <PerformanceCard performance={report.performance} />
          </div>

          {/* Technical + Competitors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TechnicalSEO technical={report.technical} />
            <Competitors competitors={report.competitors || []} />
          </div>

          {/* Action Plan */}
          <ActionPlan actions={report.action_plan || []} />

          {/* Auto-fix panel */}
          <FixesPanel report={report} />

          {/* Auto-deploy panel */}
          <DeployPanel report={report} />

          {/* Full exportable summary */}
          {report.full_summary && (
            <AuditSummary summary={report.full_summary} url={report.url} />
          )}
        </div>
      )}
      </> }
    </div>
  )
}
