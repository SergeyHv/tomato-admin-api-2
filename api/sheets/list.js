// ===================================================================
// Файл: api/sheets/list.js (ФИНАЛЬНЫЙ CJS ФОРМАТ VERCEL)
// ===================================================================

const { getSheetsClient } = require("../lib/googleClient"); 

module.exports = async (req, res) => {
    
    // --- 1. Настройка CORS-заголовков ---
    // Используем * для диагностики
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка Preflight-запроса (OPTIONS), хотя GET его не требует, это хорошая практика
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1"; 
        
        // Чтение данных (от A до K, включая заголовки)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:K`, 
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(200).json({ items: [] });
        }

        // Первую строку (заголовки) используем как ключи
        const headers = rows[0]; 
        // Остальные строки - данные
        const dataRows = rows.slice(1); 

        // Маппинг (преобразование) массива данных в массив объектов
        const items = dataRows.map(row => {
            const item = {};
            headers.forEach((header, index) => {
                // Используем заголовок в качестве ключа (A, B, C...)
                item[header] = row[index] || ""; 
            });
            return item;
        });

        return res.status(200).json({ items });

    } catch (error) {
        console.error('Ошибка в list.js:', error);
        // Возвращаем 500, чтобы показать, что это ошибка сервера
        return res.status(500).json({ error: 'Server error fetching data: ' + error.message });
    }
};
