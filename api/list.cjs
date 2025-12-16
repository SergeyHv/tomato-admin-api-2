// ===================================================================
// Файл: api/list.cjs (ФОРМАТ VERCEL FUNCTION)
// ===================================================================

const { getSheetsClient } = require("./googleClient.cjs");
const { google } = require('googleapis');

module.exports = async (req, res) => {

    // --- CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();

        const spreadsheetId = process.env.SPREADSHEET_ID || "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
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
                const safeHeader = header.toLowerCase().replace(/[^a-z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
                item[safeHeader] = row[index] !== undefined ? row[index] : "";
            });
            return item;
        });

        return res.status(200).json({ items });

    } catch (error) {
        console.error('Критическая ошибка Vercel API (list.cjs):', error);
        return res.status(500).json({
            error: 'Server error fetching data',
            details: error.message
        });
    }
};
