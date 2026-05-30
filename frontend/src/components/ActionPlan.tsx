import type { ActionItem } from "../types"

interface Props {
  actions: ActionItem[]
}

const priorityStyle = {
  high: { badge: "bg-red-100 text-red-700 border border-red-200", dot: "bg-red-500" },
  medium: { badge: "bg-yellow-100 text-yellow-700 border border-yellow-200", dot: "bg-yellow-500" },
  low: { badge: "bg-blue-100 text-blue-700 border border-blue-200", dot: "bg-blue-500" },
}

export default function ActionPlan({ actions }: Props) {
  const sorted = [...actions].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Action Plan</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No actions available</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => {
            const style = priorityStyle[item.priority] || priorityStyle.low
            return (
              <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${style.badge}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{item.action}</p>
                  <p className="text-xs text-gray-500 mt-1">Impact: {item.expected_impact}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
