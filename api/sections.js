let sections = [
  { id: 1, name: "Stocks", description: "Individual stock investments" },
  { id: 2, name: "ETFs", description: "Exchange-traded funds" },
  { id: 3, name: "Crypto", description: "Cryptocurrency investments" }
];
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(sections);
  return res.status(405).json({ error: "Method not allowed" });
}
