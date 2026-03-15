let books = [
  { id: 1, title: "The Intelligent Investor", author: "Benjamin Graham", status: "completed" },
  { id: 2, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", status: "reading" }
];
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") return res.status(200).json(books);
  return res.status(405).json({ error: "Method not allowed" });
}
