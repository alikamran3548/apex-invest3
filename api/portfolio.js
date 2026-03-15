let portfolio = [
  { id: 1, name: "Tech Stocks", allocation: 40, value: 50000 },
  { id: 2, name: "Bonds", allocation: 30, value: 37500 }
];
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") {
    return res.status(200).json({
      items: portfolio,
      summary: { totalValue: 125000, itemCount: portfolio.length }
    });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
