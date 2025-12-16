// ===================================================================
// Файл: api/delete.cjs (ФОРМАТ VERCEL FUNCTION)
// ===================================================================

const { getSheetsClient } = require("./googleClient.cjs"); 

module.exports = async (req, res) => {
    
    // --- CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, admin-key');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let data;
        try {
            data = req.body;
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
        } catch (parseError) {
            return res.status(400).json({ error: "Invalid JSON body provided" });
        }
        
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.SPREADSHEET_ID || "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        const { id } = data;

        if (!id) {
            return res.status(400).json({ error: "Требуется ID для удаления" });
        }

        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A` 
        });

        const rows = getRes.data.values || [];
        const rowIndex = rows.findIndex(row => row && row[0] === String(id));

        if (rowIndex === -1) {
            return res.status(404).json({ error: `ID ${id} не найден` });
        }

        const rowToDelete = rowIndex; 
        
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
        
        if (!sheet) {
            return res.status(500).json({ error: `Лист с именем '${sheetName}' не найден.` });
        }
        
        const sheetId = sheet.properties.sheetId;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: rowToDelete, 
                            endIndex: rowToDelete + 1 
                        }
                    }
                }]
            }
        });

        return res.status(200).json({ success: true, deletedId: id });
        
    } catch (error) {
        console.error('Ошибка в delete.cjs:', error);
        return res.status(500).json({ error: 'Server error deleting data: ' + error.message });
    }
};
