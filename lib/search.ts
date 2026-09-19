import type { ResearchSource } from "./research-types";

type SearchResult = ResearchSource[];

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type SerperResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

type SerperResponse = {
  organic?: SerperResult[];
};

const SEARCH_TIMEOUT = 10000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, SEARCH_TIMEOUT);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchTavily(query: string): Promise<SearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured");
  }

  const response = await fetchWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 10,
        include_answer: false,
        include_raw_content: false,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Tavily request failed: ${response.status}`);
  }

  const data: TavilyResponse = await response.json();

  return (data.results || [])
    .filter((result) => result.title && result.url)
    .map((result, index) => ({
      id: `tavily-${index}-${Date.now()}`,
      title: result.title || "",
      url: result.url || "",
      snippet: result.content || "",
      domain: getDomain(result.url || ""),
    }));
}

async function searchSerper(query: string): Promise<SearchResult> {
  const apiKey = process.env.SERPER_API_KEY;

  if (!apiKey) {
    throw new Error("SERPER_API_KEY is not configured");
  }

  const response = await fetchWithTimeout(
    "https://google.serper.dev/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: 10,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Serper request failed: ${response.status}`);
  }

  const data: SerperResponse = await response.json();

  return (data.organic || [])
    .filter((result) => result.title && result.link)
    .map((result, index) => ({
      id: `serper-${index}-${Date.now()}`,
      title: result.title || "",
      url: result.link || "",
      snippet: result.snippet || "",
      domain: getDomain(result.link || ""),
    }));
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function deduplicateResults(results: SearchResult): SearchResult {
  const seen = new Set<string>();

  return results.filter((result) => {
    const normalizedUrl = result.url
      .toLowerCase()
      .replace(/\/$/, "");

    if (!normalizedUrl || seen.has(normalizedUrl)) {
      return false;
    }

    seen.add(normalizedUrl);
    return true;
  });
}

export async function webSearch(query: string): Promise<SearchResult> {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    throw new Error("Search query cannot be empty");
  }

  try {
    const results = await searchTavily(cleanQuery);

    if (results.length > 0) {
      return deduplicateResults(results);
    }

    throw new Error("Tavily returned no results");
  } catch (tavilyError) {
    console.warn(
      "Tavily search failed. Falling back to Serper.",
      tavilyError
    );

    const results = await searchSerper(cleanQuery);

    return deduplicateResults(results);
  }
}