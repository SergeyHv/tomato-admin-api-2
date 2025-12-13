// ===================================================================
// Файл: netlify/functions/googleClient.cjs (ОБНОВЛЕНО ДЛЯ NETLIFY ENV)
// ===================================================================

const { google } = require('googleapis');

let sheetsClient = null;

async function getSheetsClient() {
    if (sheetsClient) {
        return sheetsClient;
    }

    try {
        // --- КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ ДЛЯ NETLIFY ---
        // 1. Получаем JSON-строку из переменной окружения
        const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!credentialsString) {
            throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is missing.");
        }

        // 2. Парсим строку в JavaScript объект
        const credentials = JSON.parse(credentialsString);
        
        // 3. Используем ServiceAccountCredentials, передавая объект напрямую
        const auth = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        // Проверяем авторизацию
        await auth.authorize();
        
        // Создаем клиент
        sheetsClient = google.sheets({ version: 'v4', auth });
        
        return sheetsClient;

    } catch (error) {
        console.error("Ошибка инициализации Google Sheets:", error);
        // Добавленная здесь строка помогает отловить VERCEL-специфичные ошибки
        throw new Error("Failed to initialize Google Sheets Client. Check your environment variables and key format.");
    }
}

module.exports = { getSheetsClient };
