import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  try {
    const sheets = await getSheetsClient();
    
    // ID твоей таблицы (проверь его!)
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo"; 
    const range = "Лист1!A:K"; // Читаем все 11 колонок (от A до K)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return res.status(200).json([]);
    }

    // Превращаем массив массивов в массив объектов (с ключами из первой строки)
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });

    return res.status(200).json(data);

  } catch (error) {
    console.error("Ошибка при получении списка:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
