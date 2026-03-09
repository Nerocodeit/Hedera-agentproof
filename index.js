require("dotenv").config();
const express = require("express");
const Groq = require("groq-sdk");
const crypto = require("crypto");

const {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction
} = require("@hashgraph/sdk");

const app = express();

let analysisHistory = [];

/* ---------- AI ---------- */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ---------- HEDERA ---------- */
const hederaClient = Client.forTestnet();
hederaClient.setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
  PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
);

app.use(express.urlencoded({ extended: true }));

/* ========================================================= */
/* ======================= SHARED STYLES =================== */
/* ========================================================= */

const sharedStyles = `
  :root {
    --primary: #f97316;
    --primary-dark: #ea580c;
    --bg: #ffffff;
    --card: #ffffff;
    --text: #1f2937;
    --text-light: #6b7280;
    --border: #e5e7eb;
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
  }
  .fade-in {
    animation: fadeIn 0.8s ease-out forwards;
  }
  @keyframes fadeIn {
    from { opacity:0; transform: translateY(20px); }
    to   { opacity:1; transform: translateY(0); }
  }
  .card {
    background: var(--card);
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 35px -10px rgba(249,115,22,0.15);
  }
  button {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border: none;
    padding: 14px 32px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 14px rgba(249,115,22,0.25);
  }
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(249,115,22,0.35);
  }
  .badge {
    padding: 8px 18px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
    text-transform: uppercase;
  }
  .badge.low    { background:#dcfce7; color:#166534; }
  .badge.medium { background:#fef3c7; color:#92400e; }
  .badge.high   { background:#fee2e2; color:#991b1b; }
`;

/* ========================================================= */
/* ======================= PARSER ========================== */
/* ========================================================= */

function parseAiResponse(text) {
  const lower = text.toLowerCase();
  let riskRating = 'Low';
  let confidenceLevel = 'Medium';
  let confidenceNum = 75;

  // Extract Risk Rating
  const riskMatch = text.match(/Risk Rating:\s*(\w+)/i);
  if (riskMatch) {
    const val = riskMatch[1].toLowerCase();
    if (val.includes('high')) riskRating = 'High';
    else if (val.includes('medium')) riskRating = 'Medium';
    else riskRating = 'Low';
  }

  // Extract Confidence Level
  const confMatch = text.match(/Confidence Level:\s*(\w+)/i);
  if (confMatch) {
    const val = confMatch[1].toLowerCase();
    if (val.includes('high')) {
      confidenceLevel = 'High';
      confidenceNum = 90;
    } else if (val.includes('medium')) {
      confidenceLevel = 'Medium';
      confidenceNum = 75;
    } else if (val.includes('low')) {
      confidenceLevel = 'Low';
      confidenceNum = 50;
    }
  }

  return { riskRating, confidenceLevel, confidenceNum };
}

