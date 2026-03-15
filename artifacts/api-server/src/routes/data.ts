import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { sectionsTable, entriesTable } from "@workspace/db";

const router: IRouter = Router();

// ─── EXPORT ─────────────────────────────────────────────────────────────────
router.get("/data/export", async (_req, res) => {
  try {
    const [entries, portfolio, watchlist, books, resources, roadmap, investors] = await Promise.all([
      db.execute(sql`SELECT * FROM entries ORDER BY id`),
      db.execute(sql`SELECT * FROM portfolio ORDER BY id`),
      db.execute(sql`SELECT * FROM watchlist ORDER BY id`),
      db.execute(sql`SELECT * FROM books ORDER BY id`),
      db.execute(sql`SELECT * FROM resources ORDER BY id`),
      db.execute(sql`SELECT * FROM roadmap_pdfs ORDER BY id`),
      db.execute(sql`SELECT * FROM investors ORDER BY id`),
    ]);

    const payload = {
      version: "1.0",
      app: "APEX Investor",
      exported_at: new Date().toISOString(),
      data: {
        entries: entries.rows,
        portfolio: portfolio.rows,
        watchlist: watchlist.rows,
        books: books.rows,
        resources: resources.rows,
        roadmap: roadmap.rows,
        investors: investors.rows,
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="apex-investor-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
});

// ─── IMPORT ─────────────────────────────────────────────────────────────────
router.post("/data/import", async (req, res) => {
  const { data, mode = "append" } = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ error: "Invalid import file" });
  }

  const results: Record<string, number> = {};

  try {
    // If replace mode, clear everything first
    if (mode === "replace") {
      await db.execute(sql`TRUNCATE TABLE entries, portfolio, watchlist, books, resources, roadmap_pdfs, investors RESTART IDENTITY CASCADE`);
    }

    // Import entries
    if (Array.isArray(data.entries) && data.entries.length > 0) {
      let count = 0;
      for (const e of data.entries) {
        try {
          // Get or create section by slug
          let sectionRows = await db.execute(sql`SELECT id FROM sections WHERE slug = ${e.section_slug || ''} LIMIT 1`);
          const sectionId = (sectionRows.rows[0] as any)?.id;
          if (!sectionId) continue;

          await db.execute(sql`
            INSERT INTO entries (section_id, section_slug, title, content, tags, starred, archived, created_at, updated_at)
            VALUES (${sectionId}, ${e.section_slug || null}, ${e.title || 'Untitled'}, ${e.content || null},
                    ${JSON.stringify(e.tags || [])}, ${e.starred ?? false}, ${e.archived ?? false},
                    ${e.created_at || new Date().toISOString()}, ${e.updated_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.entries = count;
    }

    // Import portfolio
    if (Array.isArray(data.portfolio) && data.portfolio.length > 0) {
      let count = 0;
      for (const p of data.portfolio) {
        try {
          await db.execute(sql`
            INSERT INTO portfolio (ticker, company_name, entry_price, current_price, shares, entry_date, status, entry_reason, holding_reason, sell_reason, sector, country, notes, created_at)
            VALUES (${p.ticker}, ${p.company_name || p.companyName || ''}, ${p.entry_price || p.entryPrice || 0},
                    ${p.current_price || p.currentPrice || null}, ${p.shares || 0}, ${p.entry_date || p.entryDate || null},
                    ${p.status || 'holding'}, ${p.entry_reason || p.entryReason || null}, ${p.holding_reason || p.holdingReason || null},
                    ${p.sell_reason || p.sellReason || null}, ${p.sector || null}, ${p.country || null},
                    ${p.notes || null}, ${p.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.portfolio = count;
    }

    // Import watchlist
    if (Array.isArray(data.watchlist) && data.watchlist.length > 0) {
      let count = 0;
      for (const w of data.watchlist) {
        try {
          await db.execute(sql`
            INSERT INTO watchlist (ticker, company_name, current_price, target_price, notes, created_at)
            VALUES (${w.ticker}, ${w.company_name || w.companyName || null}, ${w.current_price || w.currentPrice || null},
                    ${w.target_price || w.targetPrice || null}, ${w.notes || null}, ${w.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.watchlist = count;
    }

    // Import books
    if (Array.isArray(data.books) && data.books.length > 0) {
      let count = 0;
      for (const b of data.books) {
        try {
          await db.execute(sql`
            INSERT INTO books (title, author, category, status, rating, notes, url, cover_url, created_at)
            VALUES (${b.title}, ${b.author || null}, ${b.category || 'General'}, ${b.status || 'to-read'},
                    ${b.rating || null}, ${b.notes || null}, ${b.url || null}, ${b.cover_url || null},
                    ${b.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.books = count;
    }

    // Import resources
    if (Array.isArray(data.resources) && data.resources.length > 0) {
      let count = 0;
      for (const r of data.resources) {
        try {
          await db.execute(sql`
            INSERT INTO resources (title, url, type, description, category, tags, created_at)
            VALUES (${r.title}, ${r.url}, ${r.type || 'article'}, ${r.description || null},
                    ${r.category || null}, ${JSON.stringify(r.tags || [])}, ${r.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.resources = count;
    }

    // Import roadmap (with PDF data)
    if (Array.isArray(data.roadmap) && data.roadmap.length > 0) {
      let count = 0;
      for (const r of data.roadmap) {
        try {
          await db.execute(sql`
            INSERT INTO roadmap_pdfs (title, description, pdf_name, pdf_data, pdf_size, created_at)
            VALUES (${r.title}, ${r.description || null}, ${r.pdf_name || null}, ${r.pdf_data || null},
                    ${r.pdf_size || null}, ${r.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.roadmap = count;
    }

    // Import investors
    if (Array.isArray(data.investors) && data.investors.length > 0) {
      let count = 0;
      for (const inv of data.investors) {
        try {
          await db.execute(sql`
            INSERT INTO investors (name, known_for, style, key_lessons, books, quotes, notes, website_url, photo_url, created_at)
            VALUES (${inv.name}, ${inv.known_for || null}, ${inv.style || null}, ${inv.key_lessons || null},
                    ${inv.books || null}, ${inv.quotes || null}, ${inv.notes || null}, ${inv.website_url || null},
                    ${inv.photo_url || null}, ${inv.created_at || new Date().toISOString()})
            ON CONFLICT DO NOTHING
          `);
          count++;
        } catch {}
      }
      results.investors = count;
    }

    res.json({ success: true, imported: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Import failed", details: String(err) });
  }
});

export default router;
