// ===================================================================
// Файл: api/sheets/delete.cjs (ФОРМАТ CJS ДЛЯ VERCEL)
// ===================================================================

// Замена ESM импорта на CJS require (Указываем .cjs)
const { getSheetsClient } = require("../lib/googleClient.cjs"); 

// Замена ESM экспорта на CJS module.exports
module.exports = async (req, res) => {
    
    // --- 1. Настройка CORS-заголовков ---
    // Добавляем CORS, который был в list.cjs, на всякий случай
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Проверка метода POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = "1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo";
        const sheetName = "_Tomato_Sait - Лист1";
        const { id } = req.body;

        if (!id) {
             return res.status(400).json({ error: "Требуется ID для удаления" });
        }

        // 1. Ищем строку, содержащую ID
        const getRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetName}'!A:A` // Читаем только колонку с ID
        });

        // Строка заголовков имеет индекс 0, поэтому мы ищем ID, начиная с индекса 1
        const rows = getRes.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === String(id));

        // Если ID найден, его реальный индекс в таблице (начиная с 1)
        // будет равен найденному индексу в массиве
        if (rowIndex === -1) {
            return res.status(404).json({ error: `ID ${id} не найден` });
        }

        // Реальный индекс строки в Google Sheets (rowIndex + 1)
        const rowToDelete = rowIndex; // Потому что rowIndex === 0 - это заголовок
        
        // 2. Получаем sheetId (внутренний ID вкладки, необходим для deleteDimension)
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
        
        if (!sheet) {
             return res.status(500).json({ error: `Лист с именем '${sheetName}' не найден.` });
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
                            // Начинаем с найденной строки (индекс в массиве)
                            // и удаляем ОДНУ строку (endIndex: rowToDelete + 1)
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
