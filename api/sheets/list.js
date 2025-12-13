// ===================================================================
// Файл: api/sheets/list.js (ФИНАЛЬНЫЙ CJS С ГАРАНТИРОВАННЫМ CORS И ДЕТАЛЯМИ ОШИБКИ)
// ===================================================================

const { getSheetsClient } = require("../lib/googleClient"); 

module.exports = async (req, res) => {
    
    // --- 1. Настройка CORS-заголовков ---
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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
        console.error('Критическая ошибка Vercel API (list.js):', error);
        // >>>>> ОТПРАВЛЯЕМ ДЕТАЛИ ОШИБКИ В БРАУЗЕР <<<<<
        return res.status(500).json({ 
            error: 'Server error fetching data', 
            details: error.message 
        });
    }
};
