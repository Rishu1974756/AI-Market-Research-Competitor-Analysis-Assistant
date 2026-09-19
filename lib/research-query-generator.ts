const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

function extractQueries(text: string): string[] {
  return text
    .replace(/```/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*\d.)]+\s*/, "")
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter(Boolean)
    .slice(0, 5);
}

function buildPrompt(
  query: string,
  geographicMarket?: string,
  targetUser?: string
): string {
  return `
You are a market research search specialist.

Create 4 highly relevant web search queries for this product or industry:

Product/Industry:
${query}

Geographic market:
${geographicMarket || "Not specified"}

Target user:
${targetUser || "Not specified"}

The queries should cover:
1. Direct competitors and market leaders
2. Alternative products and competing solutions
3. Pricing and key features
4. Market trends and emerging competitors

Make every query specific and useful for finding real companies.

Return ONLY 4 search queries, one per line.
Do not number them.
Do not explain anything.
`;
}

async function generateWithGemini(prompt: string): Promise<string[]> {
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
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini failed with status ${response.status}`);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return extractQueries(text);
}

async function generateWithGroq(prompt: string): Promise<string[]> {
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
              "You generate precise web search queries. Return only the queries.",
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
    throw new Error(`Groq failed with status ${response.status}`);
  }

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("Groq returned an empty response");
  }

  return extractQueries(text);
}

export async function generateSearchQueries(
  query: string,
  geographicMarket?: string,
  targetUser?: string
): Promise<string[]> {
  const prompt = buildPrompt(
    query,
    geographicMarket,
    targetUser
  );

  try {
    const queries = await generateWithGemini(prompt);

    if (queries.length >= 3) {
      return queries;
    }

    throw new Error("Gemini generated insufficient queries");
  } catch (error) {
    console.warn(
      "Gemini query generation failed. Using Groq fallback.",
      error
    );

    const queries = await generateWithGroq(prompt);

    if (queries.length < 3) {
      throw new Error("Unable to generate enough search queries");
    }

    return queries;
  }
}