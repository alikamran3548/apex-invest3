export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    totalEntries: 10,
    totalInvestors: 5,
    totalBooks: 8,
    sectionCounts: [
      { name: "Stocks", count: 15 },
      { name: "Crypto", count: 8 },
      { name: "Real Estate", count: 3 }
    ]
  });
}
