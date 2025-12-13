// ===================================================================
// Файл: api/sheets/update.js (ФИНАЛЬНЫЙ CJS ФОРМАТ VERCEL)
// ===================================================================

// Используем require вместо import
const { getSheetsClient } = require("../lib/googleClient"); 

module.exports = async (req, res) => {
    
    // --- 1. Настройка CORS-заголовков (Временно используем *) ---
    res.setHeader('Access-Control-Allow-Origin', '*'); // <--- ВРЕМЕННО * ДЛЯ ДИАГНОСТИКИ
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // --- 2. Обработка Preflight-запроса (OPTIONS) ---
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // --- 3. Обработка основного запроса (POST) ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // --- Ваш оригинальный код обновления ---
    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        
        const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = req.body;

        // 1. Получаем все ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A`
        });

        const rows = getRes.data.values || [];
        const rowIndex = rows.findIndex(row => row && row[0] === String(id));

        if (rowIndex === -1) {
            return res.status(404).json({ error: "Томат с таким ID не найден" });
        }

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

        return res.status(200).json({ success: true, updatedRow: rowNumber });
    } catch (error) {
        console.error("Ошибка при обновлении Google Sheets:", error);
        return res.status(500).json({ error: error.message });
    }
};
