let entries = [
  { id: 1, title: "Investment Note 1", content: "Sample content", createdAt: "2024-01-15" },
  { id: 2, title: "Investment Note 2", content: "More content", createdAt: "2024-01-16" }
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json(entries);
  if (req.method === "POST") {
    const entry = { id: entries.length + 1, ...req.body, createdAt: new Date().toISOString() };
    entries.push(entry);
    return res.status(201).json(entry);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
