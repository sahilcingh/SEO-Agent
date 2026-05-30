import type { AuditReport } from "./types"
import { API_BASE } from "./config"

const BASE = `${API_BASE}/api`

export async function runAudit(url: string): Promise<AuditReport> {
  const res = await fetch(`${BASE}/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}
