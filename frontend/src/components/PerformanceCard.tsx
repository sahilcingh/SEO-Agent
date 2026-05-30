interface Props {
  performance: {
    mobile_score: number
    desktop_score: number
    lcp: string
    cls: string
    fcp: string
    tbt: string
    error?: string
  }
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"
  const textColor = score >= 90 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  const isNA = !value || value === "N/A"
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`font-semibold text-sm ${isNA ? "text-gray-400" : "text-gray-800"}`}>
        {value || "N/A"}
      </p>
    </div>
  )
}

const hasData = (p: Props["performance"]) =>
  p.mobile_score > 0 || p.desktop_score > 0 ||
  (p.lcp && p.lcp !== "N/A") || (p.fcp && p.fcp !== "N/A")

export default function PerformanceCard({ performance }: Props) {
  const dataAvailable = hasData(performance)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance</h2>

      {!dataAvailable ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-1">
              PageSpeed data unavailable
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              {performance.error
                ? performance.error.slice(0, 200)
                : "The PageSpeed Insights API returned no data."}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">Fix: Add a free Google API key</p>
            <ol className="list-decimal ml-4 space-y-1 mt-1">
              <li>Go to <span className="font-mono bg-white px-1 rounded">console.cloud.google.com</span></li>
              <li>Create a project → Enable <strong>PageSpeed Insights API</strong></li>
              <li>APIs &amp; Services → Credentials → Create API Key</li>
              <li>Add to <span className="font-mono bg-white px-1 rounded">.env</span> as <span className="font-mono bg-white px-1 rounded">GOOGLE_API_KEY=...</span></li>
            </ol>
            <p className="text-gray-500 mt-2">Free tier: 25,000 requests/day. No billing required.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            <ScoreBar label="Mobile Score" score={performance.mobile_score} />
            <ScoreBar label="Desktop Score" score={performance.desktop_score} />
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Core Web Vitals</h3>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="LCP" value={performance.lcp} />
            <Metric label="CLS" value={performance.cls} />
            <Metric label="FCP" value={performance.fcp} />
            <Metric label="TBT" value={performance.tbt} />
          </div>
        </>
      )}
    </div>
  )
}
