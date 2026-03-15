import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { entriesTable, sectionsTable, portfolioTable, watchlistTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.json([]);
      return;
    }

    const pattern = `%${q}%`;

    const entryResults = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(
        or(
          ilike(entriesTable.title, pattern),
          ilike(entriesTable.content, pattern)
        )
      )
      .limit(20);

    const portfolioResults = await db
      .select()
      .from(portfolioTable)
      .where(
        or(
          ilike(portfolioTable.ticker, pattern),
          ilike(portfolioTable.companyName, pattern)
        )
      )
      .limit(5);

    const watchlistResults = await db
      .select()
      .from(watchlistTable)
      .where(
        or(
          ilike(watchlistTable.ticker, pattern),
          ilike(watchlistTable.companyName, pattern)
        )
      )
      .limit(5);

    const results = [
      ...entryResults.map((r) => ({
        id: r.entries.id,
        sectionSlug: r.sections.slug,
        sectionName: r.sections.name,
        title: r.entries.title,
        excerpt: r.entries.content ? r.entries.content.slice(0, 150) : undefined,
        type: "entry" as const,
        createdAt: r.entries.createdAt.toISOString(),
      })),
      ...portfolioResults.map((r) => ({
        id: r.id,
        sectionSlug: "paper-portfolio",
        sectionName: "Paper Trading Portfolio",
        title: `${r.ticker} — ${r.companyName}`,
        excerpt: r.entryReason ?? undefined,
        type: "portfolio" as const,
        createdAt: r.createdAt.toISOString(),
      })),
      ...watchlistResults.map((r) => ({
        id: r.id,
        sectionSlug: "watchlist",
        sectionName: "S-Tier Stock Watchlist",
        title: `${r.ticker} — ${r.companyName}`,
        excerpt: r.reason ?? undefined,
        type: "watchlist" as const,
        createdAt: r.createdAt.toISOString(),
      })),
    ];

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
