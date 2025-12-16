// ===================================================================
// Файл: api/add.cjs (ФОРМАТ VERCEL FUNCTION)
// ===================================================================

const { getSheetsClient } = require("./googleClient.cjs"); 

module.exports = async (req, res) => {

    // --- CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    // Проверка метода
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();

        const spreadsheetId = process.env.SPREADSHEET_ID || "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const range = "'_Tomato_Sait - Лист1'!A:K";

        // Получение тела запроса
        let data;
        try {
            data = req.body;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON body provided" });
        }

        const { id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version } = data;

        const values = [[
            id, name, description, mainphoto, color, type, size, season, gallery_photos, origin, version
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            requestBody: { values }
        });

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Ошибка при записи в Google Sheets:", error);

        return res.status(500).json({
            error: 'Server error adding data',
            details: error.message
        });
    }
};
