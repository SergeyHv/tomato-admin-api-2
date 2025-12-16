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

    const row = [
      body.id || "",
      body.name || "",
      body.description || "",
      body.mainphoto || "",
      body.color || "",
      body.type || "",
      body.size || "",
      body.season || "",
      body.gallery_photos || "",
      body.origin || "",
      body.taste || "",
      body.shape || "",
      body.version || "",
      body.isvisible || "",
      body.isnew || "",
      body.createdat || "",
      body.updatedat || "",
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${sheetName}'!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("add.cjs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

