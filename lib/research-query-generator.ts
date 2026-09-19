const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const GEMINI_MODEL = "gemini-2.5-flash";

const REQUEST_TIMEOUT = 15_000;

type SearchQuery = {
  type:
    | "competitors"
    | "pricing"
    | "features"
    | "funding"
    | "trends"
    | "gaps"
    | "geographic";
  query: string;
};

function withTimeout<T>(
  promise: Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error("Query generation timed out")
          ),
        timeout
      )
    ),
  ]);
}

function parseQueries(text: string): SearchQuery[] {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw new Error(
      "Invalid query generator response"
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      cleaned.slice(start, end + 1)
    );
  } catch {
    throw new Error(
      "Query generator returned invalid JSON"
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Query generator did not return an array"
    );
  }

  const allowedTypes = new Set([
    "competitors",
    "pricing",
    "features",
    "funding",
    "trends",
    "gaps",
    "geographic",
  ]);

  const queries = parsed
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        "query" in item &&
        "type" in item &&
        typeof item.query === "string" &&
        typeof item.type === "string" &&
        allowedTypes.has(item.type)
    )
    .map((item) => {
      const value = item as {
        type: string;
        query: string;
      };

      return {
        type: value.type as SearchQuery["type"],
        query: value.query.trim(),
      };
    })
    .filter(
      (item) => item.query.length > 0
    );

  if (queries.length !== 7) {
    throw new Error(
      `Query generator returned ${queries.length} valid queries. Expected exactly 7.`
    );
  }

  const seenTypes = new Set<string>();
  const seenQueries = new Set<string>();

  for (const item of queries) {
    const queryKey = item.query
      .toLowerCase()
      .trim();

    if (seenQueries.has(queryKey)) {
      throw new Error(
        "Query generator returned duplicate queries"
      );
    }

    if (seenTypes.has(item.type)) {
      throw new Error(
        `Query generator returned duplicate query type: ${item.type}`
      );
    }

    seenQueries.add(queryKey);
    seenTypes.add(item.type);
  }

  if (seenTypes.size !== 7) {
    throw new Error(
      "Query generator did not return all seven research categories"
    );
  }

  return queries;
}

function buildPrompt(
  product: string,
  geographicMarket?: string,
  targetUser?: string
): string {
  return `
You are a market research search-query specialist.

Create exactly 7 focused web search queries for this research.

PRODUCT / INDUSTRY:
${product}

GEOGRAPHIC MARKET:
${geographicMarket || "Not specified"}

TARGET USER:
${targetUser || "Not specified"}

Create exactly one query for each category:

1. competitors
2. pricing
3. features
4. funding
5. trends
6. gaps
7. geographic

The queries must have clearly different research purposes.

Requirements:

- competitors:
  Find direct and indirect competitors.

- pricing:
  Find pricing plans, subscription costs, free tiers,
  enterprise pricing, and pricing models.

- features:
  Find important product features and capabilities.

- funding:
  Find company funding, investors, acquisitions,
  founders, and company information.

- trends:
  Find current market trends and emerging developments.

- gaps:
  Find underserved users, unmet needs, limitations,
  complaints, and market opportunities.

- geographic:
  Find information specific to the requested geographic
  market. If no geographic market was provided, create
  a broader market query.

Rules:

- Return exactly 7 queries.
- Return exactly one query for each category.
- Do not duplicate categories.
- Do not duplicate queries.
- Make each query specific and useful for web search.
- Use the product/industry naturally.
- Include the target user when useful.
- Include the geographic market when useful.
- Do not invent company names.
- Do not include explanations.
- Queries must work well with Google, Tavily, or Serper.
- Return ONLY the JSON array.

Example format:

[
  {
    "type": "competitors",
    "query": "AI project management software competitors remote teams"
  },
  {
    "type": "pricing",
    "query": "AI project management software pricing plans"
  },
  {
    "type": "features",
    "query": "AI project management software features remote teams"
  },
  {
    "type": "funding",
    "query": "AI project management software companies funding investors"
  },
  {
    "type": "trends",
    "query": "AI project management software market trends 2026"
  },
  {
    "type": "gaps",
    "query": "AI project management software underserved needs remote teams"
  },
  {
    "type": "geographic",
    "query": "AI project management software United States market"
  }
]
`;
}

async function callGroq(
  prompt: string
): Promise<SearchQuery[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is missing"
    );
  }

  console.log(
    "Query Generator: Groq"
  );

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
        max_completion_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You generate focused market research search queries. Return only the requested JSON array.",
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
    REQUEST_TIMEOUT
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Groq query generation failed: ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const text =
    data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error(
      "Groq returned empty query response"
    );
  }

  return parseQueries(text);
}

async function callGemini(
  prompt: string
): Promise<SearchQuery[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing"
    );
  }

  console.log(
    "Query Generator: Gemini fallback"
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
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    }
  );

  const response = await withTimeout(
    request,
    REQUEST_TIMEOUT
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new Error(
      `Gemini query generation failed: ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(
      "Gemini returned empty query response"
    );
  }

  return parseQueries(text);
}

export async function generateSearchQueries(
  product: string,
  geographicMarket?: string,
  targetUser?: string
): Promise<string[]> {
  const prompt = buildPrompt(
    product,
    geographicMarket,
    targetUser
  );

  let queries: SearchQuery[];

  /*
   * Groq is the primary query generator.
   */
  try {
    queries = await callGroq(prompt);
  } catch (groqError) {
    console.warn(
      "Groq query generation failed. Trying Gemini fallback.",
      groqError
    );

    /*
     * Gemini is used only when Groq fails.
     */
    queries = await callGemini(prompt);
  }

  /*
   * Final validation.
   *
   * At this point both AI providers have returned
   * successfully, so we only normalize the queries.
   */
  const seen = new Set<string>();

  const uniqueQueries = queries
    .filter((item) => {
      const key = item.query
        .toLowerCase()
        .trim();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((item) => item.query.trim());

  if (uniqueQueries.length !== 7) {
    throw new Error(
      `Expected 7 unique research queries but received ${uniqueQueries.length}`
    );
  }

  return uniqueQueries;
}