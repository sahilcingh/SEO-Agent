import type { AuditReport } from "../types"

interface Props {
  onPage: AuditReport["on_page_seo"]
}

function statusColor(status: string) {
  if (!status) return "text-gray-400"
  const s = status.toLowerCase()
  if (s === "good") return "text-green-600"
  if (s === "warning") return "text-yellow-600"
  if (s === "critical") return "text-red-600"
  return "text-gray-500"
}

function statusDot(status: string) {
  const s = (status || "").toLowerCase()
  if (s === "good") return "bg-green-500"
  if (s === "warning") return "bg-yellow-500"
  if (s === "critical") return "bg-red-500"
  return "bg-gray-400"
}

function Row({ label, value, status, score }: { label: string; value: string; status: string; score: number }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${statusDot(status)}`} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={`text-xs font-semibold ${statusColor(status)}`}>{status}</span>
        </div>
        {value && <p className="text-xs text-gray-500 mt-0.5 truncate">{value}</p>}
      </div>
      <span className="text-sm font-bold text-gray-600 flex-shrink-0">{score}/100</span>
    </div>
  )
}

export default function OnPageSEO({ onPage }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">On-Page SEO</h2>
      <div>
        <Row
          label="Title Tag"
          value={`${onPage.title?.value || ""} (${onPage.title?.length || 0} chars)`}
          status={onPage.title?.status || ""}
          score={onPage.title?.score || 0}
        />
        <Row
          label="Meta Description"
          value={`${onPage.meta_description?.value || ""} (${onPage.meta_description?.length || 0} chars)`}
          status={onPage.meta_description?.status || ""}
          score={onPage.meta_description?.score || 0}
        />
        <Row
          label="Heading Structure"
          value={`H1: ${onPage.headings?.h1_count ?? "?"}`}
          status={onPage.headings?.status || ""}
          score={onPage.headings?.score || 0}
        />
        <Row
          label="Content Length"
          value={`${onPage.content?.word_count || 0} words`}
          status={onPage.content?.status || ""}
          score={onPage.content?.score || 0}
        />
        <Row
          label="Image Alt Tags"
          value={`${onPage.images?.missing_alt || 0} missing alt out of ${onPage.images?.total || 0}`}
          status={onPage.images?.status || ""}
          score={onPage.images?.score || 0}
        />
        <Row
          label="Internal Links"
          value={`${onPage.links?.internal || 0} internal, ${onPage.links?.external || 0} external`}
          status={onPage.links?.status || ""}
          score={onPage.links?.score || 0}
        />
      </div>
    </div>
  )
}
