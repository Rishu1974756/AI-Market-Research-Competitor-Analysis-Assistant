import { describe, expect, it } from "vitest";
import { validateResearchReport } from "@/lib/research-validation";

describe("Research report validation", () => {
  it("accepts a valid research report", () => {
    const report = {
      query: "Project management software",
      title: "Project Management Market Research",

      marketOverview: {
        industry: "Project Management Software",
        targetMarket: "Businesses and teams",
        summary: "The market contains several project management platforms.",
        trends: [],
        trendAnalysis: [],
        sources: [],
      },

      competitors: [
        {
          name: "Asana",
          website: "https://asana.com",
          description: "Project management platform for teams.",
          targetUser: "Businesses",
          pricingModel: "Freemium",
          pricingTiers: [],
          keyFeatures: ["Task management", "Team collaboration"],
          fundingStatus: "Public company",
          sources: [],
        },
      ],

      marketGaps: [
        {
          gap: "Affordable advanced project management",
          evidence: "Existing tools can be expensive for small teams.",
          opportunity: "Build an affordable solution.",
          sources: [],
        },
        {
          gap: "Simpler workflows",
          evidence: "Some platforms have complex interfaces.",
          opportunity: "Provide a simpler experience.",
          sources: [],
        },
        {
          gap: "Better small-team support",
          evidence: "Many tools target larger organizations.",
          opportunity: "Focus on small teams.",
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

      sources: [
        {
          id: "source-1",
          title: "Asana",
          url: "https://asana.com",
          snippet: "Project management platform.",
        },
      ],
    };

    const result = validateResearchReport(report);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a report without a title", () => {
    const report = {
      query: "Project management software",
      title: "",

      marketOverview: {
        industry: "Project Management Software",
        targetMarket: "Businesses and teams",
        summary: "The market contains several project management platforms.",
      },

      competitors: [
        {
          name: "Asana",
          description: "Project management platform for teams.",
          keyFeatures: ["Task management"],
          sources: [],
        },
      ],

      marketGaps: [
        {
          gap: "Affordable software",
          evidence: "Some tools are expensive.",
          opportunity: "Create affordable pricing.",
          sources: [],
        },
        {
          gap: "Simple workflows",
          evidence: "Some tools are complex.",
          opportunity: "Create simpler workflows.",
          sources: [],
        },
        {
          gap: "Small team support",
          evidence: "Some tools target enterprises.",
          opportunity: "Focus on small teams.",
          sources: [],
        },
      ],

      swot: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },

      sources: [
        {
          id: "source-1",
          title: "Asana",
          url: "https://asana.com",
          snippet: "Project management platform.",
        },
      ],
    };

    const result = validateResearchReport(report);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Report title is required.");
  });
});