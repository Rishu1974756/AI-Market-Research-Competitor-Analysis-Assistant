import { NextRequest } from "next/server";
import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

describe("External service reliability", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("falls back from Tavily to Serper when Tavily fails", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    process.env.SERPER_API_KEY = "test-serper-key";

    let callCount = 0;

    globalThis.fetch = vi.fn(async (url) => {
      callCount++;

      if (url.toString().includes("api.tavily.com")) {
        throw new Error("Tavily unavailable");
      }

      return new Response(
        JSON.stringify({
          organic: [
            {
              title: "Test Competitor",
              link: "https://example.com",
              snippet: "Test competitor result",
            },
          ],
        }),
        { status: 200 }
      );
    }) as typeof fetch;

    const { webSearch } = await import("@/lib/search");

    const results = await webSearch("AI project management");

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Test Competitor");
    expect(callCount).toBe(2);
  });

  it("fails when both Tavily and Serper are unavailable", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";
    process.env.SERPER_API_KEY = "test-serper-key";

    globalThis.fetch = vi.fn(async () => {
      throw new Error("External search service unavailable");
    }) as typeof fetch;

    const { webSearch } = await import("@/lib/search");

    await expect(
      webSearch("AI project management")
    ).rejects.toThrow();
  });

  it("falls back from Gemini to Groq when Gemini fails", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GROQ_API_KEY = "test-groq-key";

    let geminiCalled = false;
    let groqCalled = false;

    globalThis.fetch = vi.fn(async (url) => {
      const urlString = url.toString();

      if (
        urlString.includes(
          "generativelanguage.googleapis.com"
        )
      ) {
        geminiCalled = true;
        throw new Error("Gemini unavailable");
      }

      if (urlString.includes("api.groq.com")) {
        groqCalled = true;

        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: `
AI project management software
remote team project management tools
AI task automation platforms
project management competitors
`,
                },
              },
            ],
          }),
          { status: 200 }
        );
      }

      throw new Error("Unexpected API request");
    }) as typeof fetch;

    const { generateSearchQueries } = await import(
      "@/lib/research-query-generator"
    );

    const queries = await generateSearchQueries(
      "AI project management tool"
    );

    expect(geminiCalled).toBe(true);
    expect(groqCalled).toBe(true);
    expect(queries.length).toBeGreaterThanOrEqual(3);
  });

  it("fails when both Gemini and Groq are unavailable", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GROQ_API_KEY = "test-groq-key";

    globalThis.fetch = vi.fn(async () => {
      throw new Error("AI service unavailable");
    }) as typeof fetch;

    const { generateSearchQueries } = await import(
      "@/lib/research-query-generator"
    );

    await expect(
      generateSearchQueries("AI project management tool")
    ).rejects.toThrow();
  });

  it("rejects empty research input", async () => {
    const { POST } = await import("@/app/api/research/route");

    const request = new NextRequest(
      "http://localhost:3000/api/research",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);

    expect(data.error).toBe(
      "Product idea or industry is required."
    );
  });
});
