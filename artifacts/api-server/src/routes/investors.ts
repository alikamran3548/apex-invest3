import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/investors", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM investors ORDER BY name ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch investors" });
  }
});

router.post("/investors", async (req, res) => {
  try {
    const { name, known_for, style, key_lessons, books, quotes, notes, website_url, photo_url } = req.body;
    const result = await db.execute(sql`
      INSERT INTO investors (name, known_for, style, key_lessons, books, quotes, notes, website_url, photo_url)
      VALUES (${name}, ${known_for || null}, ${style || null}, ${key_lessons || null}, ${books || null}, ${quotes || null}, ${notes || null}, ${website_url || null}, ${photo_url || null})
      RETURNING *
    `);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create investor" });
  }
});

router.put("/investors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, known_for, style, key_lessons, books, quotes, notes, website_url, photo_url } = req.body;
    const result = await db.execute(sql`
      UPDATE investors SET
        name = ${name},
        known_for = ${known_for || null},
        style = ${style || null},
        key_lessons = ${key_lessons || null},
        books = ${books || null},
        quotes = ${quotes || null},
        notes = ${notes || null},
        website_url = ${website_url || null},
        photo_url = ${photo_url || null}
      WHERE id = ${Number(id)}
      RETURNING *
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update investor" });
  }
});

router.delete("/investors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(sql`DELETE FROM investors WHERE id = ${Number(id)}`);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete investor" });
  }
});

export default router;