/* ========================================================= */
/* ======================= HOME ============================ */
/* ========================================================= */

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AgentProof - Web3 Risk Intelligence</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    ${sharedStyles}
    header {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: linear-gradient(to right, #fff8f0, #fffaf5);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 4px 14px rgba(249,115,22,0.1);
      z-index: 1000;
      padding: 1.1rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.7rem;
      font-weight: 800;
      background: linear-gradient(90deg, var(--primary), #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav a {
      margin-left: 2.2rem;
      color: var(--text);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }
    .nav a:hover { color: var(--primary); }
    .hero {
      padding: 140px 5% 100px;
      text-align: center;
      background: linear-gradient(135deg, #ffffff 0%, #fffaf5 100%);
    }
    .hero h1 {
      font-size: clamp(2.6rem, 7vw, 4rem);
      font-weight: 800;
      margin-bottom: 1.3rem;
      background: linear-gradient(90deg, #111827, var(--primary), #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1.3rem; color: var(--text-light); max-width: 720px; margin: 0 auto 3rem; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    textarea {
      width: 100%;
      height: 200px;
      padding: 1.4rem;
      border: 2px solid var(--border);
      border-radius: 14px;
      font-size: 1.05rem;
      resize: vertical;
      transition: all 0.3s;
    }
    textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(249,115,22,0.15);
    }
    .footer { text-align: center; padding: 5rem 0 2rem; color: var(--text-light); font-size: 0.95rem; }
  </style>
</head>
<body>

  <header>
    <div class="logo">AGENTPROOF</div>
    <nav class="nav">
      <a href="/">Analyze</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </header>

  <section class="hero fade-in">
    <div class="container">
      <h1>AI-Powered Web3 Risk Intelligence</h1>
      <p>Analyze projects instantly • Get structured security reports • Anchor proofs immutably on Hedera</p>
      <div class="card" style="padding:2.8rem; max-width:760px; margin:0 auto;">
        <form method="POST" action="/analyze">
          <textarea name="projectText" placeholder="Paste the Web3 project description, smart contract overview, tokenomics, team info, or any relevant details here..."></textarea>
          <button type="submit" style="margin-top:1.8rem; width:100%; font-size:1.15rem; padding:16px 40px;">Run Security Analysis</button>
        </form>
      </div>
    </div>
  </section>

  <div class="footer">
    Immutable AI Risk Reports • Powered by Groq & Hedera • © ${new Date().getFullYear()}
  </div>

</body>
</html>
  `);
});

/* ========================================================= */
/* ===================== ANALYZE =========================== */
/* ========================================================= */

app.post("/analyze", async (req, res) => {
  try {
    const projectText = req.body.projectText?.trim();
    if (!projectText) return res.send("<h2 style='padding:4rem;text-align:center;'>No description provided.</h2>");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: `You are a senior Web3 security auditor.\nOnly analyze provided info.\nOutput exactly in this format:\n\nRisk Rating: (Low / Medium / High)\n\nExecutive Summary:\n...\n\nKey Risk Factors:\n- ...\n\nTechnical Security Concerns:\n- ...\n\nBusiness Model Risks:\n- ...\n\nRecommendations:\n- ...\n\nConfidence Level: (Low / Medium / High)` },
        { role: "user", content: projectText }
      ],
      model: "llama-3.1-8b-instant",
    });

    const aiResponse = completion.choices[0].message.content.trim();

    const parsed = parseAiResponse(aiResponse);

    const hash = crypto.createHash("sha256").update(aiResponse).digest("hex");

    const tx = await new TopicMessageSubmitTransaction({
      topicId: process.env.HEDERA_TOPIC_ID,
      message: hash
    }).execute(hederaClient);

    const transactionId = tx.transactionId.toString();

    analysisHistory.push({
      hash,
      risk: aiResponse,
      riskRating: parsed.riskRating,
      confidence: parsed.confidenceNum,
      transactionId,
      date: new Date().toLocaleString()
    });

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Analysis Result | AgentProof</title>
  <style>
    ${sharedStyles}
    header {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: linear-gradient(to right, #fff8f0, #fffaf5);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      box-shadow: 0 4px 14px rgba(249,115,22,0.1);
      z-index: 1000;
      padding: 1.1rem 3rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-size: 1.7rem; font-weight: 800; background: linear-gradient(90deg, var(--primary), #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav a { margin-left: 2.2rem; color: var(--text); text-decoration: none; font-weight: 600; transition: color 0.3s; }
    .nav a:hover { color: var(--primary); }
    .main-content { padding: 120px 5% 80px; }
    .result-card { padding: 2.8rem; }
    pre { background: #fafafa; padding: 1.8rem; border-radius: 14px; white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 0.98rem; line-height: 1.8; border: 1px solid #f0f0f0; }
    .bar { height: 14px; background: #f3f4f6; border-radius: 999px; overflow: hidden; margin: 1.2rem 0; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, var(--primary), #f59e0b); width: ${parsed.confidenceNum}%; transition: width 1.4s ease-out; }
    .actions a {
      display: inline-block; margin: 0.8rem 1.2rem 0 0; padding: 0.9rem 1.8rem;
      background: #f3f4f6; color: var(--text); text-decoration: none; border-radius: 12px; font-weight: 600; transition: all 0.3s;
    }
    .actions a:hover { background: var(--primary); color: white; transform: translateY(-3px); }
    .actions a.primary { background: var(--primary); color: white; }
  </style>
</head>
<body>

  <header>
    <div class="logo">AGENTPROOF</div>
    <nav class="nav">
      <a href="/">Analyze</a>
      <a href="/dashboard">Dashboard</a>
    </nav>
  </header>

  <section class="main-content fade-in">
    <div class="container">
      <div class="card result-card">
        <div class="badge ${parsed.riskRating.toLowerCase()}">${parsed.riskRating} RISK</div>
        <h2 style="margin:1.8rem 0 1.2rem;">AI Security Report</h2>
        <pre>${aiResponse}</pre>

        <h3 style="margin:2.5rem 0 1rem;">Confidence Level: ${parsed.confidenceNum}% (${parsed.confidenceLevel})</h3>
        <div class="bar"><div class="bar-fill"></div></div>

        <h4 style="margin:2.5rem 0 1rem;">Hedera Transaction</h4>
        <p style="font-family:monospace; word-break:break-all; color:var(--text-light);">${transactionId}</p>

        <div class="actions">
          <a href="/dashboard">Back to Dashboard</a>
          <a href="/report/${transactionId}" target="_blank" class="primary">Download Report</a>
          <a href="https://hashscan.io/testnet/transaction/${transactionId}" target="_blank">View on Hedera</a>
        </div>
      </div>
    </div>
  </section>

</body>
</html>
    `);
  } catch (err) {
    res.send(`<div style="padding:6rem 2rem;text-align:center;"><h2>Error</h2><pre style="max-width:800px;margin:2rem auto;">${err.message}</pre></div>`);
  }
});

/* ========================================================= */
/* ===================== DASHBOARD ========================= */
/* ========================================================= */

