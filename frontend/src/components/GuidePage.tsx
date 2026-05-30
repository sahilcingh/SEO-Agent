const METHODS = [
  {
    id: "github",
    icon: "🐙",
    title: "GitHub + Vercel / Netlify",
    badge: "Recommended",
    badgeColor: "bg-green-100 text-green-700",
    intro: "Best for modern sites. The agent commits fixes to your repo and your deployment platform (Vercel, Netlify, GitHub Pages) auto-deploys instantly.",
    steps: [
      {
        title: "Get a GitHub Personal Access Token",
        body: "You need to give the agent permission to edit your repo.",
        substeps: [
          "Go to github.com and click your avatar → Settings",
          "Scroll to the bottom of the left sidebar → Developer settings",
          "Click Personal access tokens → Fine-grained tokens → Generate new token",
          "Give it a name (e.g. \"SEO Agent\"), set an expiry date",
          "Under Repository access → select your website's repository",
          "Under Repository permissions → set Contents to Read and Write",
          "Click Generate token and copy it (starts with github_pat_...)",
        ],
        tip: "Store the token somewhere safe — GitHub only shows it once.",
        code: null,
      },
      {
        title: "Run an audit on your site",
        body: "Go back to the Audit tab, paste your website URL and click Run Audit. Wait for the full report to appear.",
        substeps: [],
        tip: null,
        code: null,
      },
      {
        title: "Fill in the Auto-Fix & Deploy panel",
        body: "Scroll down to the 🚀 Auto-Fix & Deploy section. Select the GitHub tab and fill in:",
        substeps: [
          "GitHub Token → paste the token you just copied",
          "Repository → your repo in owner/repo format (e.g. johndoe/my-website)",
          "Base Branch → main or master (whatever your default branch is)",
          "Auto-merge → leave unchecked for the first time (creates a PR you can review)",
        ],
        tip: null,
        code: "johndoe/my-website",
      },
      {
        title: "Click Fix & Deploy Now",
        body: "The agent will:",
        substeps: [
          "Create a new branch: seo-auto-fix-2025-05-30",
          "Detect your stack (Next.js, React, or plain HTML)",
          "Patch the right files (app/layout.tsx, index.html, robots.txt, etc.)",
          "Push the branch and open a Pull Request on GitHub",
        ],
        tip: null,
        code: null,
      },
      {
        title: "Review & merge the Pull Request",
        body: "Click the \"View Pull Request on GitHub\" button that appears. Review what changed, then click Merge pull request. Vercel/Netlify detects the merge and deploys automatically within 1–2 minutes.",
        substeps: [],
        tip: "Once you trust the agent's fixes, enable Auto-merge. It skips the PR and deploys directly to your main branch.",
        code: null,
      },
    ],
    faq: [
      { q: "Which stack does the agent support?", a: "Next.js (App Router and Pages Router), React/Vite (index.html), and plain HTML. It detects the stack automatically from your package.json." },
      { q: "What files does it change?", a: "For Next.js App Router: app/layout.tsx. For Pages Router: pages/_document.tsx. For HTML: index.html. Always also updates robots.txt." },
      { q: "What if I use Vercel but my repo is private?", a: "The token needs Contents: Read & Write on the specific repo. Private repos work fine with Fine-grained tokens." },
    ],
  },
  {
    id: "ftp",
    icon: "📁",
    title: "FTP / cPanel",
    badge: "Shared Hosting",
    badgeColor: "bg-blue-100 text-blue-700",
    intro: "For sites hosted on GoDaddy, Hostinger, Bluehost, or any cPanel host. The agent connects over FTP and uploads patched files directly.",
    steps: [
      {
        title: "Find your FTP credentials",
        body: "Log into your hosting control panel (cPanel) and look for FTP Accounts or File Manager.",
        substeps: [
          "Log into your hosting provider's dashboard",
          "Open cPanel → FTP Accounts",
          "Your main FTP username is usually the same as your cPanel username",
          "The FTP host is typically ftp.yourdomain.com or your server IP",
          "If you don't know the password, create a new FTP account from the same page",
        ],
        tip: "Some hosts show FTP details in: Hosting → Manage → FTP Details.",
        code: null,
      },
      {
        title: "Run an audit on your site",
        body: "Go to the Audit tab, paste your URL, and click Run Audit. Wait for the full report.",
        substeps: [],
        tip: null,
        code: null,
      },
      {
        title: "Fill in the FTP deploy panel",
        body: "In the 🚀 Auto-Fix & Deploy section, select the FTP tab and enter:",
        substeps: [
          "FTP Host → ftp.yourdomain.com (or your server IP)",
          "Remote Root → /public_html (default for most cPanel hosts)",
          "Username → your FTP username",
          "Password → your FTP password",
        ],
        tip: "If your site files are in a subfolder, adjust Remote Root (e.g. /public_html/mysite).",
        code: null,
      },
      {
        title: "Click Fix & Deploy Now",
        body: "The agent connects to your server, downloads index.html, applies all SEO fixes, and uploads it back. It also uploads an updated robots.txt. The whole process takes about 30 seconds.",
        substeps: [],
        tip: null,
        code: null,
      },
      {
        title: "Verify the changes",
        body: "Open your website and view the page source (Ctrl+U in browser). You should see the updated title, meta description, canonical tag, Open Graph tags, and JSON-LD schema in the <head> section.",
        substeps: [],
        tip: "If you see the old content, clear your browser cache (Ctrl+Shift+R) and check again.",
        code: null,
      },
    ],
    faq: [
      { q: "Which files does it change?", a: "index.html and robots.txt in your remote root folder." },
      { q: "Will it break my site?", a: "No — it only modifies the <head> section of index.html (meta tags, title, schema). Your layout, scripts, and content are untouched." },
      { q: "My host uses SFTP not FTP, does it work?", a: "SFTP requires the SSH option instead. Use your SSH/SFTP credentials there." },
    ],
  },
  {
    id: "ssh",
    icon: "🖥️",
    title: "SSH / VPS",
    badge: "Advanced",
    badgeColor: "bg-orange-100 text-orange-700",
    intro: "For sites on DigitalOcean, AWS EC2, Linode, or any Linux server you control. The agent connects via SSH, patches files, and runs your deploy command.",
    steps: [
      {
        title: "Gather your SSH credentials",
        body: "You need the server IP, username, and either a password or a private key.",
        substeps: [
          "Server IP — find it in your VPS provider's dashboard (DigitalOcean → Droplets, AWS → EC2 instances)",
          "Username — usually root, ubuntu, or ec2-user depending on your OS",
          "Password — set when you created the server, OR",
          "Private Key — a .pem file from AWS or the key pair you created",
        ],
        tip: "For AWS EC2: download the .pem key file when creating the instance. Open it in a text editor and paste the full contents into the Private Key field.",
        code: null,
      },
      {
        title: "Find your site root path",
        body: "This is the folder where your website files live on the server.",
        substeps: [
          "For Nginx: usually /var/www/html or /var/www/yourdomain.com",
          "For Apache: usually /var/www/html",
          "For Node.js app: wherever your project is cloned (e.g. /var/www/app)",
          "Check your Nginx/Apache config: grep -r 'root ' /etc/nginx/",
        ],
        tip: null,
        code: "grep -r 'root ' /etc/nginx/sites-enabled/",
      },
      {
        title: "Write your deploy command (optional)",
        body: "If your site needs to be rebuilt after file changes, add the command here.",
        substeps: [],
        tip: null,
        code: "# Plain HTML — leave empty, files update in place\n\n# Next.js\ncd /var/www/app && npm run build && pm2 restart app\n\n# React/Vite\ncd /var/www/app && npm run build\n\n# Nginx reload\nnginx -s reload",
      },
      {
        title: "Fill in the SSH deploy panel",
        body: "In the 🚀 Auto-Fix & Deploy section, select the SSH tab and fill in all fields.",
        substeps: [
          "SSH Host → your server's IP address",
          "Username → root or ubuntu",
          "Password → your SSH password (leave blank if using a key)",
          "Private Key → paste your full .pem file contents",
          "Site Root → /var/www/html or your project path",
          "Deploy Command → your rebuild/restart command (optional)",
        ],
        tip: null,
        code: null,
      },
      {
        title: "Click Fix & Deploy Now",
        body: "The agent connects over SSH, reads your HTML files, applies all SEO fixes, writes them back, and runs your deploy command. The result panel shows the full output of your deploy command.",
        substeps: [],
        tip: "Check the deploy output for any errors. If your rebuild fails, fix the error manually and re-run.",
        code: null,
      },
    ],
    faq: [
      { q: "Is it safe to give SSH credentials?", a: "Credentials are sent directly to your local backend server — they never leave your machine or get stored anywhere. The backend is running at localhost:8000." },
      { q: "What if I use a non-standard port?", a: "SSH port defaults to 22. If yours is different, add it in the SSH Host field — we'll add a port field in a future update." },
      { q: "My site is a Node.js app, not static HTML — will it work?", a: "Yes — patch your index.html in the public/ or dist/ folder, then run your deploy command to rebuild. The agent will handle the file changes; your build script handles the rest." },
    ],
  },
]

