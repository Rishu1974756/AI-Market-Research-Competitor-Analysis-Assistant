import { describe, expect, it } from "vitest";
import { normalizeReport } from "@/app/api/research/route";
import type {
  ResearchReport,
  ResearchSource,
} from "@/lib/research-types";

describe("Research report normalization", () => {
  it("normalizes competitors and keeps only supported sources", () => {
    const sources: ResearchSource[] = [
      {
        id: "source-1",
        title: "Asana Official Website",
        url: "https://asana.com",
        snippet: "Project management software for teams.",
      },
      {
        id: "source-2",
        title: "ClickUp",
        url: "https://clickup.com",
        snippet: "Project management and productivity platform.",
      },
    ];

    const report = {
      query: "old query",
      title: "Project Management Market Research",

      marketOverview: {
        industry: "Project Management Software",
        targetMarket: "Businesses",
        summary: "Market overview.",
        trends: [],
        trendAnalysis: [],
        sources: [],
      },

      competitors: [
        {
          name: "Asana",
          website: "Not found in available sources",
          description: "Project management platform.",
          targetUser: "",
          pricingModel: "",
          pricingTiers: [],
          keyFeatures: [],
          fundingStatus: "",
          sources: [sources[0]],
        },
      ],

      marketGaps: [
        {
          gap: "Affordable tools",
          evidence: "Some tools are expensive.",
          opportunity: "Offer affordable pricing.",
          sources: [],
        },
      ],

      swot: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },

      positioning: [],

      sources: [sources[0]],
    } as unknown as ResearchReport;

    const result = normalizeReport(
      report,
      sources,
      "Project management software"
    );

    expect(result.query).toBe("Project management software");
    expect(result.competitors).toHaveLength(1);

    expect(result.competitors[0].name).toBe("Asana");

    expect(result.competitors[0].website).toBe(
      "https://asana.com"
    );

    expect(result.competitors[0].targetUser).toBe(
      "Not found in available sources"
    );

    expect(result.competitors[0].pricingModel).toBe(
      "Not found in available sources"
    );

    expect(result.competitors[0].fundingStatus).toBe(
      "Not found in available sources"
    );

    expect(result.competitors[0].sources).toHaveLength(1);

    expect(result.sources).toHaveLength(2);
  });

  it("limits competitors to 15", () => {
    const sources: ResearchSource[] = [
      {
        id: "source-1",
        title: "Example Source",
        url: "https://example.com",
        snippet: "Example source.",
      },
    ];

    const competitors = Array.from(
      { length: 20 },
      (_, index) => ({
        name: `Competitor ${index + 1}`,
        website: "",
        description: "Competitor description.",
        targetUser: "Businesses",
        pricingModel: "Subscription",
        pricingTiers: [],
        keyFeatures: ["Feature"],
        fundingStatus: "Unknown",
        sources: [],
      })
    );

    const report = {
      query: "test",
      title: "Test Report",

      marketOverview: {
        industry: "Test Industry",
        targetMarket: "Businesses",
        summary: "Test summary.",
        trends: [],
        trendAnalysis: [],
        sources: [],
      },

      competitors,

      marketGaps: [],

      swot: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },

      positioning: [],

      sources: [],
    } as unknown as ResearchReport;

    const result = normalizeReport(
      report,
      sources,
      "test query"
    );

    expect(result.competitors).toHaveLength(15);
  });
});