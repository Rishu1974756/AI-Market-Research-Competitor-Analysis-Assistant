import type { ResearchReport } from "./research-types";

type AIProvider = "gemini" | "groq";

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const GEMINI_TIMEOUT = 25_000;
const GROQ_TIMEOUT = 30_000;

const MAX_AI_SOURCES = 12;
const MAX_TITLE_LENGTH = 120;
const MAX_SNIPPET_LENGTH = 350;
const MAX_URL_LENGTH = 300;

const MAX_COMPLETION_TOKENS = 2200;

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

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `${provider} request timed out after ${
              timeoutMs / 1000
            } seconds`
          )
        );
      }, timeoutMs);
    }),
  ]);
}

function compactSources(sources: unknown[]) {
  return sources
    .slice(0, MAX_AI_SOURCES)
    .map((source) => {
      const item =
        source as Record<string, unknown>;

      return {
        title:
          typeof item.title === "string"
            ? item.title.slice(
                0,
                MAX_TITLE_LENGTH
              )
            : "",

        url:
          typeof item.url === "string"
            ? item.url.slice(
                0,
                MAX_URL_LENGTH
              )
            : "",

        snippet:
          typeof item.snippet === "string"
            ? item.snippet.slice(
                0,
                MAX_SNIPPET_LENGTH
              )
            : "",

        domain:
          typeof item.domain === "string"
            ? item.domain
            : "",
      };
    })
    .filter(
      (source) => source.url.length > 0
    );
}

function buildResearchPrompt(
  query: string,
  sources: unknown[]
): string {
  const compactedSources =
    compactSources(sources);

  return `
You are an expert market research analyst.

Research topic:
"${query}"

Use ONLY the supplied web research as factual evidence.

WEB RESEARCH:
${JSON.stringify(compactedSources)}

Create a concise professional competitive market research report.

IMPORTANT:
- Prefer evidence-backed information over completeness.
- Do not invent missing information.
- Keep every field concise.
- Use the supplied URLs as source references.
- Do not create URLs.
- Return ONLY valid JSON.

RULES:

1. Identify 8 to 15 relevant competitors when supported by evidence.
2. Never invent competitors.
3. Every factual claim must be supported by supplied sources.
4. Never create source URLs.
5. Never invent pricing, funding, features, company information,
   founding dates, or statistics.
6. If information is unavailable, use:
   "Not found in available sources".
7. Competitor website must exactly match a supplied URL.
8. Pricing must only use explicit prices found in the evidence.
9. Identify 3 to 5 market gaps.
10. Generate SWOT strengths, weaknesses, opportunities and threats.
11. Generate 3 to 6 market trends when supported by evidence.
12. Keep descriptions concise.
13. Use exact URLs from supplied research.
14. Return ONLY valid JSON.

Required structure:

{
  "query": "string",
  "title": "string",

  "marketOverview": {
    "industry": "string",
    "targetMarket": "string",
    "geographicMarket": "string",
    "summary": "string",
    "trends": ["string"],

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
      "website": "string",
      "description": "string",
      "targetUser": "string",
      "pricingModel": "string",

      "pricingTiers": [
        {
          "name": "string",
          "price": "string",
          "billingPeriod": "string",
          "features": ["string"],
          "sources": []
        }
      ],

      "keyFeatures": ["string"],
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
      "currency": "string",
      "featureCount": 0,
      "sources": []
    }
  ],

  "sources": []
}
`;
}

async function callGroq(
  prompt: string
): Promise<ResearchReport> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is missing"
    );
  }

  console.log("AI Provider: Groq");

  const request = fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },

      body: JSON.stringify({
        model: GROQ_MODEL,

        temperature: 0,

        max_completion_tokens:
          MAX_COMPLETION_TOKENS,

        reasoning_effort: "low",

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content:
              "You are a precise market research analyst. Use only supplied evidence. Return only valid JSON.",
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

  const response = await withTimeout(
    request,
    GROQ_TIMEOUT,
    "Groq"
  );

  if (!response.ok) {
    const errorText =
      await response.text();

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

  try {
    return JSON.parse(
      extractJson(text)
    ) as ResearchReport;
  } catch {
    throw new Error(
      "Groq returned invalid JSON"
    );
  }
}

async function callGemini(
  prompt: string
): Promise<ResearchReport> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing"
    );
  }

  console.log(
    "AI Provider: Gemini fallback"
  );

  const request = fetch(
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
          temperature: 0.1,
          responseMimeType:
            "application/json",
        },
      }),

      cache: "no-store",
    }
  );

  const response = await withTimeout(
    request,
    GEMINI_TIMEOUT,
    "Gemini"
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Gemini failed with status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content
      ?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      "Gemini returned an empty response"
    );
  }

  try {
    return JSON.parse(
      extractJson(text)
    ) as ResearchReport;
  } catch {
    throw new Error(
      "Gemini returned invalid JSON"
    );
  }
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

  console.log(
    `AI source payload: ${Math.min(
      sources.length,
      MAX_AI_SOURCES
    )} sources`
  );

  /*
   * Explicit provider selection.
   */
  if (provider === "groq") {
    return callGroq(prompt);
  }

  if (provider === "gemini") {
    return callGemini(prompt);
  }

  /*
   * Normal production flow:
   *
   * Groq → Gemini fallback
   */
  try {
    return await callGroq(prompt);
  } catch (groqError) {
    console.warn(
      "Groq failed. Switching to Gemini.",
      groqError
    );

    return await callGemini(prompt);
  }
}