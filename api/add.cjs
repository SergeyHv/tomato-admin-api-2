// ===================================================================
// Файл: api/add.cjs (ФОРМАТ VERCEL FUNCTION)
// ===================================================================

const { getSheetsClient } = require("./googleClient.cjs"); 

// Vercel требует, чтобы основной экспорт был функцией-обработчиком (req, res)
module.exports = async (req, res) => {

    // --- Настройка CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // --- 1. Обработка Preflight-запроса (OPTIONS) ---
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    // --- 2. Обработка основного запроса (POST) ---
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        
        // Используем переменную среды, если она установлена, с запасным вариантом
        const spreadsheetId = process.env.SPREADSHEET_ID || "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const range = "'_Tomato_Sait - Лист1'!A:K";
        
        // --- 3. Получение и парсинг тела запроса ---
        let data;
        try {
            data = req.body;
            // Дополнительная проверка, если Vercel не распарсил тело автоматически
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON body provided" });
        }

        const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = data;

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

        // 4. Возвращаем успешный ответ Vercel
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error("Ошибка при записи в Google Sheets:", error);
        
        // 5. Возвращаем ошибку Vercel
        return res.status(500).json({ 
            error: 'Server error adding data',
            details: error.message
        });
    }
};
