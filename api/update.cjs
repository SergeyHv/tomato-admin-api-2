// ===================================================================
// Файл: netlify/functions/update.cjs (ФОРМАТ NETLIFY FUNCTION)
// ===================================================================

// 1. Изменяем путь к googleClient
const { getSheetsClient } = require("./googleClient.cjs");

// --- Оборачиваем логику в exports.handler ---
exports.handler = async (event, context) => {
    
    // Заголовки для ответа (для CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // --- Обработка Preflight-запроса (OPTIONS) ---
    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers 
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
        const sheetName = "_Tomato_Sait - Лист1";
        
        // 3. Получение и парсинг тела запроса из Netlify event.body
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
        
        const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = data; // Используем data

        // 1. Получаем все ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A`
        });

        const rows = getRes.data.values || [];
        const rowIndex = rows.findIndex(row => row && row[0] === String(id));

        if (rowIndex === -1) {
            return { 
                statusCode: 404, 
                headers,
                body: JSON.stringify({ error: "Томат с таким ID не найден" }) 
            };
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

        // 4. Возвращаем успешный ответ
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, updatedRow: rowNumber })
        };
        
    } catch (error) {
        console.error("Ошибка при обновлении Google Sheets:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error updating data: ' + error.message })
        };
    }
};
