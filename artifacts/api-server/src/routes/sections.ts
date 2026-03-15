import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sectionsTable, entriesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_SECTIONS = [
  // Category 1: Knowledge Base
  { name: "S-Tier Investment Niches by Country", slug: "s-tier-niches", category: "Knowledge Base", icon: "Globe", description: "Track S-tier investment niches organized by country", sortOrder: 1 },
  { name: "S-Tier Principles", slug: "s-tier-principles", category: "Knowledge Base", icon: "Star", description: "Core investment principles and their applications", sortOrder: 2 },
  { name: "S-Tier Mindset", slug: "s-tier-mindset", category: "Knowledge Base", icon: "Brain", description: "Mental frameworks and mindset concepts for investing", sortOrder: 3 },
  { name: "S-Tier Rules", slug: "s-tier-rules", category: "Knowledge Base", icon: "Shield", description: "Investment rules with violation tracker", sortOrder: 4 },
  { name: "S-Tier Realisations", slug: "s-tier-realisations", category: "Knowledge Base", icon: "Lightbulb", description: "Key realisations and their impact on your investing", sortOrder: 5 },
  { name: "S-Tier Noticed Stuff", slug: "s-tier-noticed", category: "Knowledge Base", icon: "Eye", description: "Market observations and patterns noticed", sortOrder: 6 },
  { name: "S-Tier Reality Things", slug: "s-tier-reality", category: "Knowledge Base", icon: "Target", description: "What really happens vs. common misconceptions", sortOrder: 7 },
  { name: "S-Tier Success Stories", slug: "s-tier-success", category: "Knowledge Base", icon: "TrendingUp", description: "Successful trades and what you did right", sortOrder: 8 },
  { name: "S-Tier Lessons from Failing", slug: "s-tier-lessons-failing", category: "Knowledge Base", icon: "AlertTriangle", description: "Failures, root causes, and lessons learned", sortOrder: 9 },
  { name: "S-Tier Summaries", slug: "s-tier-summaries", category: "Knowledge Base", icon: "BookOpen", description: "Summaries from books, videos, articles, podcasts", sortOrder: 10 },
  { name: "S-Tier Prompts", slug: "s-tier-prompts", category: "Knowledge Base", icon: "MessageSquare", description: "Research and analysis prompts with one-click copy", sortOrder: 11 },
  { name: "S-Tier Investors", slug: "s-tier-investors", category: "Knowledge Base", icon: "Users", description: "Learning from legendary investors", sortOrder: 12 },
  // Category 2: Opportunities & Analysis
  { name: "S-Tier Investment Opportunities", slug: "s-tier-opportunities", category: "Opportunities & Analysis", icon: "Zap", description: "Investment opportunities tracked through a kanban board", sortOrder: 13 },
  { name: "S-Tier Precedence of Filters", slug: "s-tier-filters", category: "Opportunities & Analysis", icon: "Filter", description: "Your investment filter hierarchy and funnel", sortOrder: 14 },
  { name: "S-Tier Market Analysis", slug: "s-tier-market-analysis", category: "Opportunities & Analysis", icon: "BarChart2", description: "Market analysis and economy correlations", sortOrder: 15 },
  { name: "S-Tier Why I Missed Opportunities", slug: "s-tier-missed-opportunities", category: "Opportunities & Analysis", icon: "XCircle", description: "Missed opportunities and cost of inaction analysis", sortOrder: 16 },
  { name: "S-Tier What Really Works", slug: "s-tier-what-works", category: "Opportunities & Analysis", icon: "CheckCircle", description: "Strategies and approaches with evidence and win rates", sortOrder: 17 },
  { name: "S-Tier Investing Ideas", slug: "s-tier-ideas", category: "Opportunities & Analysis", icon: "Sparkles", description: "Quick capture of investing ideas and theses", sortOrder: 18 },
  // Category 3: Stock-Specific
  { name: "S-Tier Stock Watchlist", slug: "watchlist", category: "Stock-Specific", icon: "List", description: "Stocks on your radar with target prices", sortOrder: 19 },
  { name: "S-Tier Favourites Not Buying", slug: "s-tier-favourites", category: "Stock-Specific", icon: "Heart", description: "Companies you love but won't buy right now", sortOrder: 20 },
  { name: "Company Advantages Analysis", slug: "company-advantages", category: "Stock-Specific", icon: "Award", description: "Competitive advantages and moat analysis", sortOrder: 21 },
  { name: "Company Disadvantages & Corrections", slug: "company-disadvantages", category: "Stock-Specific", icon: "AlertCircle", description: "Company weaknesses and what needs correcting", sortOrder: 22 },
  { name: "Company Secret Activities", slug: "company-secret-activities", category: "Stock-Specific", icon: "Lock", description: "Confidential activities and potential impacts", sortOrder: 23 },
  { name: "Sector Advantages", slug: "sector-advantages", category: "Stock-Specific", icon: "TrendingUp", description: "Sector-level tailwinds and structural advantages", sortOrder: 24 },
  { name: "Sector Disadvantages", slug: "sector-disadvantages", category: "Stock-Specific", icon: "TrendingDown", description: "Sector-level disadvantages and risks", sortOrder: 25 },
  { name: "Recommendations by Others", slug: "recommendations", category: "Stock-Specific", icon: "UserCheck", description: "Recommendations from others with trust rating", sortOrder: 25 },
  { name: "Quarterly Analysis Journal", slug: "quarterly-analysis", category: "Stock-Specific", icon: "Calendar", description: "Quarterly earnings analysis and observations", sortOrder: 26 },
  // Category 4: Investing Styles
  { name: "Value Investing", slug: "value-investing", category: "Investing Styles", icon: "DollarSign", description: "Value investing concepts, metrics, and lessons", sortOrder: 27 },
  { name: "Growth Investing", slug: "growth-investing", category: "Investing Styles", icon: "ArrowUpRight", description: "Growth investing strategies and learnings", sortOrder: 28 },
  { name: "Quality Investing", slug: "quality-investing", category: "Investing Styles", icon: "Diamond", description: "Quality investing, moats, and management assessment", sortOrder: 29 },
  { name: "Macro Investing", slug: "macro-investing", category: "Investing Styles", icon: "Globe2", description: "Macro trends, economic indicators, and correlations", sortOrder: 30 },
  { name: "Catalyst-Driven Investing", slug: "catalyst-investing", category: "Investing Styles", icon: "Flame", description: "Catalyst identification and event-driven strategies", sortOrder: 31 },
  // Category 5: Worst Cases
  { name: "Worst Investments / Cases", slug: "worst-investments", category: "Worst Cases & Anti-Patterns", icon: "Skull", description: "Worst trades and anti-patterns to remember forever", sortOrder: 32 },
  // Category 6: Personal System
  { name: "My Protocols", slug: "my-protocols", category: "Personal System", icon: "ClipboardList", description: "Step-by-step protocols with interactive checklists", sortOrder: 33 },
  { name: "My Rules", slug: "my-rules", category: "Personal System", icon: "BookMarked", description: "Your personal investment rules, non-negotiables highlighted", sortOrder: 34 },
  { name: "My Strategy", slug: "my-strategy", category: "Personal System", icon: "Map", description: "Your investment strategy with entry/exit criteria", sortOrder: 35 },
  { name: "Paper Trading Portfolio", slug: "paper-portfolio", category: "Personal System", icon: "PieChart", description: "Track paper trades with P&L calculations", sortOrder: 36 },
  { name: "Investing Notes", slug: "investing-notes", category: "Personal System", icon: "FileText", description: "General investing notes and catch-all section", sortOrder: 37 },
  // Category 7: Custom
  { name: "Custom Niche Sections", slug: "custom-sections", category: "Custom Sections", icon: "PlusCircle", description: "Your own custom investing sections", sortOrder: 38 },
];

router.get("/sections", async (_req, res) => {
  try {
    let sections = await db.select().from(sectionsTable).orderBy(sectionsTable.sortOrder);

    if (sections.length === 0) {
      await db.insert(sectionsTable).values(DEFAULT_SECTIONS);
      sections = await db.select().from(sectionsTable).orderBy(sectionsTable.sortOrder);
    }

    const entryCounts = await db
      .select({ sectionId: entriesTable.sectionId, count: count() })
      .from(entriesTable)
      .groupBy(entriesTable.sectionId);

    const countMap = new Map(entryCounts.map((e) => [e.sectionId, Number(e.count)]));

    const result = sections.map((s) => ({
      ...s,
      entryCount: countMap.get(s.id) ?? 0,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

export default router;
