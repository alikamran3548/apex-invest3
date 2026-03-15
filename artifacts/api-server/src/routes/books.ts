import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/books", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT * FROM books ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

router.post("/books", async (req, res) => {
  try {
    const { title, author, category, status, rating, notes, url, cover_url } = req.body;
    const result = await db.execute(sql`
      INSERT INTO books (title, author, category, status, rating, notes, url, cover_url)
      VALUES (${title}, ${author || null}, ${category || 'General'}, ${status || 'to-read'}, ${rating || null}, ${notes || null}, ${url || null}, ${cover_url || null})
      RETURNING *
    `);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create book" });
  }
});

router.put("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, status, rating, notes, url, cover_url } = req.body;
    const result = await db.execute(sql`
      UPDATE books SET
        title = ${title},
        author = ${author || null},
        category = ${category || 'General'},
        status = ${status || 'to-read'},
        rating = ${rating || null},
        notes = ${notes || null},
        url = ${url || null},
        cover_url = ${cover_url || null}
      WHERE id = ${Number(id)}
      RETURNING *
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update book" });
  }
});

router.delete("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(sql`DELETE FROM books WHERE id = ${Number(id)}`);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

export default router;
