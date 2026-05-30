import { useState } from "react"

interface Props {
  summary: string
  url: string
}

export default function AuditSummary({ summary, url: _url }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Full Audit Summary</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Copy this and paste into Claude, ChatGPT, or any AI to get your site fixed automatically.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {copied ? (
            <>
              <span>✓</span> Copied!
            </>
          ) : (
            <>
              <span>⎘</span> Copy Summary
            </>
          )}
        </button>
      </div>

      <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap font-mono">
        {summary}
      </pre>

      <p className="text-xs text-gray-400 mt-3">
        Tip: Say "Here is my SEO audit. Fix all critical issues and warnings in my website." and paste this along with your site's code.
      </p>
    </div>
  )
}
