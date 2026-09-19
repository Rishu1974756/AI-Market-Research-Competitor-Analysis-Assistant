# AI Market Research & Competitor Analysis Assistant

An AI-powered market research and competitor analysis platform that transforms a product idea or industry description into a structured, evidence-backed research report.

The application automatically generates search queries, searches the web for relevant competitors, extracts competitor information, uses AI to analyze the competitive landscape, identifies market gaps, generates a SWOT analysis, analyzes pricing and trends, and presents the results in an interactive dashboard with source citations.

---

## 🚀 Features

### 🔎 AI-Powered Market Research

Enter a product idea or industry and optionally provide:

* Geographic market
* Target user

Example:

> AI-powered project management platform for remote teams

The system automatically generates targeted search queries and searches the web for relevant market information.

---

### 🏢 Automated Competitor Discovery

The application uses AI-generated search queries and web search APIs to identify relevant competitors.

The research pipeline:

```text
Product / Industry Input
        ↓
AI Search Query Generation
        ↓
Web Search
        ↓
Search Result Aggregation
        ↓
AI Competitor Analysis
        ↓
Structured Research Report
```

The system can identify up to 15 relevant competitors and collect information such as:

* Company name
* Website
* Description
* Target users
* Pricing model
* Pricing tiers
* Key features
* Funding status
* Sources

---

### 📊 Competitor Comparison

Competitors are displayed in an interactive comparison table.

The table supports:

* Sorting
* Filtering
* Target-user comparison
* Pricing comparison
* Feature comparison
* Funding information
* Source verification

Users can directly open the provided sources to verify competitor information.

---

### 💰 Pricing Intelligence

The application extracts available pricing information from research results and organizes it into structured pricing data.

Pricing information can include:

* Pricing model
* Free plans
* Paid plans
* Monthly pricing
* Annual pricing
* Enterprise pricing
* Plan features

A pricing comparison section makes it easier to understand how competitors position their pricing.

---

### 📈 Market Trends

The research pipeline also analyzes recent market information and identifies relevant trends in the selected product or industry.

The report can contain:

* Emerging trends
* Market developments
* Competitor movements
* Relevant recent information
* Supporting sources

---

### 🎯 Market Gap Identification

The AI analyzes the competitive landscape and identifies underserved areas in the market.

The report generates approximately 3–5 market gaps, including:

* Unmet customer needs
* Missing features
* Underserved user segments
* Product opportunities
* Competitive weaknesses

Each insight is grounded in the available research sources.

---

### 🧩 SWOT Analysis

The application generates a structured SWOT analysis:

| Category      | Analysis                               |
| ------------- | -------------------------------------- |
| Strengths     | Potential advantages of the product    |
| Weaknesses    | Potential limitations or disadvantages |
| Opportunities | Market opportunities and unmet needs   |
| Threats       | Competitive and market risks           |

The SWOT analysis is generated from the product idea and the collected competitive landscape.

---

### 🗺️ Competitive Positioning Map

The report includes a competitive positioning visualization that helps compare competitors across market dimensions such as pricing and feature richness.

This helps users visually understand where competitors are positioned and where a new product could potentially differentiate itself.

---

### 📄 PDF Report Export

Research reports can be exported as a polished PDF.

The exported report can include:

* Market overview
* Competitor analysis
* Pricing information
* Market trends
* Market gaps
* SWOT analysis
* Competitive positioning
* Research sources

The application uses `html2canvas-pro` and `jsPDF` for client-side PDF generation.

---

### 🔗 Source Citations & Traceability

A major focus of the application is research traceability.

Research sources are collected from web search APIs and associated with the generated competitor and market insights.

Users can:

* View source titles
* Open source URLs
* Verify competitor information
* Review the research evidence

The AI is instructed to avoid inventing sources or unsupported URLs.

---

### 👤 Authentication

The application includes user authentication with:

* Signup
* Login
* Logout
* Session management
* Protected research history
* User-specific saved reports

Passwords are hashed using `bcryptjs`.

Authentication uses HTTP-only cookies for session management.

