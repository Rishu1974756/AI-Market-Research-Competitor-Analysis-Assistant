import { afterEach, describe, expect, it, vi } from "vitest";
import { webSearch } from "@/lib/search";

describe("Web search", () => {
  afterEach(() => {
    delete process.env.TAVILY_API_KEY;
    delete process.env.SERPER_API_KEY;
    vi.restoreAllMocks();
  });

  it("returns normalized results from Tavily", async () => {
    process.env.TAVILY_API_KEY = "test-tavily-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              title: "Asana",
              url: "https://www.asana.com/",
              content: "Project management software for teams.",
            },
            {
              title: "ClickUp",
              url: "https://clickup.com/",
              content: "Project management and productivity platform.",
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

    const results = await webSearch("project management software");

    expect(results).toHaveLength(2);

    expect(results[0]).toMatchObject({
      title: "Asana",
      url: "https://www.asana.com/",
      snippet: "Project management software for teams.",
      domain: "asana.com",
    });

    expect(results[1]).toMatchObject({
      title: "ClickUp",
      url: "https://clickup.com/",
      snippet: "Project management and productivity platform.",
      domain: "clickup.com",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty search query", async () => {
    await expect(webSearch("   ")).rejects.toThrow(
      "Search query cannot be empty"
    );
  });
});