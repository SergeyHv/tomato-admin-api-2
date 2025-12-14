// ===================================================================
// Файл: api/update.cjs (ФОРМАТ VERCEL FUNCTION)
// ===================================================================

const { getSheetsClient } = require("./googleClient.cjs");

// Vercel требует, чтобы основной экспорт был функцией-обработчиком (req, res)
module.exports = async (req, res) => {

    // --- Настройка CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // --- Обработка Preflight-запроса (OPTIONS) ---
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    // --- 2. Обработка основного запроса (POST) ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        
        // В Vercel req.body уже доступен, если это JSON,
        // но лучше читать его потоком или использовать библиотеку.
        // Для POST-запросов JSON req.body часто приходится читать асинхронно.
        
        let data;
        try {
            // Чтение тела запроса для Vercel (ожидаем JSON)
            data = req.body;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON body provided" });
        }
        
        const spreadsheetId = process.env.SPREADSHEET_ID || "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        
        const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = data;

        // 1. Получаем все ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A`
        });

        const rows = getRes.data.values || [];
        // Находим индекс, начиная с 0 (заголовок + 1)
        const rowIndex = rows.findIndex(row => row && row[0] === String(id));

        if (rowIndex === -1) {
            return res.status(404).json({ error: "Томат с таким ID не найден" });
        }

        // rowNumber - это реальный номер строки в таблице Google Sheets (начиная с 1)
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

        // 4. Возвращаем успешный ответ Vercel
        return res.status(200).json({ success: true, updatedRow: rowNumber });
        
    } catch (error) {
        console.error("Ошибка при обновлении Google Sheets:", error);
        return res.status(500).json({ error: 'Server error updating data: ' + error.message });
    }
};
