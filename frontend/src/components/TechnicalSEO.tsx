import type { AuditReport } from "../types"

interface Props {
  technical: AuditReport["technical"]
}

function Check({ label, passed, detail }: { label: string; passed: boolean; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className={`text-base flex-shrink-0 ${passed ? "text-green-500" : "text-red-500"}`}>
        {passed ? "✓" : "✗"}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {detail && <p className="text-xs text-gray-500 mt-0.5 break-all">{detail}</p>}
      </div>
    </div>
  )
}

export default function TechnicalSEO({ technical }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Technical SEO</h2>
      <Check
        label="Canonical Tag"
        passed={technical.canonical?.present}
        detail={technical.canonical?.value}
      />
      <Check
        label="robots.txt Found"
        passed={technical.robots?.robots_txt_found}
      />
      <Check
        label="Page Not Blocked by robots.txt"
        passed={!technical.robots?.page_blocked}
        detail={technical.robots?.page_blocked ? "This URL is disallowed" : undefined}
      />
      <Check
        label="Sitemap Found"
        passed={technical.sitemap?.found}
        detail={
          technical.sitemap?.found
            ? `${technical.sitemap.url} (${technical.sitemap.page_count} pages)`
            : undefined
        }
      />
      <Check
        label="Structured Data (JSON-LD)"
        passed={technical.structured_data?.found}
        detail={
          technical.structured_data?.found
            ? `Types: ${technical.structured_data.types.join(", ")}`
            : undefined
        }
      />
      <Check
        label="Open Graph Tags"
        passed={technical.open_graph?.found}
      />
    </div>
  )
}
