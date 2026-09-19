import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  generateSearchQueries,
} from "@/lib/research-query-generator";

describe("Research query generator", () => {
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;

    vi.restoreAllMocks();
  });

  it("generates 7 research queries using Gemini fallback", async () => {
    process.env.GEMINI_API_KEY =
      "test-gemini-key";

    const geminiQueries = [
      {
        type: "competitors",
        query:
          "project management software competitors",
      },
      {
        type: "pricing",
        query:
          "project management software pricing plans",
      },
      {
        type: "features",
        query:
          "project management software features",
      },
      {
        type: "funding",
        query:
          "project management software companies funding",
      },
      {
        type: "trends",
        query:
          "project management software market trends 2026",
      },
      {
        type: "gaps",
        query:
          "project management software market gaps",
      },
      {
        type: "geographic",
        query:
          "project management software global market",
      },
    ];

    vi.spyOn(
      globalThis,
      "fetch"
    ).mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify(
                      geminiQueries
                    ),
                  },
                ],
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      )
    );

    const queries =
      await generateSearchQueries(
        "Project management software"
      );

    expect(queries).toHaveLength(7);

    expect(
      new Set(
        queries.map((query) =>
          query.toLowerCase().trim()
        )
      ).size
    ).toBe(7);

    expect(queries[0]).toContain(
      "competitors"
    );

    expect(queries[1]).toContain(
      "pricing"
    );

    expect(queries[2]).toContain(
      "features"
    );

    expect(queries[3]).toContain(
      "funding"
    );

    expect(queries[4]).toContain(
      "trends"
    );

    expect(queries[5]).toContain(
      "gaps"
    );

    expect(queries[6]).toContain(
      "market"
    );

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});