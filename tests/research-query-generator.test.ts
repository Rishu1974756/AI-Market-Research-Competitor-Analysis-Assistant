import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSearchQueries } from "@/lib/research-query-generator";

describe("Research query generator", () => {
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    vi.restoreAllMocks();
  });

  it("generates search queries using Gemini", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: [
                      "project management software competitors",
                      "best project management alternatives",
                      "project management software pricing features",
                      "project management software market trends",
                    ].join("\n"),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    const queries = await generateSearchQueries(
      "Project management software"
    );

    expect(queries).toHaveLength(4);
    expect(queries[0]).toContain("competitors");
    expect(queries[1]).toContain("alternatives");
    expect(queries[2]).toContain("pricing");
    expect(queries[3]).toContain("trends");

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});