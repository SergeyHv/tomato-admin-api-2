import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
    const sheetName = "_Tomato_Sait - Лист1";
    const { id } = req.body;

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:A`
    });

    const rows = getRes.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === String(id));

    if (rowIndex === -1) return res.status(404).json({ error: "ID не найден" });

    // Получаем sheetId (внутренний ID вкладки, обычно 0 для первой)
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = spreadsheet.data.sheets.find(s => s.properties.title === sheetName).properties.sheetId;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }]
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
