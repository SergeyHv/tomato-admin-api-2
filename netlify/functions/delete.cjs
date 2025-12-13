// ===================================================================
// Файл: netlify/functions/delete.cjs (ФОРМАТ NETLIFY FUNCTION)
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
    
    // Проверка метода POST
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        // 2. Получение и парсинг тела запроса из Netlify event.body
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
        
        const sheets = await getSheetsClient();
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        const { id } = data; // Используем data вместо req.body

        if (!id) {
            return { 
                statusCode: 400, 
                headers,
                body: JSON.stringify({ error: "Требуется ID для удаления" }) 
            };
        }

        // 1. Ищем строку, содержащую ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A` 
        });

        const rows = getRes.data.values || [];
        // ВНИМАНИЕ: rowToDelete будет реальным индексом строки в таблице (начиная с 1), 
        // если в rows[0] — заголовки, или найденным индексом в массиве, если мы ищем с первой строки.
        // Ваш код предполагает, что rows[0] — это заголовок.
        const rowIndex = rows.findIndex(row => row[0] === String(id));

        if (rowIndex === -1) {
            return { 
                statusCode: 404, 
                headers,
                body: JSON.stringify({ error: `ID ${id} не найден` }) 
            };
        }

        // Реальный индекс строки в Google Sheets для API - 
        // Ваш код использует rowToDelete как индекс, начиная с 0, что корректно для batchUpdate.
        const rowToDelete = rowIndex; 
        
        // 2. Получаем sheetId
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
        
        if (!sheet) {
            return { 
                statusCode: 500, 
                headers,
                body: JSON.stringify({ error: `Лист с именем '${sheetName}' не найден.` }) 
            };
        }
        
        const sheetId = sheet.properties.sheetId;

        // 3. Удаляем строку, используя batchUpdate
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            // startIndex и endIndex: rowToDelete — это индекс в массиве с учетом заголовка. 
                            // Если rowIndex = 1 (вторая строка данных), то это строка 2 в таблице.
                            // batchUpdate использует индексы, начинающиеся с 0, и включает startIndex, исключает endIndex.
                            startIndex: rowToDelete, 
                            endIndex: rowToDelete + 1 
                        }
                    }
                }]
            }
        });

        // 4. Возвращаем успешный ответ
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, deletedId: id })
        };
        
    } catch (error) {
        console.error('Ошибка в delete.cjs:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error deleting data: ' + error.message })
        };
    }
};
