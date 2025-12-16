const { getSheetsClient } = require("./googleClient.cjs");

module.exports = async (req, res) => {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, admin-key, Authorization");

  if (req.method === "OPTIONS") return res.status(200).send("ok");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = "_Tomato_Sait - Лист1";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) return res.status(200).json({ items: [] });

    const header = rows[0];
    const items = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const item = {};

      header.forEach((col, index) => {
        const key = col.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
        item[key] = row[index] || "";
      });

      items.push(item);
    }

    return res.status(200).json({ items });

  } catch (err) {
    console.error("list.cjs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
