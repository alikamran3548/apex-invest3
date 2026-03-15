import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { watchlistTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/watchlist", async (req, res) => {
  try {
    const { status, sector } = req.query;
    let items = await db.select().from(watchlistTable);
    if (status) items = items.filter((i) => i.status === String(status));
    if (sector) items = items.filter((i) => i.sector === String(sector));
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

router.post("/watchlist", async (req, res) => {
  try {
    const body = req.body;
    const inserted = await db.insert(watchlistTable).values({
      ticker: body.ticker,
      companyName: body.companyName,
      sector: body.sector ?? null,
      country: body.country ?? null,
      reason: body.reason ?? null,
      targetPrice: body.targetPrice ?? null,
      currentPrice: body.currentPrice ?? null,
      status: body.status ?? "Watching",
      notes: body.notes ?? null,
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

router.put("/watchlist/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const updateData: Partial<typeof watchlistTable.$inferInsert> = { updatedAt: new Date() };
    const fields = ["ticker", "companyName", "sector", "country", "reason", "targetPrice", "currentPrice", "status", "notes"] as const;
    for (const field of fields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field];
      }
    }
    const updated = await db.update(watchlistTable).set(updateData).where(eq(watchlistTable.id, id)).returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Watchlist item not found" });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update watchlist item" });
  }
});

router.delete("/watchlist/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete watchlist item" });
  }
});

export default router;
