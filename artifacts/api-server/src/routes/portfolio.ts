import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portfolioTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function calcPnl(item: typeof portfolioTable.$inferSelect) {
  if (item.currentPrice !== null && item.currentPrice !== undefined) {
    const cost = item.entryPrice * item.shares;
    const current = item.currentPrice * item.shares;
    const pnl = current - cost;
    const pnlPercent = (pnl / cost) * 100;
    return { unrealisedPnl: pnl, unrealisedPnlPercent: pnlPercent };
  }
  return { unrealisedPnl: null, unrealisedPnlPercent: null };
}

function enrichPortfolioItem(item: typeof portfolioTable.$inferSelect) {
  return { ...item, ...calcPnl(item) };
}

router.get("/portfolio/summary", async (_req, res) => {
  try {
    const items = await db.select().from(portfolioTable).where(eq(portfolioTable.status, "holding"));

    let totalValue = 0;
    let totalCost = 0;
    let bestPnl = -Infinity;
    let worstPnl = Infinity;
    let bestTicker: string | null = null;
    let worstTicker: string | null = null;

    for (const item of items) {
      const cost = item.entryPrice * item.shares;
      totalCost += cost;
      const currentVal = (item.currentPrice ?? item.entryPrice) * item.shares;
      totalValue += currentVal;
      const pnlPct = ((currentVal - cost) / cost) * 100;
      if (pnlPct > bestPnl) { bestPnl = pnlPct; bestTicker = item.ticker; }
      if (pnlPct < worstPnl) { worstPnl = pnlPct; worstTicker = item.ticker; }
    }

    res.json({
      totalValue,
      totalCost,
      totalUnrealisedPnl: totalValue - totalCost,
      totalUnrealisedPnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      holdingCount: items.length,
      bestPerformer: bestTicker,
      worstPerformer: worstTicker,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio summary" });
  }
});

router.get("/portfolio", async (req, res) => {
  try {
    const { status } = req.query;
    let items;
    if (status) {
      items = await db.select().from(portfolioTable).where(eq(portfolioTable.status, String(status)));
    } else {
      items = await db.select().from(portfolioTable);
    }
    res.json(items.map(enrichPortfolioItem));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

router.post("/portfolio", async (req, res) => {
  try {
    const body = req.body;
    const inserted = await db.insert(portfolioTable).values({
      ticker: body.ticker,
      companyName: body.companyName,
      entryPrice: body.entryPrice,
      currentPrice: body.currentPrice ?? null,
      shares: body.shares,
      entryDate: body.entryDate ?? null,
      status: body.status ?? "holding",
      entryReason: body.entryReason ?? null,
      holdingReason: body.holdingReason ?? null,
      sellReason: body.sellReason ?? null,
      sector: body.sector ?? null,
      country: body.country ?? null,
      notes: body.notes ?? null,
    }).returning();
    res.status(201).json(enrichPortfolioItem(inserted[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create portfolio item" });
  }
});

router.put("/portfolio/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const updateData: Partial<typeof portfolioTable.$inferInsert> = { updatedAt: new Date() };
    const fields = ["ticker", "companyName", "entryPrice", "currentPrice", "shares", "entryDate", "exitDate", "exitPrice", "status", "entryReason", "holdingReason", "sellReason", "sector", "country", "notes"] as const;
    for (const field of fields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }
    const updated = await db.update(portfolioTable).set(updateData).where(eq(portfolioTable.id, id)).returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Portfolio item not found" });
      return;
    }
    res.json(enrichPortfolioItem(updated[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update portfolio item" });
  }
});

router.delete("/portfolio/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(portfolioTable).where(eq(portfolioTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete portfolio item" });
  }
});

export default router;
