import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
    const { id, ...updatedData } = req.body;

    // 1. Сначала найдем строку с нужным ID
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Лист1!A:A" });
    const rows = response.data.values;
    const rowIndex = rows.findIndex(row => row[0] === String(id));

    if (rowIndex === -1) return res.status(404).json({ message: "Томат не найден" });

    // 2. Подготовим данные (важен порядок колонок A-K)
    const newRow = [
      id, updatedData.name, updatedData.description, updatedData.mainphoto,
      updatedData.color, updatedData.type, updatedData.size, updatedData.season,
      updatedData.gallery_photos, updatedData.origin, new Date().toLocaleString("ru-RU")
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Лист1!A${rowIndex + 1}:K${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
