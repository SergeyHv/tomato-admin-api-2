const { getSheetsClient } = require("./googleClient.cjs");

module.exports = async (req, res) => {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, admin-key, Authorization");

  if (req.method === "OPTIONS") return res.status(200).send("ok");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (req.headers["admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Invalid admin key" });
  }

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = "_Tomato_Sait - Лист1";

    const body = req.body;
    const id = String(body.id);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
    });

    const rows = response.data.values;
    const header = rows[0];

    const rowIndex = rows.findIndex(r => r[0] === id);
    if (rowIndex === -1) return res.status(404).json({ error: "Not found" });

    const updatedRow = header.map(col => {
      const key = col.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9_]/g, "");
      return body[key] || "";
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A${rowIndex + 1}:Z${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [updatedRow] },
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("update.cjs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
