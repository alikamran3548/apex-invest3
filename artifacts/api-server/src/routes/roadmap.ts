import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/roadmap", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, title, description, pdf_name, pdf_size, created_at FROM roadmap_pdfs ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch roadmap" });
  }
});

// Serve PDF binary
router.get("/roadmap/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.execute(sql`SELECT pdf_data, pdf_name FROM roadmap_pdfs WHERE id = ${Number(id)}`);
    const row = result.rows[0] as any;
    if (!row || !row.pdf_data) return res.status(404).json({ error: "Not found" });

    const buffer = Buffer.from(row.pdf_data, "base64");
    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `inline; filename="${row.pdf_name || 'document.pdf'}"`);
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to serve PDF" });
  }
});

router.post("/roadmap", async (req, res) => {
  try {
    const { title, description, pdf_name, pdf_data, pdf_size } = req.body;
    const result = await db.execute(sql`
      INSERT INTO roadmap_pdfs (title, description, pdf_name, pdf_data, pdf_size)
      VALUES (${title}, ${description || null}, ${pdf_name || null}, ${pdf_data || null}, ${pdf_size || null})
      RETURNING id, title, description, pdf_name, pdf_size, created_at
    `);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create roadmap item" });
  }
});

router.delete("/roadmap/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(sql`DELETE FROM roadmap_pdfs WHERE id = ${Number(id)}`);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete roadmap item" });
  }
});

export default router;
