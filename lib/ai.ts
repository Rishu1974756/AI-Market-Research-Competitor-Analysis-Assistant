import type { ResearchReport } from "./research-types";

type AIProvider = "gemini" | "groq";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

function extractJson(text: string): string {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    throw new Error(
      "AI response does not contain valid JSON"
    );
  }

  return cleaned.slice(start, end + 1);
}

function buildResearchPrompt(
  query: string,
  sources: unknown[]
): string {
  return `
You are an expert market research analyst.

Analyze this product idea or industry:
"${query}"

Use ONLY the supplied web research as factual evidence.

WEB RESEARCH:
${JSON.stringify(sources, null, 2)}

IMPORTANT SOURCE RULES:

1. The supplied WEB RESEARCH is the only factual source of information.
2. Never invent facts.
3. Never invent competitors.
4. Never invent pricing, funding, features, dates, statistics, market sizes, or company information.
5. Never create, guess, construct, modify, or autocomplete a URL.
6. Every URL returned in the JSON MUST already exist exactly in the supplied WEB RESEARCH.
7. Never return localhost URLs.
8. Never return example.com URLs.
9. Never return placeholder URLs.
10. Never use "Not found in available sources" as a URL.
11. If a URL cannot be verified from the supplied research, return an empty string.
12. Every source object must use an exact URL from the supplied WEB RESEARCH.
13. Do not attach an unrelated source to a competitor just because the source mentions a similar keyword.
14. If reliable evidence is unavailable, use "Not found in available sources".

Create a professional competitive market research report.

REQUIREMENTS:

1. Identify 8 to 15 relevant competitors when supported by the research.
2. Do not invent competitors to reach 8 competitors.
3. For every competitor provide:
   name,
   website,
   description,
   targetUser,
   pricingModel,
   pricingTiers,
   keyFeatures,
   fundingStatus,
   founded,
   sources.
4. PRICING INTELLIGENCE:
   - Extract pricing only from the supplied research.
   - Preserve exact prices.
   - Preserve the exact currency when available.
   - Preserve billing periods when available.
   - Never estimate or calculate pricing.
   - Never convert currencies.
   - If pricing is unavailable use "Not found in available sources".
5. Identify 3 to 5 specific market gaps or unmet needs.
6. Generate SWOT with strengths, weaknesses, opportunities and threats.
7. Every factual claim must be supported by supplied sources.
8. Never create source URLs.
9. Never invent competitors, pricing, funding, company information, features, founding dates, or market statistics.
10. If information is unavailable use "Not found in available sources".
11. A competitor website MUST be an exact URL appearing in WEB RESEARCH.
12. MARKET TREND ANALYSIS:
   - Create 3 to 6 current or emerging market trends/developments.
   - Only use developments supported by supplied research.
   - Each trend needs title, concise summary, direction, and sources.
   - direction must be one of:
     rising, stable, declining, emerging, unknown.
   - Do not invent dates or developments.
13. POSITIONING DATA:
   - For each competitor provide startingPrice.
   - startingPrice must be numeric ONLY when an explicit numeric starting price is present in supplied research.
   - Otherwise use null.
   - Do not estimate prices.
   - Do not calculate prices.
   - Do not convert currencies.
   - Include currency only when explicitly available.
   - featureCount must equal the number of meaningful keyFeatures returned for that competitor.
14. Keep the report concise and useful.
15. Use exact source URLs supplied in WEB RESEARCH.
16. Return ONLY valid JSON.

COMPETITOR SOURCE REQUIREMENTS:

For every competitor:

- First identify which supplied sources actually discuss that competitor.
- Use only those sources for that competitor.
- Add 1 to 3 relevant source objects.
- The competitor website must be taken directly from one of those supplied sources.
- If the supplied source only contains information about the competitor but does not contain the competitor's own website, set website to "".
- Do NOT transform a company name into a guessed domain.
- Do NOT generate domains such as:
  "companyname.com"
  "www.companyname.com"
  "https://companyname.com"
  unless that exact URL exists in WEB RESEARCH.
- Do NOT use search-result URLs as the competitor website unless the URL is actually the competitor's own website.
- A news article, market report, Crunchbase page, Wikipedia page, or other third-party page can be a SOURCE, but it should not automatically be treated as the competitor WEBSITE.
- If a third-party source contains an explicit official website URL and that exact URL is present in the supplied research, it may be used.
- Never use localhost.

SOURCE OBJECT RULES:

Every source object must have this structure:

{
  "id": "string",
  "title": "string",
  "url": "EXACT URL FROM SUPPLIED WEB RESEARCH",
  "snippet": "string",
  "domain": "string"
}

Do not create IDs or URLs that are not supported by the supplied research.

PRICING TIER SOURCE RULES:

Every pricing tier must contain sources from the supplied research that actually support the pricing claim.

If the supplied research does not contain reliable pricing evidence:

"pricingTiers": []

and:

"pricingModel": "Not found in available sources"

Do not create a pricing tier with guessed information.

MARKET GAP SOURCE RULES:

Each market gap must be supported by one or more supplied sources.

Do not create a market gap only from general knowledge.

SWOT SOURCE RULES:

Every factual SWOT point should contain relevant supplied sources.

Do not make unsupported claims about the product, competitors, market, or industry.

POSITIONING SOURCE RULES:

Only include a numeric startingPrice when the supplied research explicitly states that price.

Example:

"startingPrice": 29.99,
"currency": "USD"

If no explicit numeric starting price exists:

"startingPrice": null,
"currency": ""

Do not use a guessed value.

Use this exact structure:

{
  "query": "string",
  "title": "string",

  "marketOverview": {
    "industry": "string",
    "targetMarket": "string",
    "geographicMarket": "string",
    "summary": "string",

    "trends": [
      "string"
    ],

    "trendAnalysis": [
      {
        "title": "string",
        "summary": "string",
        "direction": "rising",
        "sources": []
      }
    ],

    "sources": []
  },

  "competitors": [
    {
      "name": "string",

      "website": "EXACT VERIFIED URL OR EMPTY STRING",

      "description": "string",

      "targetUser": "string",

      "pricingModel": "string",

      "pricingTiers": [
        {
          "name": "string",
          "price": "string",
          "billingPeriod": "string",
          "features": [
            "string"
          ],
          "sources": []
        }
      ],

      "keyFeatures": [
        "string"
      ],

      "fundingStatus": "string",

      "founded": "string",

      "sources": []
    }
  ],

  "comparison": [
    {
      "feature": "string",

      "values": [
        {
          "competitor": "string",
          "value": "string"
        }
      ]
    }
  ],

  "marketGaps": [
    {
      "id": "string",
      "gap": "string",
      "description": "string",
      "whyMatters": "string",
      "whoNeeds": "string",
      "sources": []
    }
  ],

  "swot": {
    "strengths": [
      {
        "text": "string",
        "sources": []
      }
    ],

    "weaknesses": [
      {
        "text": "string",
        "sources": []
      }
    ],

    "opportunities": [
      {
        "text": "string",
        "sources": []
      }
    ],

    "threats": [
      {
        "text": "string",
        "sources": []
      }
    ]
  },

  "positioning": [
    {
      "competitor": "string",
      "startingPrice": null,
      "currency": "",
      "featureCount": 0,
      "sources": []
    }
  ],

  "sources": []
}

Before returning the JSON, internally verify:

- Every competitor exists in the supplied research.
- Every competitor website URL exists exactly in the supplied research.
- No website contains localhost.
- No website contains example.com.
- Every competitor source URL exists exactly in the supplied research.
- Every pricing source supports the stated pricing.
- Every positioning price is explicitly supported.
- Every market gap has supporting sources.
- Every trend has supporting sources.
- No unsupported facts were added.
- The final response contains ONLY JSON.
`;
}

async function callGemini(
  prompt: string
): Promise<ResearchReport> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Gemini failed with status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  return JSON.parse(
    extractJson(text)
  ) as ResearchReport;
}

async function callGroq(
  prompt: string
): Promise<ResearchReport> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are a precise market research analyst. Use only supplied evidence. Never invent URLs. Return valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Groq failed with status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const text =
    data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(
      "Groq returned an empty response"
    );
  }

  return JSON.parse(
    extractJson(text)
  ) as ResearchReport;
}

export async function generateResearchReport(
  query: string,
  sources: unknown[],
  provider?: AIProvider
): Promise<ResearchReport> {
  const prompt = buildResearchPrompt(
    query,
    sources
  );

  if (provider === "groq") {
    return callGroq(prompt);
  }

  if (provider === "gemini") {
    return callGemini(prompt);
  }

  try {
    return await callGemini(prompt);
  } catch (geminiError) {
    console.warn(
      "Gemini failed. Using Groq fallback.",
      geminiError
    );

    return await callGroq(prompt);
  }
}