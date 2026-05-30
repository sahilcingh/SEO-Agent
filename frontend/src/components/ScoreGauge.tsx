interface Props {
  score: number
  grade: string
}

function gradeColor(score: number) {
  if (score >= 80) return { text: "text-green-500", ring: "#22c55e", bg: "bg-green-50" }
  if (score >= 60) return { text: "text-yellow-500", ring: "#eab308", bg: "bg-yellow-50" }
  if (score >= 40) return { text: "text-orange-500", ring: "#f97316", bg: "bg-orange-50" }
  return { text: "text-red-500", ring: "#ef4444", bg: "bg-red-50" }
}

export default function ScoreGauge({ score, grade }: Props) {
  const colors = gradeColor(score)
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={colors.ring} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${colors.text}`}>{score}</span>
          <span className="text-sm text-gray-400">/100</span>
        </div>
      </div>
      <div className={`mt-2 px-4 py-1 rounded-full text-lg font-bold ${colors.text} ${colors.bg}`}>
        Grade {grade}
      </div>
    </div>
  )
}
