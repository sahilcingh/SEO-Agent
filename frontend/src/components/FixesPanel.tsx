import { useState } from "react"
import type { AuditReport } from "../types"
import { API_BASE } from "../config"

interface Fixes {
  head_html: string
  schema_jsonld: string
  robots_txt: string
  content: Record<string, string | string[]>
  implementation_guide: string
}

interface Props {
  report: AuditReport
}

function CopyBlock({ label, code, lang = "html" }: { label: string; code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${copied ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-900 text-green-300 rounded-xl p-4 text-xs overflow-auto max-h-64 whitespace-pre-wrap font-mono leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

const TABS = ["Head HTML", "Schema", "robots.txt", "Content", "Guide"] as const
type Tab = typeof TABS[number]

export default function FixesPanel({ report }: Props) {
  const [loading, setLoading] = useState(false)
  const [fixes, setFixes] = useState<Fixes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("Head HTML")
  const [downloading, setDownloading] = useState(false)

  async function handleFix() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("${API_BASE}/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: report.url, audit_report: report }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }))
        throw new Error(err.detail)
      }
      setFixes(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fix generation failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch("${API_BASE}/api/fix/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: report.url, audit_report: report }),
      })
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = "seo-fixes.zip"
      a.click()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Download failed")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔧</span> Auto-Fix My Website
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            The agent generates ready-to-use code fixes for every issue found in your audit.
          </p>
        </div>
        {!fixes && (
          <button
            onClick={handleFix}
            disabled={loading}
            className="flex-shrink-0 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating fixes...
              </span>
            ) : "Generate Fixes"}
          </button>
        )}
        {fixes && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-shrink-0 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
          >
            {downloading ? "Preparing ZIP..." : "⬇ Download All as ZIP"}
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Agent is re-crawling the page and generating fixes...</p>
          <p className="text-xs text-gray-400">This takes 30–60 seconds</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {fixes && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "Head HTML" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Replace everything inside your <code className="bg-gray-100 px-1 rounded">&lt;head&gt;...&lt;/head&gt;</code> tag with this optimised version.
              </p>
              <CopyBlock label="Optimised <head> content" code={fixes.head_html} />
            </div>
          )}

          {activeTab === "Schema" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Add this JSON-LD structured data block inside your <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> to help search engines understand your page.
              </p>
              <CopyBlock label="JSON-LD Schema Markup" code={fixes.schema_jsonld} lang="json" />
            </div>
          )}

          {activeTab === "robots.txt" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Upload this file to your domain root as <code className="bg-gray-100 px-1 rounded">robots.txt</code>.
              </p>
              <CopyBlock label="robots.txt" code={fixes.robots_txt} lang="text" />
            </div>
          )}

          {activeTab === "Content" && (
            <div className="space-y-4">
              {typeof fixes.content === "object" && !("raw" in fixes.content) ? (
                <>
                  {fixes.content.improved_title && (
                    <CopyBlock label="Improved Title Tag" code={String(fixes.content.improved_title)} lang="text" />
                  )}
                  {fixes.content.improved_meta_description && (
                    <CopyBlock label="Improved Meta Description" code={String(fixes.content.improved_meta_description)} lang="text" />
                  )}
                  {fixes.content.suggested_h1 && (
                    <CopyBlock label="Suggested H1" code={String(fixes.content.suggested_h1)} lang="text" />
                  )}
                  {Array.isArray(fixes.content.keyword_suggestions) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Keyword Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {(fixes.content.keyword_suggestions as string[]).map((kw, i) => (
                          <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(fixes.content.content_gaps) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Content Gaps to Fill</p>
                      <ul className="space-y-1">
                        {(fixes.content.content_gaps as string[]).map((gap, i) => (
                          <li key={i} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-yellow-500">•</span>{gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{fixes.content.raw as string}</pre>
              )}
            </div>
          )}

          {activeTab === "Guide" && (
            <div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 max-h-96 overflow-auto">
                {fixes.implementation_guide}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