function StepIcon({ n }: { n: number }) {
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
      {n}
    </div>
  )
}

export default function GuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Auto-Deploy Guide</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Learn how to connect your website so the SEO agent can fix and deploy improvements automatically — no manual file editing required.
        </p>
      </div>

      {/* How it works overview */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 mb-10">
        <h2 className="text-base font-semibold text-indigo-800 mb-3">How Auto-Deploy Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: "🔍", label: "1. Run Audit", desc: "Agent scans your URL for SEO issues" },
            { icon: "🔧", label: "2. Generate Fixes", desc: "Agent writes corrected code for every issue" },
            { icon: "📤", label: "3. Push Changes", desc: "Agent commits to your repo or uploads via FTP/SSH" },
            { icon: "🚀", label: "4. Auto-Deploy", desc: "Your hosting platform deploys the new version" },
          ].map((step, i) => (
            <div key={i} className="bg-white rounded-xl p-4 text-center border border-indigo-100">
              <div className="text-2xl mb-2">{step.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{step.label}</p>
              <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Method picker */}
      <h2 className="text-xl font-bold text-gray-800 mb-6">Choose Your Setup</h2>

      <div className="space-y-10">
        {METHODS.map((method) => (
          <div key={method.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Method header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
              <span className="text-3xl">{method.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">{method.title}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                    {method.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{method.intro}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="px-6 py-5 space-y-6">
              {method.steps.map((step, si) => (
                <div key={si} className="flex gap-4">
                  <StepIcon n={si + 1} />
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{step.title}</p>
                    <p className="text-sm text-gray-600 mb-2">{step.body}</p>
                    {step.substeps.length > 0 && (
                      <ul className="space-y-1 mb-2">
                        {step.substeps.map((sub, i) => (
                          <li key={i} className="text-sm text-gray-600 flex gap-2">
                            <span className="text-indigo-400 mt-0.5 flex-shrink-0">›</span>
                            <span>{sub}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {step.code && (
                      <pre className="bg-gray-900 text-green-300 rounded-lg px-4 py-3 text-xs font-mono overflow-auto whitespace-pre-wrap mb-2">
                        {step.code}
                      </pre>
                    )}
                    {step.tip && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                        💡 <strong>Tip:</strong> {step.tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Common Questions</p>
                <div className="space-y-3">
                  {method.faq.map((item, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-gray-700">Q: {item.q}</p>
                      <p className="text-sm text-gray-500 mt-0.5">A: {item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Which to choose */}
      <div className="mt-10 bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Not sure which to use?</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-600 font-semibold">Your setup</th>
                <th className="text-left py-2 text-gray-600 font-semibold">Use this method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["GitHub + Vercel or Netlify", "🐙 GitHub"],
                ["GitHub + GitHub Pages", "🐙 GitHub"],
                ["GoDaddy / Bluehost / Hostinger / cPanel", "📁 FTP"],
                ["DigitalOcean / AWS EC2 / Linode / VPS", "🖥️ SSH"],
                ["WordPress", "Coming in v2"],
                ["Squarespace / Wix / Webflow", "Not supported (closed platforms)"],
              ].map(([setup, method], i) => (
                <tr key={i}>
                  <td className="py-2.5 text-gray-700">{setup}</td>
                  <td className="py-2.5 font-medium text-gray-800">{method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety note */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-green-800 mb-2">🔒 Your credentials are safe</h3>
        <p className="text-sm text-green-700">
          All credentials (GitHub tokens, FTP passwords, SSH keys) are sent only to your local backend running at{" "}
          <code className="bg-green-100 px-1 rounded">localhost:8000</code>. They are never stored in a database,
          never logged, and never leave your machine. The agent uses them in memory for the duration of the deploy
          and discards them immediately after.
        </p>
      </div>
    </div>
  )
}
