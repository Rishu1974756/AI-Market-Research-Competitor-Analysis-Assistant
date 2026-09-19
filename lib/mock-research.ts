import type { ResearchReport } from "./research-types";

export const mockResearchReport: ResearchReport = {
  query: "AI project management tool for remote teams",

  title: "AI Project Management Tools for Remote Teams",

  marketOverview: {
    industry: "Project Management Software",
    targetMarket: "Remote teams and distributed organizations",
    geographicMarket: "Global",

    summary:
      "The project management software market includes platforms for task management, collaboration, workflow automation, reporting, and team communication. AI capabilities are increasingly being added to automate planning, summarize work, and assist teams with everyday project tasks.",

    trends: [
      "AI-assisted task and workflow automation",
      "Remote and distributed team collaboration",
      "Integrated communication and project management",
      "Automation of repetitive project management tasks",
    ],

    sources: [
      {
        id: "mock-source-1",
        title: "Asana",
        url: "https://asana.com",
        snippet:
          "Project and work management platform with features for teams and organizations.",
        domain: "asana.com",
      },
      {
        id: "mock-source-2",
        title: "monday.com",
        url: "https://monday.com",
        snippet:
          "Work management platform providing project planning and collaboration capabilities.",
        domain: "monday.com",
      },
    ],
  },

  competitors: [
    {
      name: "Asana",
      website: "https://asana.com",
      description:
        "Work management platform for planning, organizing, and tracking team projects.",
      targetUser: "Teams and organizations",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Task management",
        "Project planning",
        "Workflow automation",
        "Team collaboration",
      ],
      fundingStatus: "Public company",
      founded: "2008",
      sources: [
        {
          id: "asana-1",
          title: "Asana Official Website",
          url: "https://asana.com",
          snippet:
            "Asana provides work management tools for teams and organizations.",
          domain: "asana.com",
        },
      ],
    },

    {
      name: "monday.com",
      website: "https://monday.com",
      description:
        "Work management platform designed to help teams manage projects, workflows, and business processes.",
      targetUser: "Teams and businesses",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Project management",
        "Custom workflows",
        "Automation",
        "Dashboards",
      ],
      fundingStatus: "Public company",
      founded: "2012",
      sources: [
        {
          id: "monday-1",
          title: "monday.com Official Website",
          url: "https://monday.com",
          snippet:
            "monday.com provides work management and workflow solutions.",
          domain: "monday.com",
        },
      ],
    },

    {
      name: "ClickUp",
      website: "https://clickup.com",
      description:
        "All-in-one productivity and project management platform combining tasks, documents, goals, and collaboration.",
      targetUser: "Teams and organizations",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Task management",
        "Docs",
        "Goals",
        "AI features",
      ],
      fundingStatus: "Privately held",
      founded: "2017",
      sources: [
        {
          id: "clickup-1",
          title: "ClickUp Official Website",
          url: "https://clickup.com",
          snippet:
            "ClickUp combines project management, productivity, and collaboration features.",
          domain: "clickup.com",
        },
      ],
    },

    {
      name: "Trello",
      website: "https://trello.com",
      description:
        "Visual project management platform based around boards, lists, and cards.",
      targetUser: "Individuals and teams",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Kanban boards",
        "Task cards",
        "Automation",
        "Team collaboration",
      ],
      fundingStatus: "Owned by Atlassian",
      founded: "2011",
      sources: [
        {
          id: "trello-1",
          title: "Trello Official Website",
          url: "https://trello.com",
          snippet:
            "Trello provides boards and cards for organizing team projects and tasks.",
          domain: "trello.com",
        },
      ],
    },

    {
      name: "Jira",
      website: "https://www.atlassian.com/software/jira",
      description:
        "Project and issue tracking software widely used by software development teams.",
      targetUser: "Software development teams",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Issue tracking",
        "Agile planning",
        "Sprint management",
        "Reporting",
      ],
      fundingStatus: "Owned by Atlassian",
      founded: "2002",
      sources: [
        {
          id: "jira-1",
          title: "Jira Official Website",
          url: "https://www.atlassian.com/software/jira",
          snippet:
            "Jira provides project and issue tracking capabilities for development teams.",
          domain: "atlassian.com",
        },
      ],
    },

    {
      name: "Notion",
      website: "https://www.notion.so",
      description:
        "Workspace platform combining documents, knowledge management, databases, and project organization.",
      targetUser: "Individuals and teams",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Documents",
        "Databases",
        "Project tracking",
        "AI assistance",
      ],
      fundingStatus: "Privately held",
      founded: "2013",
      sources: [
        {
          id: "notion-1",
          title: "Notion Official Website",
          url: "https://www.notion.so",
          snippet:
            "Notion combines documents, databases, project organization, and collaboration.",
          domain: "notion.so",
        },
      ],
    },

    {
      name: "Basecamp",
      website: "https://basecamp.com",
      description:
        "Project management and team communication platform focused on simple project organization.",
      targetUser: "Small and medium-sized teams",
      pricingModel: "Paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Project organization",
        "Team communication",
        "To-do lists",
        "Schedules",
      ],
      fundingStatus: "Privately held",
      founded: "1999",
      sources: [
        {
          id: "basecamp-1",
          title: "Basecamp Official Website",
          url: "https://basecamp.com",
          snippet:
            "Basecamp provides project management and team communication tools.",
          domain: "basecamp.com",
        },
      ],
    },

    {
      name: "Wrike",
      website: "https://www.wrike.com",
      description:
        "Collaborative work management platform for teams managing projects and workflows.",
      targetUser: "Medium and large organizations",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Project management",
        "Workflow management",
        "Reporting",
        "Collaboration",
      ],
      fundingStatus: "Privately held",
      founded: "2006",
      sources: [
        {
          id: "wrike-1",
          title: "Wrike Official Website",
          url: "https://www.wrike.com",
          snippet:
            "Wrike provides collaborative work management and workflow tools.",
          domain: "wrike.com",
        },
      ],
    },

    {
      name: "Smartsheet",
      website: "https://www.smartsheet.com",
      description:
        "Enterprise work management platform using spreadsheet-style interfaces for projects and processes.",
      targetUser: "Organizations and enterprises",
      pricingModel: "Paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Project tracking",
        "Automation",
        "Dashboards",
        "Resource management",
      ],
      fundingStatus: "Public company",
      founded: "2005",
      sources: [
        {
          id: "smartsheet-1",
          title: "Smartsheet Official Website",
          url: "https://www.smartsheet.com",
          snippet:
            "Smartsheet provides work management and project tracking capabilities.",
          domain: "smartsheet.com",
        },
      ],
    },

    {
      name: "Linear",
      website: "https://linear.app",
      description:
        "Modern project and issue tracking platform focused on product and software development teams.",
      targetUser: "Product and engineering teams",
      pricingModel: "Free and paid plans",
      pricingTiers: [],
      keyFeatures: [
        "Issue tracking",
        "Project planning",
        "Roadmaps",
        "Developer workflows",
      ],
      fundingStatus: "Privately held",
      founded: "2019",
      sources: [
        {
          id: "linear-1",
          title: "Linear Official Website",
          url: "https://linear.app",
          snippet:
            "Linear provides issue tracking and project management tools for product development teams.",
          domain: "linear.app",
        },
      ],
    },
  ],

  comparison: [
    {
      feature: "AI Features",
      values: [
        { competitor: "Asana", value: "Yes" },
        { competitor: "monday.com", value: "Yes" },
        { competitor: "ClickUp", value: "Yes" },
        { competitor: "Trello", value: "Yes" },
        { competitor: "Jira", value: "Yes" },
        { competitor: "Notion", value: "Yes" },
        { competitor: "Basecamp", value: "Limited" },
        { competitor: "Wrike", value: "Yes" },
        { competitor: "Smartsheet", value: "Yes" },
        { competitor: "Linear", value: "Yes" },
      ],
    },
    {
      feature: "Remote Collaboration",
      values: [
        { competitor: "Asana", value: "Yes" },
        { competitor: "monday.com", value: "Yes" },
        { competitor: "ClickUp", value: "Yes" },
        { competitor: "Trello", value: "Yes" },
        { competitor: "Jira", value: "Yes" },
        { competitor: "Notion", value: "Yes" },
        { competitor: "Basecamp", value: "Yes" },
        { competitor: "Wrike", value: "Yes" },
        { competitor: "Smartsheet", value: "Yes" },
        { competitor: "Linear", value: "Yes" },
      ],
    },
    {
      feature: "Workflow Automation",
      values: [
        { competitor: "Asana", value: "Yes" },
        { competitor: "monday.com", value: "Yes" },
        { competitor: "ClickUp", value: "Yes" },
        { competitor: "Trello", value: "Yes" },
        { competitor: "Jira", value: "Yes" },
        { competitor: "Notion", value: "Yes" },
        { competitor: "Basecamp", value: "Limited" },
        { competitor: "Wrike", value: "Yes" },
        { competitor: "Smartsheet", value: "Yes" },
        { competitor: "Linear", value: "Limited" },
      ],
    },
  ],

  marketGaps: [
    {
      id: "gap-1",
      gap: "Simple AI project planning for non-technical teams",
      description:
        "Many project management platforms expose extensive configuration and workflow options.",
      whyMatters:
        "A simpler AI-first planning experience could reduce setup complexity for teams without dedicated project managers.",
      whoNeeds: "Small businesses and non-technical teams",
      sources: [
        {
          id: "gap-source-1",
          title: "Asana",
          url: "https://asana.com",
          snippet:
            "Asana provides extensive project and workflow management functionality.",
          domain: "asana.com",
        },
      ],
    },
    {
      id: "gap-2",
      gap: "Affordable AI capabilities for small teams",
      description:
        "AI capabilities are increasingly present across project management products, but pricing and plan availability vary.",
      whyMatters:
        "An affordable AI-first product could target smaller teams with limited software budgets.",
      whoNeeds: "Startups and small businesses",
      sources: [
        {
          id: "gap-source-2",
          title: "monday.com",
          url: "https://monday.com",
          snippet:
            "monday.com provides multiple work management plans and capabilities.",
          domain: "monday.com",
        },
      ],
    },
    {
      id: "gap-3",
      gap: "Offline-first project management",
      description:
        "Remote teams can experience unreliable connectivity when working while traveling or from locations with limited internet access.",
      whyMatters:
        "Offline-first workflows could allow teams to continue updating tasks and notes without continuous connectivity.",
      whoNeeds: "Distributed and mobile teams",
      sources: [
        {
          id: "gap-source-3",
          title: "Trello",
          url: "https://trello.com",
          snippet:
            "Trello provides visual project organization through boards and cards.",
          domain: "trello.com",
        },
      ],
    },
    {
      id: "gap-4",
      gap: "AI-generated project status reporting",
      description:
        "Teams spend time collecting updates and preparing project status summaries.",
      whyMatters:
        "Automatically generated status reports could reduce repetitive reporting work.",
      whoNeeds: "Project managers and team leads",
      sources: [
        {
          id: "gap-source-4",
          title: "ClickUp",
          url: "https://clickup.com",
          snippet:
            "ClickUp combines project management and AI-assisted productivity capabilities.",
          domain: "clickup.com",
        },
      ],
    },
    {
      id: "gap-5",
      gap: "Cross-platform project intelligence",
      description:
        "Remote organizations may use several communication and productivity tools simultaneously.",
      whyMatters:
        "An AI layer that combines project information across commonly used tools could reduce fragmented project context.",
      whoNeeds: "Distributed organizations using multiple SaaS tools",
      sources: [
        {
          id: "gap-source-5",
          title: "Notion",
          url: "https://www.notion.so",
          snippet:
            "Notion provides workspace, documentation, and collaboration capabilities.",
          domain: "notion.so",
        },
      ],
    },
  ],

  swot: {
    strengths: [
      {
        text: "An AI-first workflow could automate repetitive project planning and reporting tasks.",
        sources: [
          {
            id: "swot-s-1",
            title: "Asana",
            url: "https://asana.com",
            snippet:
              "Asana provides work management and automation capabilities.",
            domain: "asana.com",
          },
        ],
      },
      {
        text: "A focused experience for remote teams could provide a clearer product position.",
        sources: [
          {
            id: "swot-s-2",
            title: "monday.com",
            url: "https://monday.com",
            snippet:
              "monday.com provides collaboration and work management features.",
            domain: "monday.com",
          },
        ],
      },
    ],

    weaknesses: [
      {
        text: "A new product would have to compete with established platforms that already have existing users and integrations.",
        sources: [
          {
            id: "swot-w-1",
            title: "Jira",
            url: "https://www.atlassian.com/software/jira",
            snippet:
              "Jira is an established project and issue tracking platform.",
            domain: "atlassian.com",
          },
        ],
      },
      {
        text: "Building reliable AI-generated project insights requires high-quality project context.",
        sources: [
          {
            id: "swot-w-2",
            title: "Notion",
            url: "https://www.notion.so",
            snippet:
              "Notion combines workspace and knowledge-management capabilities.",
            domain: "notion.so",
          },
        ],
      },
    ],

    opportunities: [
      {
        text: "Growing adoption of AI-assisted productivity creates opportunities for AI-native project workflows.",
        sources: [
          {
            id: "swot-o-1",
            title: "ClickUp",
            url: "https://clickup.com",
            snippet:
              "ClickUp provides AI capabilities within its productivity platform.",
            domain: "clickup.com",
          },
        ],
      },
      {
        text: "Small and distributed teams could be targeted with simpler workflows and focused pricing.",
        sources: [
          {
            id: "swot-o-2",
            title: "Basecamp",
            url: "https://basecamp.com",
            snippet:
              "Basecamp provides project management and communication tools.",
            domain: "basecamp.com",
          },
        ],
      },
    ],

    threats: [
      {
        text: "Established competitors can continue adding AI capabilities to their existing products.",
        sources: [
          {
            id: "swot-t-1",
            title: "monday.com",
            url: "https://monday.com",
            snippet:
              "monday.com provides work management and automation capabilities.",
            domain: "monday.com",
          },
        ],
      },
      {
        text: "Strong existing ecosystems and integrations can make switching costs higher for customers.",
        sources: [
          {
            id: "swot-t-2",
            title: "Jira",
            url: "https://www.atlassian.com/software/jira",
            snippet:
              "Jira is part of the Atlassian product ecosystem.",
            domain: "atlassian.com",
          },
        ],
      },
    ],
  },

  sources: [
    {
      id: "source-1",
      title: "Asana",
      url: "https://asana.com",
      snippet: "Work management and project planning platform.",
      domain: "asana.com",
    },
    {
      id: "source-2",
      title: "monday.com",
      url: "https://monday.com",
      snippet: "Work management and workflow platform.",
      domain: "monday.com",
    },
    {
      id: "source-3",
      title: "ClickUp",
      url: "https://clickup.com",
      snippet: "Project management and productivity platform.",
      domain: "clickup.com",
    },
    {
      id: "source-4",
      title: "Trello",
      url: "https://trello.com",
      snippet: "Visual project management platform.",
      domain: "trello.com",
    },
    {
      id: "source-5",
      title: "Jira",
      url: "https://www.atlassian.com/software/jira",
      snippet: "Project and issue tracking software.",
      domain: "atlassian.com",
    },
    {
      id: "source-6",
      title: "Notion",
      url: "https://www.notion.so",
      snippet: "Workspace and collaboration platform.",
      domain: "notion.so",
    },
  ],
};

