import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  try {
    const sheets = await getSheetsClient();
    // Твой ID таблицы
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo"; 
    const range = "A:K"; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return res.status(200).json({ items: [] });
    }

    // Заголовки (первая строка)
    const headers = rows[0];
    
    // Превращаем строки в объекты
    const items = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });

    // Возвращаем объект с ключом items (как ожидает твой фронтенд)
    return res.status(200).json({ items });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
