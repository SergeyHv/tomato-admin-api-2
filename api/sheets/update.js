import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
    const sheetName = "_Tomato_Sait - Лист1";
    
    const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = req.body;

    // 1. Получаем все ID из колонки A, чтобы найти нужную строку
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:A`
    });

    const rows = getRes.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === String(id));

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Томат с таким ID не найден" });
    }

    // Номер строки (индекс + 1)
    const rowNumber = rowIndex + 1;

    // 2. Обновляем строку
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sheetName}'!A${rowNumber}:K${rowNumber}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version]]
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
