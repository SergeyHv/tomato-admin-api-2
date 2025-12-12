import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
    const { id } = req.body;

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Лист1!A:A" });
    const rows = response.data.values;
    const rowIndex = rows.findIndex(row => row[0] === String(id));

    if (rowIndex === -1) return res.status(404).json({ message: "ID не найден" });

    // Удаляем строку целиком
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId: 0, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
