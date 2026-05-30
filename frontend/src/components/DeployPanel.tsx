import { useState } from "react"
import type { AuditReport } from "../types"
import { API_BASE } from "../config"

type Source = "github" | "ftp" | "ssh"

interface DeployResult {
  status: string
  message: string
  changed_files: string[]
  branch?: string
  pr_url?: string
  url: string
}

interface Props {
  report: AuditReport
}

export default function DeployPanel({ report }: Props) {
  const [source, setSource] = useState<Source>("github")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DeployResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // GitHub fields
  const [githubToken, setGithubToken] = useState("")
  const [repo, setRepo]               = useState("")
  const [branch, setBranch]           = useState("main")
  const [autoMerge, setAutoMerge]     = useState(false)

  // FTP fields
  const [ftpHost, setFtpHost]     = useState("")
  const [ftpUser, setFtpUser]     = useState("")
  const [ftpPass, setFtpPass]     = useState("")
  const [ftpRoot, setFtpRoot]     = useState("/public_html")

  // SSH fields
  const [sshHost, setSshHost]         = useState("")
  const [sshUser, setSshUser]         = useState("")
  const [sshPass, setSshPass]         = useState("")
  const [sshKey, setSshKey]           = useState("")
  const [sshRoot, setSshRoot]         = useState("/var/www/html")
  const [sshCmd, setSshCmd]           = useState("")

  function buildConfig(): Record<string, unknown> {
    const base = { source, url: report.url }
    if (source === "github") return { ...base, github_token: githubToken, repo, branch, auto_merge: autoMerge }
    if (source === "ftp")    return { ...base, ftp_host: ftpHost, ftp_user: ftpUser, ftp_password: ftpPass, ftp_root: ftpRoot }
    return {
      ...base,
      ssh_host: sshHost, ssh_user: sshUser,
      ssh_password: sshPass, ssh_key: sshKey,
      ssh_site_root: sshRoot, ssh_deploy_command: sshCmd,
    }
  }

  async function handleDeploy() {
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch("${API_BASE}/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: buildConfig(), audit_report: report }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Unknown error" }))
        throw new Error(err.detail)
      }
      setResult(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Deploy failed")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

  return (
    <div className="bg-white rounded-2xl border-2 border-violet-200 p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🚀</span>
        <h2 className="text-lg font-semibold text-gray-800">Auto-Fix & Deploy</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        The agent fixes your code directly and deploys the updated version automatically.
      </p>

      {/* Source tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {(["github", "ftp", "ssh"] as Source[]).map(s => (
          <button key={s} onClick={() => setSource(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${source === s ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {s === "github" ? "GitHub" : s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* GitHub form */}
      {source === "github" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            Vercel, Netlify, and GitHub Pages auto-deploy when you push to your main branch — no extra config needed.
          </div>
          <div>
            <label className={labelCls}>GitHub Personal Access Token</label>
            <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">Settings → Developer settings → Personal access tokens → Fine-grained → repo write access</p>
          </div>
          <div>
            <label className={labelCls}>Repository</label>
            <input value={repo} onChange={e => setRepo(e.target.value)}
              placeholder="username/my-website" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Base Branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)}
              placeholder="main" className={inputCls} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoMerge} onChange={e => setAutoMerge(e.target.checked)}
              className="w-4 h-4 accent-violet-600" />
            <span className="text-sm text-gray-700">
              Auto-merge to <code className="bg-gray-100 px-1 rounded">{branch}</code>
              <span className="text-gray-400 text-xs ml-1">(unchecked = creates a PR for review first)</span>
            </span>
          </label>
        </div>
      )}

      {/* FTP form */}
      {source === "ftp" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>FTP Host</label>
              <input value={ftpHost} onChange={e => setFtpHost(e.target.value)} placeholder="ftp.yoursite.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Remote Root</label>
              <input value={ftpRoot} onChange={e => setFtpRoot(e.target.value)} placeholder="/public_html" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Username</label>
              <input value={ftpUser} onChange={e => setFtpUser(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input type="password" value={ftpPass} onChange={e => setFtpPass(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {/* SSH form */}
      {source === "ssh" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>SSH Host / IP</label>
              <input value={sshHost} onChange={e => setSshHost(e.target.value)} placeholder="123.456.78.90" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input value={sshUser} onChange={e => setSshUser(e.target.value)} placeholder="root" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Password (or leave blank if using key)</label>
              <input type="password" value={sshPass} onChange={e => setSshPass(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site Root Path</label>
              <input value={sshRoot} onChange={e => setSshRoot(e.target.value)} placeholder="/var/www/html" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Private Key (PEM, optional)</label>
            <textarea value={sshKey} onChange={e => setSshKey(e.target.value)}
              placeholder="-----BEGIN RSA PRIVATE KEY-----" rows={3}
              className={`${inputCls} resize-none font-mono text-xs`} />
          </div>
          <div>
            <label className={labelCls}>Deploy Command (optional)</label>
            <input value={sshCmd} onChange={e => setSshCmd(e.target.value)}
              placeholder="cd /var/www/app && npm run build && pm2 restart app" className={inputCls} />
          </div>
        </div>
      )}

      {/* Deploy button */}
      <button onClick={handleDeploy} disabled={loading}
        className="mt-5 w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Fixing & deploying...
          </span>
        ) : "Fix & Deploy Now"}
      </button>

      {loading && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Agent is generating fixes, patching your code, and pushing changes... (~60s)
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className={`rounded-xl p-4 border ${result.status === "deployed" ? "bg-green-50 border-green-200" : result.status === "pr_created" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span>{result.status === "deployed" ? "✅" : result.status === "pr_created" ? "📋" : "ℹ️"}</span>
              <span className="font-semibold text-sm text-gray-800">
                {result.status === "deployed" ? "Deployed successfully!" : result.status === "pr_created" ? "Pull request created" : "No changes needed"}
              </span>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">{result.message}</pre>
          </div>

          {result.changed_files.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Files changed:</p>
              <div className="flex flex-wrap gap-2">
                {result.changed_files.map((f, i) => (
                  <span key={i} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{f}</span>
                ))}
              </div>
            </div>
          )}

          {result.pr_url && (
            <a href={result.pr_url} target="_blank" rel="noopener noreferrer"
              className="block text-center py-2 px-4 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition-colors">
              View Pull Request on GitHub →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