app.get("/dashboard", (req, res) => {
  const total = analysisHistory.length;
  const high   = analysisHistory.filter(x => x.riskRating === 'High').length;
  const medium = analysisHistory.filter(x => x.riskRating === 'Medium').length;
  const low    = analysisHistory.filter(x => x.riskRating === 'Low').length;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dashboard | AgentProof</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    ${sharedStyles}
    .layout { display: flex; min-height: 100vh; }
    aside {
      width: 260px; background: #fafafa; border-right: 1px solid var(--border);
      padding: 2.5rem 1.8rem; position: fixed; height: 100%; overflow-y: auto;
    }
    aside h2 {
      font-size: 1.8rem; background: linear-gradient(90deg, var(--primary), #f59e0b);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 3rem;
    }
    aside a {
      display: block; padding: 1.1rem; color: var(--text-light); text-decoration: none;
      border-radius: 12px; margin-bottom: 0.6rem; transition: all 0.3s; font-weight: 500;
    }
    aside a:hover, aside a.active { background: rgba(249,115,22,0.12); color: var(--primary); }
    main { margin-left: 260px; flex: 1; padding: 120px 3.5rem 5rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.8rem; margin-bottom: 3rem; }
    .stat-card { padding: 2rem; text-align: center; }
    .stat-number { font-size: 3.2rem; font-weight: 800; color: var(--primary); margin: 0.6rem 0; }
    .history-list p { padding: 1.4rem; border-bottom: 1px solid var(--border); transition: background 0.3s; }
    .history-list p:hover { background: #fffaf5; }
  </style>
</head>
<body class="layout">

  <aside>
    <h2>AGENTPROOF</h2>
    <a href="/">New Analysis</a>
    <a href="/dashboard" class="active">Dashboard</a>
  </aside>

  <main class="fade-in">
    <h1 style="margin-bottom:2.5rem;">Dashboard</h1>

    <div class="stats-grid">
      <div class="card stat-card">
        <div style="font-size:1.15rem; color:var(--text-light);">Total Scans</div>
        <div class="stat-number">${total}</div>
      </div>
      <div class="card stat-card">
        <div style="font-size:1.15rem; color:var(--text-light);">High Risk</div>
        <div class="stat-number" style="color:#dc2626;">${high}</div>
      </div>
      <div class="card stat-card">
        <div style="font-size:1.15rem; color:var(--text-light);">Medium Risk</div>
        <div class="stat-number" style="color:#d97706;">${medium}</div>
      </div>
      <div class="card stat-card">
        <div style="font-size:1.15rem; color:var(--text-light);">Low Risk</div>
        <div class="stat-number" style="color:#16a34a;">${low}</div>
      </div>
    </div>

    <div class="card" style="padding:2.5rem; margin-bottom:3rem;">
      <h3 style="margin-bottom:1.8rem;">Risk Distribution</h3>
      <canvas id="chart" height="200"></canvas>
    </div>

    <div class="card" style="padding:2.5rem;">
      <h3 style="margin-bottom:1.8rem;">Recent Scans</h3>
      <div class="history-list">
        ${analysisHistory.length === 0 
          ? "<p style='padding:2rem;text-align:center;'>No analyses yet. Run your first scan!</p>"
          : analysisHistory.map(item => `
            <p>
              <strong>${item.date}</strong><br>
              <span style="color:var(--text-light); font-size:0.95rem;">
                Risk: ${item.riskRating} • TX: ${item.transactionId.slice(0,22)}...
              </span>
            </p>
          `).join("")}
      </div>
    </div>
  </main>

  <script>
    new Chart(document.getElementById("chart"), {
      type: 'doughnut',
      data: {
        labels: ['Low', 'Medium', 'High'],
        datasets: [{
          data: [${low}, ${medium}, ${high}],
          backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 15, weight: '500' } } }
        }
      }
    });
  </script>

</body>
</html>
  `);
});

/* ========================================================= */
/* ===================== REPORT ============================ */
/* ========================================================= */

app.get("/report/:txId", (req, res) => {
  const report = analysisHistory.find(item => item.transactionId === req.params.txId);
  if (!report) return res.send("<h2 style='padding:6rem;text-align:center;'>Report not found</h2>");

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AgentProof Report - ${report.date}</title>
  <style>
    body { font-family:Inter,system-ui,sans-serif; padding:5rem; max-width:960px; margin:auto; line-height:1.8; }
    h1 { color:var(--primary); margin-bottom:1.5rem; }
    pre { background:#fafafa; padding:2.2rem; border-radius:14px; white-space:pre-wrap; font-family:monospace; border:1px solid #f0f0f0; }
    .meta { color:#6b7280; margin:2rem 0 3.5rem; font-size:1.05rem; }
    hr { border:none; border-top:1px solid #e5e7eb; margin:2.5rem 0; }
    @media print { body { padding:1.5cm; } a { display:none; } }
  </style>
</head>
<body onload="window.print()">
  <h1>AgentProof Security Report</h1>
  <div class="meta">
    Date: ${report.date}<br>
    Risk Rating: ${report.riskRating}<br>
    Confidence: ${report.confidence}%<br>
    Transaction: ${report.transactionId}<br>
    SHA256 Hash: ${report.hash}
  </div>
  <hr>
  <pre>${report.risk}</pre>
</body>
</html>
  `);
});

/* ---------------- START ---------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});