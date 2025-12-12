import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
    const range = "'_Tomato_Sait - Лист1'!A:K";

    const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = req.body;

    // Массив данных строго в порядке колонок A-K
    const values = [[
      id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
