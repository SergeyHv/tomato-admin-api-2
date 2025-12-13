// ===================================================================
// Файл: netlify/functions/googleClient.cjs (ВЕРСИЯ 3: САМАЯ НАДЕЖНАЯ)
// ===================================================================

const { google } = require('googleapis');

let sheetsClient = null;

async function getSheetsClient() {
    if (sheetsClient) {
        return sheetsClient;
    }

    try {
        const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (!credentialsString) {
            throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable is missing.");
        }

        // --- Используем общий метод Google Auth, который умеет работать с JSON-строкой ---
        // Если переменная содержит JSON-объект, GoogleAuth автоматически его парсит
        // и использует для авторизации Service Account.

        const auth = new google.auth.GoogleAuth({
            // Мы явно указываем, что credentials должны быть прочитаны из
            // GOOGLE_APPLICATION_CREDENTIALS
            credentials: JSON.parse(credentialsString), 
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        // Получаем авторизованный клиент
        const authClient = await auth.getClient();
        
        // Создаем клиент Sheets
        sheetsClient = google.sheets({ version: 'v4', auth: authClient });
        
        return sheetsClient;

    } catch (error) {
        console.error("Ошибка инициализации Google Sheets (проверьте ключ):", error);
        // Возвращаем более понятное сообщение
        throw new Error("Failed to initialize Google Sheets Client. Please double-check your GOOGLE_APPLICATION_CREDENTIALS key format in Netlify.");
    }
}

module.exports = { getSheetsClient };
