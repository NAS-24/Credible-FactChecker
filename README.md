<div align="center">
  <a href="https://credible-website.vercel.app/">
    <img src="images/logo.png" alt="Credible Logo" width="120" height="120">
  </a>

  <h1 align="center">Credible: Agentic Fact-Checker</h1>

  <p align="center">
    <strong>Real-time credibility signals for the modern web.</strong><br>
    Powered by Agentic AI (GPT-OSS + Groq + Tavily).
  </p>

  <p align="center">
    <a href="https://microsoftedge.microsoft.com/addons/detail/credible-agentic-factch/glhckknhelfandbhbibnmdkpebacokpk">
      <img src="https://img.shields.io/badge/Edge_Store-Available-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Available on Edge">
    </a>
    <a href="https://credible-website.vercel.app/">
      <img src="https://img.shields.io/badge/Website-Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Website">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
    </a>
    <img src="https://img.shields.io/badge/Version-1.7.0-blue?style=for-the-badge" alt="Version">
  </p>
  
  <br>
</div>

## 🕵️‍♂️ About The Project

**Credible** is not just a bias blocker—it is an autonomous AI agent that lives in your browser.

While you browse, Credible's "Fast Brain" scans search results and headlines for misinformation. When you need deep verification, its "Slow Brain" (Agentic Workflow) actively researches claims, cross-references government data, and provides citations—all without you leaving the tab.

---

## 📸 Gallery

<div align="center">
  <img src="images/img1.png" width="30%" alt="Feature 1">
  <img src="images/img2.png" width="30%" alt="Feature 2">
  <img src="images/img3.png" width="30%" alt="Feature 3">
  <br><br>
  <img src="images/img4.png" width="30%" alt="Feature 4">
  <img src="images/img5.png" width="30%" alt="Feature 5">
  <img src="images/img6.png" width="30%" alt="Feature 6">
  <p><i>From Left to Right: Search Tagging, Context Menu Verify, Full Article Scan, Source Transparency, Dark Mode, and Settings.</i></p>
</div>

---

## ⚡ Key Features

<table>
  <tr>
    <td width="50%">
      <h3 align="center">🚦 Tier 1: Instant Signals</h3>
      <p align="center">
        As you scroll Google or Bing, Credible automatically tags domains based on a trusted ledger of fact-checkers and official sources.
      </p>
    </td>
    <td width="50%">
      <h3 align="center">🖱️ Tier 2: Context Menu</h3>
      <p align="center">
        Highlight any suspicious text -> <b>Right Click</b> -> <b>"Verify with Credible"</b>. Our Agent reads the context and returns a verdict in seconds.
      </p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3 align="center">📑 Tier 3: Deep Scan</h3>
      <p align="center">
        Open the popup to scan an entire news article. The AI extracts key factual claims and verifies them individually.
      </p>
    </td>
    <td width="50%">
      <h3 align="center">🧠 Hybrid Brain Architecture</h3>
      <p align="center">
        Uses <b>GPT-OSS-20B</b> for sub-second claim extraction and <b>GPT-OSS-120B</b> for complex reasoning and evidence synthesis — both served via Groq's ultra-fast LPU inference.
      </p>
    </td>
  </tr>
</table>

---

## 🚀 Getting Started

### Installation (User)
The easiest way to use Credible is via the official store:
1.  Visit the [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/credible-agentic-factch/glhckknhelfandbhbibnmdkpebacokpk).
2.  Click **Get**.
3.  Pin the extension to your toolbar.

### Local Development (Developer)
To build and modify the extension source code:

```bash
# 1. Clone the repo
git clone https://github.com/NAS-24/Credible-FactChecker.git

# 2. Install Backend Dependencies
cd backend
pip install -r requirements.txt

# 3. Start the Agent Server
uvicorn main:app --reload
```

### Environment Variables
Create a `.env` file inside the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

---

## 🏗️ Architecture
```
Browser Extension (Manifest V3)
│
├── Tier 1: content_google.js / content_bing.js
│   └── Domain tagging via credibility_sources.py ledger
│
├── Tier 2: background.js → /api/verify-text
│   └── GPT-OSS-120B reasons against Tavily evidence
│
└── Tier 3: popup.js → /api/extract-claims → /api/verify-text
    ├── scraper_service.py fetches article HTML
    └── GPT-OSS-20B extracts claims → GPT-OSS-120B verifies each
```

---

## 📋 Changelog

### v1.7.0 — Model Migration (September 2026)
- **Migrated Fast Brain**: `llama-3.1-8b-instant` → `openai/gpt-oss-20b` (Groq production stable)
- **Migrated Slow Brain**: `llama-3.3-70b-versatile` → `openai/gpt-oss-120b` (Groq production stable)
- Both Llama models were decommissioned by Groq on August 16, 2026

### v1.6.0
- Initial public release with Hybrid Brain architecture
- Microsoft Edge Add-ons Store listing live
- Tavily search integration with India authority domain filtering
