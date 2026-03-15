let watchlist = [
  { id: 1, symbol: "AAPL", name: "Apple Inc.", price: 178.50 },
  { id: 2, symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80 }
];
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(watchlist);
  return res.status(405).json({ error: "Method not allowed" });
}
