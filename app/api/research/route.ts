import { NextRequest, NextResponse } from "next/server";

import { webSearch } from "@/lib/search";
import { generateResearchReport } from "@/lib/ai";
import { mockResearchReport } from "@/lib/mock-research";

import type {
  ResearchReport,
  ResearchSource,
} from "@/lib/research-types";

import { generateSearchQueries } from "@/lib/research-query-generator";

import {
  validateResearchTopic,
  validateGeographicMarket,
  validateTargetUser,
} from "@/lib/research-topic-validator";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function isValidWebsite(url: string): boolean {
  if (!url) return false;

  const value = url.trim();

  if (
    value.includes("Not found in available sources") ||
    value.includes("localhost") ||
    value.includes("example.com")
  ) {
    return false;
  }

  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function mergeSources(
  sourceGroups: ResearchSource[][]
): ResearchSource[] {
  const seen = new Set<string>();
  const merged: ResearchSource[] = [];

  for (const group of sourceGroups) {
    for (const source of group) {
      if (!source?.url) continue;

      const key = source.url
        .replace(/\/$/, "")
        .toLowerCase();

      if (seen.has(key)) continue;

      seen.add(key);
      merged.push(source);
    }
  }

  return merged;
}

function sourceMatchesCompetitor(
  competitorName: string,
  source: ResearchSource
): boolean {
  const competitor = normalizeText(competitorName);
  const title = normalizeText(source.title || "");
  const snippet = normalizeText(source.snippet || "");
  const domain = normalizeText(getDomain(source.url));

  const words = competitor
    .split(" ")
    .filter((word) => word.length >= 3);

  if (!words.length) {
    return false;
  }

  const combined = `${title} ${snippet} ${domain}`;

  const importantWords = words.filter(
    (word) =>
      ![
        "limited",
        "corporation",
        "company",
        "international",
        "semiconductor",
        "manufacturing",
        "group",
        "ltd",
        "inc",
      ].includes(word)
  );

  const matches = importantWords.filter((word) =>
    combined.includes(word)
  ).length;

  if (importantWords.length === 1) {
    return matches === 1;
  }

  return (
    matches >=
    Math.max(
      1,
      Math.ceil(importantWords.length * 0.5)
    )
  );
}

function findCompetitorSources(
  competitorName: string,
  competitorSources: ResearchSource[],
  allSources: ResearchSource[]
): ResearchSource[] {
  const validOwnSources = (
    competitorSources || []
  ).filter((source) => source?.url);

  const matchedGlobalSources = allSources.filter((source) =>
    sourceMatchesCompetitor(competitorName, source)
  );

  const combined = [
    ...validOwnSources,
    ...matchedGlobalSources,
  ];

  const seen = new Set<string>();
  const result: ResearchSource[] = [];

  for (const source of combined) {
    if (!source?.url) continue;

    const key = source.url
      .replace(/\/$/, "")
      .toLowerCase();

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(source);
  }

  return result.slice(0, 3);
}

function findCompetitorWebsite(
  competitorName: string,
  competitorWebsite: string,
  sources: ResearchSource[]
): string {
  if (isValidWebsite(competitorWebsite)) {
    return competitorWebsite.trim();
  }

  const validSources = sources.filter((source) =>
    isValidWebsite(source.url)
  );

  if (!validSources.length) {
    return "";
  }

  const competitorWords = normalizeText(competitorName)
    .split(" ")
    .filter((word) => word.length >= 3);

  let bestSource: ResearchSource | null = null;
  let bestScore = 0;

  for (const source of validSources) {
    const title = normalizeText(source.title || "");
    const snippet = normalizeText(source.snippet || "");
    const domain = normalizeText(getDomain(source.url));

    let score = 0;

    for (const word of competitorWords) {
      if (title.includes(word)) score += 5;
      if (domain.includes(word)) score += 6;
      if (snippet.includes(word)) score += 2;
    }

    if (
      title.includes("official") ||
      title.includes("website") ||
      title.includes("homepage")
    ) {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSource = source;
    }
  }

  return bestSource?.url || "";
}

function normalizeCompetitor(
  competitor: ResearchReport["competitors"][number],
  allSources: ResearchSource[]
) {
  const sources = findCompetitorSources(
    competitor.name,
    competitor.sources || [],
    allSources
  );

  const website = findCompetitorWebsite(
    competitor.name,
    competitor.website,
    sources
  );

  return {
    ...competitor,
    website,
    sources,
    pricingTiers: competitor.pricingTiers || [],
    keyFeatures: competitor.keyFeatures || [],
    targetUser:
      competitor.targetUser ||
      "Not found in available sources",
    pricingModel:
      competitor.pricingModel ||
      "Not found in available sources",
    fundingStatus:
      competitor.fundingStatus ||
      "Not found in available sources",
  };
}

export function normalizeReport(
  report: ResearchReport,
  sources: ResearchSource[],
  query: string
): ResearchReport {
  const normalizedCompetitors = (report.competitors || [])
    .slice(0, 15)
    .map((competitor) =>
      normalizeCompetitor(competitor, sources)
    );

  const validReportSources = (report.sources || [])
    .filter((source) => source?.url)
    .map((source) => {
      const matchingSource = sources.find(
        (availableSource) =>
          availableSource.url
            .replace(/\/$/, "")
            .toLowerCase() ===
          source.url
            .replace(/\/$/, "")
            .toLowerCase()
      );

      return matchingSource || null;
    })
    .filter(
      (source): source is ResearchSource =>
        source !== null
    );

  const competitorSources = normalizedCompetitors.flatMap(
    (competitor) => competitor.sources || []
  );

  const finalSources = mergeSources([
    validReportSources,
    competitorSources,
    sources,
  ]);

  return {
    ...report,
    query,
    competitors: normalizedCompetitors,
    marketGaps: (report.marketGaps || []).slice(0, 5),
    sources: finalSources.slice(0, 30),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const query = body?.query?.trim();

    const geographicMarket =
      body?.geographicMarket?.trim();

    const targetUser =
      body?.targetUser?.trim();

    /*
     * Required input validation.
     *
     * This must happen BEFORE calling Groq so that
     * an empty product returns HTTP 400 instead of
     * trying to call an external AI service.
     */
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          field: "query",
          error:
            "Product idea or industry is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Use Groq AI to validate the research topic.
     */
    let topicValidation;

    try {
      topicValidation = await validateResearchTopic(
        query
      );
    } catch (error) {
      console.error(
        "Research topic validation error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_SERVICE_ERROR",
          error:
            "Research topic validation is temporarily unavailable. Please try again later.",
        },
        { status: 502 }
      );
    }

    if (!topicValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          field: "query",
          error:
            topicValidation.reason ||
            "Invalid research topic format. Please enter a clear product, company, service, or industry.",
        },
        { status: 400 }
      );
    }

    /*
     * Geographic market is optional.
     * Validate it only when the user provides it.
     */
    if (geographicMarket) {
      let geographicValidation;

      try {
        geographicValidation =
          await validateGeographicMarket(
            geographicMarket
          );
      } catch (error) {
        console.error(
          "Geographic market validation error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            field: "geographicMarket",
            error:
              "Unable to validate the geographic market. Please try again.",
          },
          { status: 502 }
        );
      }

      if (!geographicValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            field: "geographicMarket",
            error:
              geographicValidation.reason ||
              "Please enter a meaningful geographic market.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Target user is optional.
     * Validate it only when the user provides it.
     */
    if (targetUser) {
      let targetUserValidation;

      try {
        targetUserValidation =
          await validateTargetUser(targetUser);
      } catch (error) {
        console.error(
          "Target user validation error:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            field: "targetUser",
            error:
              "Unable to validate the target user. Please try again.",
          },
          { status: 502 }
        );
      }

      if (!targetUserValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            field: "targetUser",
            error:
              targetUserValidation.reason ||
              "Please enter a meaningful target user.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Mock mode remains available for development/testing.
     * It is not exposed through the frontend.
     */
    if (process.env.RESEARCH_MODE === "mock") {
      return NextResponse.json({
        success: true,
        mode: "mock",
        report: {
          ...mockResearchReport,
          query,
        },
      });
    }

    /*
     * Generate purpose-specific search queries.
     *
     * Expected categories:
     * - competitors
     * - pricing
     * - features
     * - funding
     * - trends
     * - market gaps
     * - geographic market
     */
    let searchQueries: string[];

    try {
      searchQueries = await generateSearchQueries(
        query,
        geographicMarket,
        targetUser
      );
    } catch (error) {
      console.error(
        "Search query generation error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to retrieve web research. Please try again.",
        },
        { status: 502 }
      );
    }

    /*
     * Run up to 7 different searches simultaneously.
     */
    const limitedQueries = searchQueries.slice(0, 7);

    console.log(
      `Running ${limitedQueries.length} research searches in parallel`
    );

    let searchResults: ResearchSource[][];

    try {
      searchResults = await Promise.all(
        limitedQueries.map((searchQuery) =>
          webSearch(searchQuery)
        )
      );
    } catch (error) {
      console.error(
        "Web research service error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to retrieve web research. Please try again.",
        },
        { status: 502 }
      );
    }

    /*
     * Merge all search results.
     *
     * Multiple searches can return the same URL,
     * so mergeSources removes duplicate URLs.
     *
     * Maximum:
     * 7 searches × up to 10 results
     * = up to 70 raw results
     *
     * After deduplication:
     * maximum 30 sources.
     */
    const sources = mergeSources(
      searchResults
    ).slice(0, 30);

    console.log(
      `Merged research sources: ${sources.length}`
    );

    if (sources.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to retrieve web research. Please try again.",
        },
        { status: 502 }
      );
    }

    const researchQuery = [
      query,
      geographicMarket
        ? `Geographic market: ${geographicMarket}`
        : "",
      targetUser
        ? `Target user: ${targetUser}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    let report: ResearchReport;

    try {
      report = await generateResearchReport(
        researchQuery,
        sources
      );
    } catch (error) {
      console.error(
        "Research report generation error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to generate the report.",
        },
        { status: 502 }
      );
    }

    const normalizedReport = normalizeReport(
      report,
      sources,
      researchQuery
    );

    return NextResponse.json({
      success: true,
      mode: "real",
      report: normalizedReport,
      metadata: {
        sourcesAnalyzed: sources.length,
        searchQueries: limitedQueries.length,
        competitors:
          normalizedReport.competitors.length,
        competitorsWithWebsites:
          normalizedReport.competitors.filter(
            (competitor) => competitor.website
          ).length,
      },
    });
  } catch (error) {
    console.error(
      "Research API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process the research request.",
      },
      { status: 500 }
    );
  }
}