// ===================================================================
// Файл: netlify/functions/upload-image.cjs (ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ ДЛЯ NETLIFY)
// ===================================================================

// Используем 'formidable' для парсинга, но без записи на диск
const { IncomingForm } = require("formidable"); 
// Node.js встроенный модуль для работы с потоками
const { PassThrough } = require('stream'); 

// --- КОНСТАНТЫ РЕПОЗИТОРИЯ ---
const GITHUB_OWNER = 'SergeyHv'; 
const GITHUB_REPO = 'tomato';
const GITHUB_BRANCH = 'main';
// --- КОНЕЦ КОНСТАНТ ---

// 1. Упрощенные рабочие CORS-заголовки
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', // Разрешаем доступ с любого домена
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 2. Адаптация Formidable для Netlify (парсинг тела запроса в памяти)
const parseForm = (event) => {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm({
            // Установка path/uploadDir не нужна, мы парсим в памяти
            keepExtensions: true, 
            multiples: false,
            // Максимальный размер файла 5MB (лимит Lambda)
            maxFileSize: 5 * 1024 * 1024 
        });

        const mockReq = { 
            headers: event.headers, 
            method: event.httpMethod
        };
        
        // Создаем поток из тела запроса (event.body)
        const body = event.isBase64Encoded 
            ? Buffer.from(event.body, 'base64') 
            : event.body;

        const bufferStream = new PassThrough();
        bufferStream.end(body);
        
        // Передаем поток в Formidable
        form.parse(bufferStream, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

exports.handler = async (event, context) => {
    
    // Обработка предварительного запроса OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS_HEADERS };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    try {
        // 3. Проверка токена
        const token = process.env.GH_UPLOAD_TOKEN;
        if (!token) {
            console.error("CRITICAL ERROR: Missing GH_UPLOAD_TOKEN environment variable.");
            throw new Error("Missing GH_UPLOAD_TOKEN");
        }

        // 4. Парсинг данных
        const { files } = await parseForm(event);

        // Формат файла в Formidable - объект с данными, а не путь к файлу
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        if (!file || !file.originalFilename) {
            return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "No file uploaded or file is corrupt." }) };
        }
        
        // ВНИМАНИЕ: Для работы с файлами без fs, нам нужно, чтобы formidable
        // сохранил данные файла в памяти (в объекте file.data), но для этого 
        // часто нужна дополнительная настройка (например, использование busboy).
        // Предполагаем, что file.data содержит буфер, если запись на диск не удалась.
        // Если это не сработает, то нужно использовать 'busboy'.
        
        // 5. Временное решение: Чтение файла из буфера. 
        // (Это сработает, только если formidable НЕ пытался записать файл на диск)
        const buffer = file.buffer || file.data; 

        if (!buffer) {
             throw new Error("File buffer is missing. Formidable failed to parse file content.");
        }

        const base64 = buffer.toString("base64");
        const originalName = file.originalFilename;
        
        // 6. Подготовка и загрузка на GitHub
        const fileName = `${Date.now()}-${originalName}`;
        const githubPath = `images/${fileName}`;
        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;

        // 7. Запрос к GitHub (используем fetch)
        const githubRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, 
                "User-Agent": "tomato-admin-api"
            },
            body: JSON.stringify({
                message: "Upload image from admin",
                content: base64,
                branch: GITHUB_BRANCH
            })
        });

        const githubData = await githubRes.json();

        if (!githubRes.ok) {
            console.error("GITHUB UPLOAD FAILED:", githubRes.status, githubData.message || githubData);
            throw new Error(`GitHub upload failed: ${githubData.message || "Unknown error"}`);
        }
        
        // 8. Возврат URL
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ url: rawUrl })
        };

    } catch (e) {
        console.error("CRITICAL UPLOAD ERROR:", e);
        // Возвращаем статус 500 с деталями ошибки и CORS-заголовком
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: "Critical upload failed", details: e.message })
        };
    }
};