---

### 🗂️ Research History

Users can save generated research reports and access them later.

The dashboard supports:

* Saving research
* Viewing previous reports
* Opening saved reports
* Deleting research
* User-specific research history

Research records are stored in MongoDB.

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* JavaScript/TypeScript client components

### Backend

* Next.js API Routes
* Node.js
* MongoDB

### AI

* Google Gemini
* Groq

The application uses Gemini as the primary AI provider with Groq as a fallback.

### Web Search

* Tavily
* Serper

Tavily is used as the primary web search provider and Serper is used as a fallback when Tavily fails.

### Authentication

* bcryptjs
* HTTP-only cookies
* MongoDB session storage

### PDF Generation

* html2canvas-pro
* jsPDF

### Testing

* Vitest

### Deployment

* Vercel / Next.js compatible hosting

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │      User Input     │
                    │ Product / Industry  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Query Generator    │
                    │ Gemini / Groq        │
                    └──────────┬──────────┘
                               │
                     Smart Search Queries
                               │
                               ▼
              ┌────────────────────────────────┐
              │         Web Search Layer        │
              │                                │
              │      Tavily → Serper Fallback  │
              └───────────────┬────────────────┘
                              │
                       Search Results
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Research AI       │
                    │ Gemini / Groq        │
                    └──────────┬──────────┘
                               │
                               ▼
              ┌────────────────────────────────┐
              │       Research Report          │
              │                                │
              │ Competitors                    │
              │ Pricing                        │
              │ Trends                         │
              │ Market Gaps                    │
              │ SWOT                           │
              │ Positioning                    │
              │ Sources                        │
              └───────────────┬────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Next.js Dashboard │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        Save Research     PDF Export      Source Links
              │
              ▼
        ┌───────────────┐
        │    MongoDB    │
        │ Auth + History│
        └───────────────┘
```

---

## 📁 Project Structure

```text
ai-research/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── me/
│   │   │   └── signup/
│   │   │
│   │   └── research/
│   │       ├── history/
│   │       ├── save/
│   │       └── route.ts
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── lib/
│   ├── ai.ts
│   ├── mock-research.ts
│   ├── research-query-generator.ts
│   ├── research-types.ts
│   └── search.ts
│
├── tests/
│   ├── research-normalization.test.ts
│   ├── research-query-generator.test.ts
│   ├── research-validation.test.ts
│   └── search.test.ts
│
├── .env
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

---

## 🔄 Research Workflow

### 1. User enters a research topic

The user provides:

```text
Product / Industry
Geographic Market
Target User
```

Only the product or industry input is required.

---

### 2. AI generates search queries

The query-generation layer creates multiple search queries covering areas such as:

* Direct competitors
* Alternative products
* Market leaders
* Pricing and features
* Emerging competitors
* Market trends

---

### 3. Web search

The generated queries are sent to the web search layer.

The application uses:

```text
Tavily
   ↓
If Tavily fails
   ↓
Serper
```

Search results are normalized and deduplicated before being passed to the AI analysis layer.

---

### 4. AI research analysis

The AI receives the collected search results and generates a structured research report.

The AI is instructed to:

* Use provided sources
* Avoid inventing URLs
* Ground claims in available evidence
* Return structured data
* Identify relevant competitors
* Generate market gaps
* Generate SWOT analysis
* Analyze trends and pricing

---

### 5. Report normalization

Before the report is returned to the frontend, the backend validates and normalizes the AI output.

This helps ensure:

* Valid competitor data
* Valid websites
* Source associations
* Required default values
* Competitor limits
* Consistent report structure

---

### 6. Dashboard

The final report is displayed through horizontal sections:

```text
Market Overview
     ↓
Competitors
     ↓
Pricing
     ↓
Trends
     ↓
Gaps
     ↓
SWOT
     ↓
Sources
```

Only the selected section is displayed, keeping the dashboard easy to navigate.

---

## 🧪 Testing

The project uses Vitest for automated testing.

Current test coverage includes:

### Search validation

Tests:

