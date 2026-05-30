import type { Competitor } from "../types"

interface Props {
  competitors: Competitor[]
}

export default function Competitors({ competitors }: Props) {
  if (!competitors?.length) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Competitors</h2>
      <div className="space-y-3">
        {competitors.map((c, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <span className="text-xs font-bold text-gray-400 mt-1 w-4 flex-shrink-0">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.title || c.domain}</p>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline truncate block"
              >
                {c.domain || c.url}
              </a>
              {c.snippet && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.snippet}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
