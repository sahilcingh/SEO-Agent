import type { Issue } from "../types"
import { useState } from "react"

interface Props {
  critical: Issue[]
  warnings: Issue[]
  info: Issue[]
}

function IssueItem({ issue, type }: { issue: Issue; type: "critical" | "warning" | "info" }) {
  const [open, setOpen] = useState(false)
  const styles = {
    critical: { border: "border-red-200", badge: "bg-red-100 text-red-700", icon: "🔴" },
    warning: { border: "border-yellow-200", badge: "bg-yellow-100 text-yellow-700", icon: "🟡" },
    info: { border: "border-blue-200", badge: "bg-blue-100 text-blue-700", icon: "🔵" },
  }[type]

  return (
    <div className={`border ${styles.border} rounded-lg overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span>{styles.icon}</span>
        <span className="flex-1 font-medium text-gray-800 text-sm">{issue.title}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm space-y-2 border-t border-gray-100">
          <p className="text-gray-600 pt-2">{issue.description}</p>
          {issue.how_to_fix && (
            <div className="bg-gray-50 rounded-md p-3">
              <span className="font-semibold text-gray-700">Fix: </span>
              <span className="text-gray-600">{issue.how_to_fix}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function IssuesList({ critical, warnings, info }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Issues Found</h2>
      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{critical.length} Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />{warnings.length} Warnings</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{info.length} Info</span>
      </div>
      <div className="space-y-2">
        {critical.map((issue, i) => <IssueItem key={i} issue={issue} type="critical" />)}
        {warnings.map((issue, i) => <IssueItem key={i} issue={issue} type="warning" />)}
        {info.map((issue, i) => <IssueItem key={i} issue={issue} type="info" />)}
        {critical.length + warnings.length + info.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No issues detected</p>
        )}
      </div>
    </div>
  )
}
