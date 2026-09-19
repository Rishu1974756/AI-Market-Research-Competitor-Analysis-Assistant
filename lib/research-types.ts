export type ResearchSource = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain?: string;
};

export type PricingTier = {
  name: string;
  price: string;
  billingPeriod?: string;
  features: string[];
  sources: ResearchSource[];
};

export type Competitor = {
  name: string;
  website: string;
  description: string;
  targetUser: string;
  pricingModel: string;
  pricingTiers: PricingTier[];
  keyFeatures: string[];
  fundingStatus: string;
  founded?: string;
  sources: ResearchSource[];
};

export type CompetitorComparison = {
  feature: string;
  values: {
    competitor: string;
    value: string;
  }[];
};

export type MarketGap = {
  id: string;
  gap: string;
  description: string;
  whyMatters: string;
  whoNeeds: string;
  sources: ResearchSource[];
};

export type SWOTPoint = {
  text: string;
  sources: ResearchSource[];
};

export type SWOTAnalysis = {
  strengths: SWOTPoint[];
  weaknesses: SWOTPoint[];
  opportunities: SWOTPoint[];
  threats: SWOTPoint[];
};

export type MarketTrend = {
  title: string;
  summary: string;
  direction: "rising" | "stable" | "declining" | "emerging" | "unknown";
  sources: ResearchSource[];
};

export type PositioningPoint = {
  competitor: string;
  startingPrice: number | null;
  currency?: string;
  featureCount: number;
  sources: ResearchSource[];
};

export type MarketOverview = {
  industry: string;
  targetMarket: string;
  geographicMarket?: string;
  summary: string;
  trends: string[];
  trendAnalysis?: MarketTrend[];
  sources: ResearchSource[];
};

export type ResearchReport = {
  id?: string;
  userId?: string;
  query: string;
  title: string;
  marketOverview: MarketOverview;
  competitors: Competitor[];
  comparison: CompetitorComparison[];
  marketGaps: MarketGap[];
  swot: SWOTAnalysis;
  positioning?: PositioningPoint[];
  sources: ResearchSource[];
  createdAt?: string;
  updatedAt?: string;
};
