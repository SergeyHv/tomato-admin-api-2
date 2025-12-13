// ===================================================================
// Файл: api/sheets/add.js (ФИНАЛЬНЫЙ ИСПРАВЛЕННЫЙ КОД VERCEL)
// ===================================================================

const { getSheetsClient } = require("../lib/googleClient.cjs");

module.exports = async (req, res) => {
    
    // --- 1. Настройка CORS-заголовков ---
    // Разрешаем запросы с вашего фронтенда
    res.setHeader('Access-Control-Allow-Origin', 'https://sergeyhv.github.io');
    // Разрешаем методы POST и OPTIONS
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // --- 2. Обработка Preflight-запроса (OPTIONS) ---
    // Если метод OPTIONS, просто отправляем 200, подтверждая CORS-разрешение
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- 3. Обработка основного запроса (POST) ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        // Используем данные из вашего кода
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
        console.error("Ошибка при записи в Google Sheets:", error);
        return res.status(500).json({ error: error.message });
    }
}
