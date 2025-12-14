// ===================================================================
// Файл: netlify/functions/add.cjs (ФОРМАТ NETLIFY FUNCTION)
// ===================================================================

// 1. Изменяем путь к googleClient
const { getSheetsClient } = require("./googleClient.cjs"); 

// --- Оборачиваем логику в exports.handler ---
exports.handler = async (event, context) => {
    
    // Заголовки для ответа (для CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*', // Netlify сам добавит заголовки, но лучше их вернуть
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // --- 1. Обработка Preflight-запроса (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ status: 'ok', message: 'Preflight check success' }) 
        };
    }

    // --- 2. Обработка основного запроса (POST) ---
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const sheets = await getSheetsClient();
        
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const range = "'_Tomato_Sait - Лист1'!A:K";
        
        // --- 3. Получение и парсинг тела запроса из Netlify event.body ---
        let data;
        try {
            data = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Invalid JSON body provided" })
            };
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

        // 4. Возвращаем успешный ответ
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        console.error("Ошибка при записи в Google Sheets:", error);
        
        // 5. Возвращаем ошибку
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Server error adding data',
                details: error.message
            })
        };
    }
};
