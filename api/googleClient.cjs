// ===================================================================
// Файл: api/googleClient.cjs (ФИНАЛЬНАЯ ВЕРСИЯ VERCEL)
// ===================================================================

const { google } = require('googleapis');

let sheetsClient = null;

async function getSheetsClient() {
    // Используем кэшированный клиент, если он уже инициализирован (холодный старт)
    if (sheetsClient) {
        return sheetsClient;
    }

    try {
        const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!credentialsString) {
            // Исправленное сообщение об ошибке, указывающее на Vercel
            throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is missing in Vercel settings.");
        }

        // --- Парсинг JSON-строки для авторизации Service Account ---
        // Vercel хранит секреты как строки, поэтому JSON.parse() необходим.
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(credentialsString), 
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        // Получаем авторизованный клиент
        const authClient = await auth.getClient();
        
        // Создаем клиент Sheets
        sheetsClient = google.sheets({ version: 'v4', auth: authClient });
        
        return sheetsClient;

    } catch (error) {
        console.error("Ошибка инициализации Google Sheets (проверьте ключ Vercel):", error);
        
        // Исправленное сообщение об ошибке
        const userFacingError = "Failed to initialize Google Sheets Client. Please double-check your GOOGLE_APPLICATION_CREDENTIALS key format in Vercel.";
        
        // Для Vercel мы используем throw, чтобы ошибка отобразилась в логах
        throw new Error(userFacingError);
    }
}

module.exports = { getSheetsClient };
