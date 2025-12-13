// ===================================================================
// Файл: netlify/functions/list.cjs (ФОРМАТ NETLIFY FUNCTION)
// ===================================================================

// 1. Изменяем путь к googleClient, т.к. он теперь в той же папке
const { getSheetsClient } = require("./googleClient.cjs"); 
const { google } = require('googleapis');

// --- 2. Оборачиваем логику в exports.handler ---
exports.handler = async (event, context) => {
    
    // --- Обработка CORS Preflight (OPTIONS) ---
    // Netlify обрабатывает CORS через netlify.toml, но для надежности можно оставить
    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ status: 'ok', message: 'Preflight check success' })
        };
    }
    
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const sheets = await getSheetsClient();
        
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:K`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ items: [] })
            };
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const items = dataRows.map(row => {
            const item = {};
            headers.forEach((header, index) => {
                item[header] = row[index] !== undefined ? row[index] : "";
            });
            return item;
        });

        // 3. Возвращаем ответ в формате Netlify (объект с statusCode, headers и body)
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ items })
        };

    } catch (error) {
        console.error('Критическая ошибка Netlify API (list.cjs):', error);
        
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                error: 'Server error fetching data',
                details: error.message
            })
        };
    }
};
