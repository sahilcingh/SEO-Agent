export interface Issue {
  title: string
  description: string
  how_to_fix?: string
}

export interface OnPageItem {
  value?: string
  length?: number
  score: number
  status: string
  count?: number
  total?: number
  missing_alt?: number
  internal?: number
  external?: number
  word_count?: number
  h1_count?: number
  structure?: Record<string, string[]>
}

export interface ActionItem {
  priority: "high" | "medium" | "low"
  action: string
  expected_impact: string
}

export interface Competitor {
  url: string
  title: string
  domain: string
  snippet?: string
}

export interface AuditReport {
  url: string
  overall_score: number
  grade: string
  summary: string
  issues: {
    critical: Issue[]
    warnings: Issue[]
    info: Issue[]
  }
  on_page_seo: {
    title: OnPageItem
    meta_description: OnPageItem
    headings: OnPageItem
    content: OnPageItem
    images: OnPageItem
    links: OnPageItem
  }
  performance: {
    mobile_score: number
    desktop_score: number
    lcp: string
    cls: string
    fcp: string
    tbt: string
    error?: string
  }
  technical: {
    canonical: { present: boolean; value: string }
    robots: { page_blocked: boolean; robots_txt_found: boolean }
    sitemap: { found: boolean; url: string; page_count: number }
    structured_data: { found: boolean; types: string[] }
    open_graph: { found: boolean }
  }
  competitors: Competitor[]
  action_plan: ActionItem[]
  full_summary?: string
  error?: string
}
