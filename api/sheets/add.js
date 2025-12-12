import { getSheetsClient } from "../lib/googleClient.js";

export default async function handler(req, res) {
  // Разрешаем только POST запросы (отправка данных)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен. Используйте POST.' });
  }

  try {
    const sheets = await getSheetsClient();
    const { id, name, description, mainphoto, color, type, size, season, gallery_photos } = req.body;

    // ID твоей таблицы (возьми его из URL таблицы между /d/ и /edit)
    const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo"; 
    const range = "Лист1!A:J"; // Название листа и колонки от A до J

    // Формируем массив данных в том порядке, в котором идут колонки в таблице
    const newRow = [
      id || "",
      name || "",
      description || "",
      mainphoto || "",
      color || "",
      type || "",
      size || "",
      season || "",
      gallery_photos || "",
      new Date().toLocaleString("ru-RU") // Версия/Дата добавления
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED", // Данные записываются как если бы их ввел человек
      requestBody: {
        values: [newRow],
      },
    });

    return res.status(200).json({ 
      success: true, 
      message: "Томат успешно добавлен!", 
      updatedRange: response.data.updates.updatedRange 
    });

  } catch (error) {
    console.error("Ошибка API:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
