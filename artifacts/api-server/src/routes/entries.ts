import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { entriesTable, sectionsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router: IRouter = Router();

async function getSectionBySlug(slug: string) {
  const sections = await db.select().from(sectionsTable).where(eq(sectionsTable.slug, slug)).limit(1);
  return sections[0] ?? null;
}

function enrichEntry(entry: typeof entriesTable.$inferSelect, section: typeof sectionsTable.$inferSelect | null) {
  return {
    ...entry,
    sectionSlug: section?.slug ?? "",
    sectionName: section?.name ?? "",
  };
}

router.get("/entries/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const entries = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.archived, false))
      .orderBy(desc(entriesTable.updatedAt))
      .limit(limit);

    res.json(entries.map((r) => enrichEntry(r.entries, r.sections)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recent entries" });
  }
});

router.get("/entries/starred", async (_req, res) => {
  try {
    const entries = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(and(eq(entriesTable.starred, true), eq(entriesTable.archived, false)))
      .orderBy(desc(entriesTable.updatedAt));

    res.json(entries.map((r) => enrichEntry(r.entries, r.sections)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch starred entries" });
  }
});

router.get("/entries", async (req, res) => {
  try {
    const { sectionSlug, archived, starred, tag } = req.query;

    if (!sectionSlug) {
      res.status(400).json({ error: "sectionSlug is required" });
      return;
    }

    const section = await getSectionBySlug(String(sectionSlug));
    if (!section) {
      res.json([]);
      return;
    }

    const conditions = [eq(entriesTable.sectionId, section.id)];

    if (archived !== undefined) {
      conditions.push(eq(entriesTable.archived, archived === "true"));
    } else {
      conditions.push(eq(entriesTable.archived, false));
    }

    if (starred === "true") {
      conditions.push(eq(entriesTable.starred, true));
    }

    let entries = await db
      .select()
      .from(entriesTable)
      .where(and(...conditions))
      .orderBy(desc(entriesTable.updatedAt));

    if (tag) {
      entries = entries.filter((e) => {
        const tags = e.tags as string[];
        return tags.includes(String(tag));
      });
    }

    res.json(entries.map((e) => enrichEntry(e, section)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

router.post("/entries", async (req, res) => {
  try {
    const { sectionSlug, title, content, tags, starred, metadata } = req.body;

    if (!sectionSlug || !title) {
      res.status(400).json({ error: "sectionSlug and title are required" });
      return;
    }

    let section = await getSectionBySlug(sectionSlug);

    if (!section) {
      const inserted = await db.insert(sectionsTable).values({
        name: sectionSlug,
        slug: sectionSlug,
        category: "Custom Sections",
        icon: "FileText",
        sortOrder: 999,
      }).returning();
      section = inserted[0];
    }

    const inserted = await db.insert(entriesTable).values({
      sectionId: section.id,
      title,
      content: content ?? null,
      tags: tags ?? [],
      starred: starred ?? false,
      archived: false,
      metadata: metadata ?? null,
    }).returning();

    res.status(201).json(enrichEntry(inserted[0], section));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.get("/entries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const results = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.id, id))
      .limit(1);

    if (!results[0]) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json(enrichEntry(results[0].entries, results[0].sections));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

router.put("/entries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, tags, starred, archived, metadata } = req.body;

    const updateData: Partial<typeof entriesTable.$inferInsert> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (starred !== undefined) updateData.starred = starred;
    if (archived !== undefined) updateData.archived = archived;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updated = await db.update(entriesTable).set(updateData).where(eq(entriesTable.id, id)).returning();

    if (!updated[0]) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const results = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.id, id))
      .limit(1);

    res.json(enrichEntry(results[0].entries, results[0].sections));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

router.delete("/entries/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(entriesTable).where(eq(entriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

router.patch("/entries/:id/star", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const entry = await db.select().from(entriesTable).where(eq(entriesTable.id, id)).limit(1);
    if (!entry[0]) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    const updated = await db.update(entriesTable)
      .set({ starred: !entry[0].starred, updatedAt: new Date() })
      .where(eq(entriesTable.id, id))
      .returning();

    const results = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.id, id))
      .limit(1);

    res.json(enrichEntry(results[0].entries, results[0].sections));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle star" });
  }
});

router.patch("/entries/:id/archive", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const entry = await db.select().from(entriesTable).where(eq(entriesTable.id, id)).limit(1);
    if (!entry[0]) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }
    await db.update(entriesTable)
      .set({ archived: !entry[0].archived, updatedAt: new Date() })
      .where(eq(entriesTable.id, id));

    const results = await db
      .select()
      .from(entriesTable)
      .innerJoin(sectionsTable, eq(entriesTable.sectionId, sectionsTable.id))
      .where(eq(entriesTable.id, id))
      .limit(1);

    res.json(enrichEntry(results[0].entries, results[0].sections));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle archive" });
  }
});

export default router;
