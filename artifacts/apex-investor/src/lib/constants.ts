import { 
  BookOpen, Target, LineChart, Briefcase, 
  AlertTriangle, ShieldCheck, Settings, Star,
  TrendingUp, Compass, Activity, Brain, 
  Lightbulb, AlertCircle, GraduationCap
} from "lucide-react";

export const APP_CATEGORIES = [
  {
    name: "Knowledge Base",
    icon: BookOpen,
    sections: [
      { slug: "s-tier-niches", name: "S-Tier Niches" },
      { slug: "s-tier-principles", name: "S-Tier Principles" },
      { slug: "s-tier-mindset", name: "S-Tier Mindset" },
      { slug: "s-tier-rules", name: "S-Tier Rules" },
      { slug: "s-tier-realisations", name: "S-Tier Realisations" },
      { slug: "s-tier-noticed", name: "S-Tier Noticed Stuff" },
      { slug: "s-tier-reality", name: "S-Tier Reality Things" },
      { slug: "s-tier-success", name: "S-Tier Success Stories" },
      { slug: "s-tier-lessons-failing", name: "S-Tier Lessons (Failing)" },
      { slug: "s-tier-summaries", name: "S-Tier Summaries" },
      { slug: "s-tier-prompts", name: "S-Tier Prompts" },
      { slug: "s-tier-investors", name: "S-Tier Investors" }
    ]
  },
  {
    name: "Opportunities & Analysis",
    icon: Target,
    sections: [
      { slug: "s-tier-opportunities", name: "Investment Opportunities" },
      { slug: "s-tier-filters", name: "Precedence of Filters" },
      { slug: "s-tier-market-analysis", name: "Market Analysis" },
      { slug: "s-tier-missed-opportunities", name: "Missed Opportunities" },
      { slug: "s-tier-what-works", name: "What Really Works" },
      { slug: "s-tier-ideas", name: "Investing Ideas" }
    ]
  },
  {
    name: "Stock-Specific",
    icon: LineChart,
    sections: [
      { slug: "watchlist", name: "Stock Watchlist", customRoute: "/watchlist" },
      { slug: "s-tier-favourites", name: "Favourites (Not Buying)" },
      { slug: "company-advantages", name: "Company Advantages" },
      { slug: "company-disadvantages", name: "Company Disadvantages" },
      { slug: "company-secret-activities", name: "Secret Activities" },
      { slug: "sector-advantages", name: "Sector Advantages" },
      { slug: "sector-disadvantages", name: "Sector Disadvantages" },
      { slug: "recommendations", name: "Recommendations" },
      { slug: "quarterly-analysis", name: "Quarterly Analysis" }
    ]
  },
  {
    name: "Investing Styles",
    icon: Briefcase,
    sections: [
      { slug: "value-investing", name: "Value Investing" },
      { slug: "growth-investing", name: "Growth Investing" },
      { slug: "quality-investing", name: "Quality Investing" },
      { slug: "macro-investing", name: "Macro Investing" },
      { slug: "catalyst-investing", name: "Catalyst-Driven Investing" }
    ]
  },
  {
    name: "Worst Cases",
    icon: AlertTriangle,
    sections: [
      { slug: "worst-investments", name: "Worst Investments" }
    ]
  },
  {
    name: "Personal System",
    icon: ShieldCheck,
    sections: [
      { slug: "my-protocols", name: "My Protocols" },
      { slug: "my-rules", name: "My Rules" },
      { slug: "my-strategy", name: "My Strategy" },
      { slug: "paper-portfolio", name: "Paper Portfolio", customRoute: "/portfolio" },
      { slug: "investing-notes", name: "Investing Notes" }
    ]
  },
  {
    name: "Custom Sections",
    icon: Settings,
    sections: [
      { slug: "custom-sections", name: "Custom Niche Sections" }
    ]
  },
  {
    name: "Learning & Planning",
    icon: GraduationCap,
    sections: [
      { slug: "books", name: "Books Library", customRoute: "/books" },
      { slug: "resources", name: "Courses & Resources", customRoute: "/resources" },
      { slug: "roadmap", name: "Roadmap", customRoute: "/roadmap" },
      { slug: "investor-wisdom", name: "Investor Wisdom", customRoute: "/investors" },
    ]
  }
];

export const ALL_SECTIONS = APP_CATEGORIES.flatMap(c => c.sections);
