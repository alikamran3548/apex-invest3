let tags = [
  { id: 1, name: "value-investing", color: "#3b82f6" },
  { id: 2, name: "growth", color: "#10b981" },
  { id: 3, name: "dividend", color: "#f59e0b" }
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(tags);
  return res.status(405).json({ error: "Method not allowed" });
}
