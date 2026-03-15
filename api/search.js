export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const query = req.query.q || "";
  const results = [
    { type: "entry", title: "Result for " + query, id: 1 },
    { type: "book", title: "Book matching " + query, id: 2 }
  ];
  if (req.method === "GET") return res.status(200).json({ query, results });
  return res.status(405).json({ error: "Method not allowed" });
}
