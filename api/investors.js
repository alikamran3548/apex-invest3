let investors = [
  { id: 1, name: "Warren Buffett", strategy: "Value Investing" },
  { id: 2, name: "Ray Dalio", strategy: "All Weather Portfolio" }
];

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(investors);
  return res.status(405).json({ error: "Method not allowed" });
}
