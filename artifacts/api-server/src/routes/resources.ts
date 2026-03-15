import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/resources", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM resources ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

router.post("/resources", async (req, res) => {
  try {
    const { title, url, type, description, category, tags } = req.body;
    const tagsArray = Array.isArray(tags) ? tags : [];
    const result = await db.execute(sql`
      INSERT INTO resources (title, url, type, description, category, tags)
      VALUES (${title}, ${url}, ${type || 'article'}, ${description || null}, ${category || null}, ${tagsArray})
      RETURNING *
    `);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

router.put("/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, type, description, category, tags } = req.body;
    const tagsArray = Array.isArray(tags) ? tags : [];
    const result = await db.execute(sql`
      UPDATE resources SET
        title = ${title},
        url = ${url},
        type = ${type || 'article'},
        description = ${description || null},
        category = ${category || null},
        tags = ${tagsArray}
      WHERE id = ${Number(id)}
      RETURNING *
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

router.delete("/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(sql`DELETE FROM resources WHERE id = ${Number(id)}`);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
