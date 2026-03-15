import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { entriesTable, sectionsTable, portfolioTable } from "@workspace/db";
import { eq, desc, and, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res) => {
  try {
    let sections = await db.select().from(sectionsTable).orderBy(sectionsTable.sortOrder);

    const entryCounts = await db
      .select({ sectionId: entriesTable.sectionId, count: count() })
      .from(entriesTable)
      .where(eq(entriesTable.archived, false))
      .groupBy(entriesTable.sectionId);

    const countMap = new Map(entryCounts.map((e) => [e.sectionId, Number(e.count)]));

    const sectionCounts = sections.map((s) => ({
      slug: s.slug,
      name: s.name,
      count: countMap.get(s.id) ?? 0,
    }));

    const recentEntries = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.archived, false))
      .orderBy(desc(entriesTable.updatedAt))
      .limit(8);

    const starredEntries = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(and(eq(entriesTable.starred, true), eq(entriesTable.archived, false)))
      .orderBy(desc(entriesTable.updatedAt))
      .limit(6);

    const totalEntries = entryCounts.reduce((sum, e) => sum + Number(e.count), 0);

    // Portfolio summary
    const holdings = await db.select().from(portfolioTable).where(eq(portfolioTable.status, "holding"));
    let totalValue = 0;
    let totalCost = 0;
    for (const item of holdings) {
      totalCost += item.entryPrice * item.shares;
      totalValue += (item.currentPrice ?? item.entryPrice) * item.shares;
    }

    const portfolioSummary = {
      totalValue,
      totalCost,
      totalUnrealisedPnl: totalValue - totalCost,
      totalUnrealisedPnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      holdingCount: holdings.length,
      bestPerformer: null,
      worstPerformer: null,
    };

    res.json({
      sectionCounts,
      recentEntries: recentEntries.map((r) => ({
        ...r.entries,
        sectionSlug: r.sections.slug,
        sectionName: r.sections.name,
      })),
      starredEntries: starredEntries.map((r) => ({
        ...r.entries,
        sectionSlug: r.sections.slug,
        sectionName: r.sections.name,
      })),
      totalEntries,
      portfolioSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
