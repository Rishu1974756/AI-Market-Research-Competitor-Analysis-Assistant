import type { ResearchReport, ResearchSource } from "@/lib/research-types";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidSource(source: unknown): source is ResearchSource {
  if (!source || typeof source !== "object") {
    return false;
  }

  const item = source as Partial<ResearchSource>;

  try {
    const url = new URL(item.url || "");

    return (
      isNonEmptyString(item.id) &&
      isNonEmptyString(item.title) &&
      isNonEmptyString(item.snippet) &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  } catch {
    return false;
  }
}

export function validateResearchReport(
  report: unknown
): ValidationResult {
  const errors: string[] = [];

  if (!report || typeof report !== "object") {
    return {
      valid: false,
      errors: ["Report must be an object."],
    };
  }

  const value = report as Partial<ResearchReport>;

  if (!isNonEmptyString(value.query)) {
    errors.push("Report query is required.");
  }

  if (!isNonEmptyString(value.title)) {
    errors.push("Report title is required.");
  }

  if (
    !value.marketOverview ||
    typeof value.marketOverview !== "object"
  ) {
    errors.push("Market overview is required.");
  } else {
    const overview = value.marketOverview;

    if (!isNonEmptyString(overview.industry)) {
      errors.push("Market overview industry is required.");
    }

    if (!isNonEmptyString(overview.targetMarket)) {
      errors.push("Market overview target market is required.");
    }

    if (!isNonEmptyString(overview.summary)) {
      errors.push("Market overview summary is required.");
    }
  }

  if (!Array.isArray(value.competitors)) {
    errors.push("Competitors must be an array.");
  } else {
    if (value.competitors.length < 1) {
      errors.push("At least one competitor is required.");
    }

    if (value.competitors.length > 15) {
      errors.push(
        "A report cannot contain more than 15 competitors."
      );
    }

    value.competitors.forEach((competitor, index) => {
      if (!isNonEmptyString(competitor.name)) {
        errors.push(
          `Competitor ${index + 1} name is required.`
        );
      }

      if (!isNonEmptyString(competitor.description)) {
        errors.push(
          `Competitor ${index + 1} description is required.`
        );
      }

      if (!Array.isArray(competitor.keyFeatures)) {
        errors.push(
          `Competitor ${index + 1} keyFeatures must be an array.`
        );
      }

      if (!Array.isArray(competitor.sources)) {
        errors.push(
          `Competitor ${index + 1} sources must be an array.`
        );
      }
    });
  }

  if (!Array.isArray(value.marketGaps)) {
    errors.push("Market gaps must be an array.");
  } else {
    if (value.marketGaps.length < 3) {
      errors.push("At least 3 market gaps are required.");
    }

    if (value.marketGaps.length > 5) {
      errors.push(
        "A report cannot contain more than 5 market gaps."
      );
    }
  }

  if (!value.swot || typeof value.swot !== "object") {
    errors.push("SWOT analysis is required.");
  } else {
    const categories = [
      "strengths",
      "weaknesses",
      "opportunities",
      "threats",
    ] as const;

    for (const category of categories) {
      if (!Array.isArray(value.swot[category])) {
        errors.push(
          `SWOT ${category} must be an array.`
        );
      }
    }
  }

  if (!Array.isArray(value.sources)) {
    errors.push("Report sources must be an array.");
  } else {
    if (value.sources.length === 0) {
      errors.push("At least one report source is required.");
    }

    value.sources.forEach((source, index) => {
      if (!isValidSource(source)) {
        errors.push(
          `Report source ${index + 1} is invalid.`
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}