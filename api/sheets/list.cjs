// ===================================================================
// Файл: api/sheets/list.cjs (ОЧИЩЕННЫЙ CJS БЕЗ ДУБЛИРУЮЩИХСЯ CORS-ЗАГОЛОВКОВ)
// ===================================================================

const { getSheetsClient } = require("../lib/googleClient.cjs");

module.exports = async (req, res) => {
    
    // --- 1. Обработка CORS Preflight (OPTIONS) ---
    // Заголовки CORS гарантированы через vercel.json
    if (req.method === 'OPTIONS') {
        // Ответ 200 на Preflight запрос
        return res.status(200).json({ status: 'ok', message: 'Preflight check success' });
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        // ВНИМАНИЕ: Если getSheetsClient не работает, проверьте, что lib/googleClient.cjs существует и корректно экспортирует функцию.
        
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:K`,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(200).json({ items: [] });
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

        return res.status(200).json({ items });

    } catch (error) {
        console.error('Критическая ошибка Vercel API (list.cjs):', error);
        // >>>>> ОТПРАВЛЯЕМ ДЕТАЛИ ОШИБКИ В БРАУЗЕР <<<<<
        return res.status(500).json({
            error: 'Server error fetching data',
            details: error.message
        });
    }
};
