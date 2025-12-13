// ===================================================================
// Файл: api/lib/googleClient.js (СТАНДАРТНЫЙ CJS, ПРОВЕРЕННЫЙ)
// ===================================================================

const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

// Ключ для доступа к листу (ID вашей таблицы)
const SPREADSHEET_ID = '1XFeUWj0H0ztlTIGZVSNMeumfsGjjKfGYHkPw3A1xdKo';

let sheetsClient = null;

// Эта функция инициализирует клиент Sheets
async function getSheetsClient() {
    if (sheetsClient) {
        return sheetsClient;
    }

    try {
        // 1. Создаем объект авторизации, используя переменные окружения Vercel
        // Vercel автоматически ищет SERVICE_ACCOUNT_KEY в переменной окружения
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // 2. Получаем авторизованный HTTP-клиент
        const authClient = await auth.getClient();

        // 3. Создаем клиент Google Sheets
        sheetsClient = google.sheets({ 
            version: 'v4', 
            auth: authClient 
        });

        console.log("Google Sheets Client успешно инициализирован.");
        return sheetsClient;

    } catch (error) {
        console.error('Критическая ошибка инициализации Google Client:', error.message);
        // Важно: если этот файл падает, Vercel возвращает 500
        throw new Error(`Failed to initialize Google Sheets Client. Check your VERCEL environment variables. Details: ${error.message}`);
    }
}

module.exports = {
    getSheetsClient,
    SPREADSHEET_ID,
};
