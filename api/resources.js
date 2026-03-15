let resources = [
  { id: 1, title: "Investopedia", url: "https://investopedia.com", category: "Education" },
  { id: 2, title: "Yahoo Finance", url: "https://finance.yahoo.com", category: "News" }
];
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(resources);
  return res.status(405).json({ error: "Method not allowed" });
}
