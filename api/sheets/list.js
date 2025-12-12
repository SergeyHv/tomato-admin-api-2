import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo"; 
    
    // ВАЖНО: Названия с пробелами пишутся в одинарных кавычках внутри строки
    const range = "'_Tomato_Sait - Лист1'!A:K"; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const headers = rows[0];
    const items = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });

    return res.status(200).json({ items });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: error.message, 
      details: "Проверьте, что лист называется именно: _Tomato_Sait - Лист1" 
    });
  }
}
