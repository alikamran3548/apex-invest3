import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tags", async (_req, res) => {
  try {
    const tags = await db.select().from(tagsTable).orderBy(tagsTable.name);
    res.json(tags);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

router.post("/tags", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const inserted = await db.insert(tagsTable).values({ name, color: color ?? "#6b7280" }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tag" });
  }
});

router.delete("/tags/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(tagsTable).where(eq(tagsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete tag" });
  }
});

export default router;
