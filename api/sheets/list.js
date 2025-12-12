import { getSheetsClient } from "../_lib/googleClient.js";

export default async function handler(req, res) {
  // ✅ CORS — обязательно в самом начале
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Ответ на preflight-запрос
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const sheets = await getSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A:K"
    });

    const rows = response.data.values || [];
    const [header, ...data] = rows;

    const items = data.map((row) => {
      const obj = {};
      header.forEach((key, i) => {
        obj[key] = row[i] || "";
      });
      return obj;
    });

    res.status(200).json({ items });
  } catch (error) {
    console.error("LIST ERROR:", error);
    res.status(500).json({ error: "Failed to load data" });
  }
}