* Valid search results
* Empty search query handling
* Search result normalization

### Query generation

Tests the AI search-query generation flow without calling real AI APIs.

### Research validation

Tests:

* Valid research report structure
* Invalid report handling

### Research normalization

Tests:

* Competitor normalization
* Website normalization
* Source normalization
* Competitor limits

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd ai-research
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=research-ai

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b

GEMINI_API_KEY=your_gemini_api_key

TAVILY_API_KEY=your_tavily_api_key
SERPER_API_KEY=your_serper_api_key
```

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

| Variable         | Purpose                      |
| ---------------- | ---------------------------- |
| `MONGODB_URI`    | MongoDB connection string    |
| `MONGODB_DB`     | MongoDB database name        |
| `GEMINI_API_KEY` | Google Gemini API access     |
| `GROQ_API_KEY`   | Groq API access              |
| `GROQ_MODEL`     | Groq model used for fallback |
| `TAVILY_API_KEY` | Tavily web search            |
| `SERPER_API_KEY` | Serper web search fallback   |

**Never commit `.env` or `.env.local` to GitHub.**

---

## 🛡️ Security

The application follows several basic security practices:

* API keys are stored in environment variables.
* Environment files are excluded through `.gitignore`.
* Passwords are hashed using `bcryptjs`.
* Authentication uses HTTP-only cookies.
* Research history is associated with authenticated users.
* API credentials are kept on the server.
* User research data is stored in MongoDB.
* Authentication routes validate sessions before protected operations.

---

## 📌 API Routes

### Authentication

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Research

```text
POST   /api/research
GET    /api/research/history
GET    /api/research/history/[id]
POST   /api/research/save
DELETE /api/research/history/[id]
```

---

## 🧠 AI Provider Fallback

The project is designed with fallback providers to improve reliability.

### Query Generation

```text
Gemini
   ↓
Groq fallback
```

### Research Analysis

```text
Gemini
   ↓
Groq fallback
```

### Web Search

```text
Tavily
   ↓
Serper fallback
```

This reduces dependency on a single external provider.

---

## 📄 Example Research Input

```text
Product:
AI-powered project management platform for remote teams

Geographic Market:
United States

Target User:
Remote software development teams
```

The application can then generate a report containing:

```text
Market Overview
Competitors
Pricing
Market Trends
Market Gaps
SWOT Analysis
Competitive Positioning
Sources
```

---

## 🎯 Problem This Project Solves

Traditional competitor research requires users to manually:

1. Search Google
2. Open multiple competitor websites
3. Compare products
4. Research pricing
5. Identify market gaps
6. Analyze trends
7. Create a SWOT analysis
8. Collect and organize sources

This application combines those steps into a single AI-powered workflow.

```text
Manual Research

Search → Open Websites → Collect Data → Compare
        → Analyze → Write Report → Find Sources

                    ↓

             AI Market Research

Input → Search → AI Analysis → Structured Report
```

---

## 🚀 Future Improvements

Potential future improvements include:

* More advanced competitor relevance scoring
* Additional web search providers
* More detailed company funding research
* Improved pricing extraction
* News and SEC filing analysis
* Advanced competitive positioning models
* More detailed source-level confidence scoring
* Research caching and rate limiting
* Team collaboration
* Shareable research reports

---

## 🏆 Hackathon Alignment

The project implements the main workflow described in the hackathon problem:

* Product/industry research input
* AI-generated search queries
* Automated competitor discovery
* Competitor aggregation
* Competitor comparison
* Market gap identification
* SWOT analysis
* Pricing intelligence
* Trend analysis
* Source citations
* PDF report export
* Competitive positioning
* Research history
* Authentication

The architecture is designed around:

```text
User Input
    ↓
AI Query Generation
    ↓
Web Search
    ↓
Source Aggregation
    ↓
AI Analysis
    ↓
Validated Research Report
    ↓
Interactive Dashboard
    ↓
Save / Export / Verify
```

---

## 📜 License

This project was created as a hackathon project for demonstrating AI-powered market research and competitive analysis.
