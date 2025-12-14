// ===================================================================
// Файл: netlify/functions/upload-image.cjs (ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ С BUSBOY)
// ===================================================================

// НОВАЯ СТРОКА: Правильный импорт busboy для CJS модулей
const Busboy = require('busboy').Busboy;

// --- КОНСТАНТЫ РЕПОЗИТОРИЯ ---
const GITHUB_OWNER = 'SergeyHv'; 
const GITHUB_REPO = 'tomato';
const GITHUB_BRANCH = 'main';
// --- КОНЕЦ КОНСТАНТ ---

// Упрощенные рабочие CORS-заголовки
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// Функция парсинга тела запроса с Busboy
const parseMultipartForm = (event) => {
    return new Promise((resolve, reject) => {
        
        const contentType = event.headers['content-type'] || event.headers['Content-Type'];
        if (!contentType || !contentType.includes('multipart/form-data')) {
            return reject(new Error('Invalid Content-Type: Expected multipart/form-data'));
        }

        // ИСПРАВЛЕНИЕ: Используем 'new Busboy', а не 'Busboy.default'
        const busboy = new Busboy({ headers: event.headers }); 
        let fileData = null;
        let fileName = null;
        
        // 1. Обработка файла
        busboy.on('file', (fieldname, file, info) => {
            if (fieldname !== 'file') return;
            
            const { filename } = info;
            fileName = filename;

            let buffer = Buffer.alloc(0);
            file.on('data', (data) => {
                buffer = Buffer.concat([buffer, data]);
            });
            file.on('end', () => {
                fileData = buffer;
            });
            file.on('error', reject);
        });

        // 2. Окончание парсинга
        busboy.on('finish', () => {
            if (fileData && fileName) {
                resolve({ fileData, fileName });
            } else {
                reject(new Error('File data or filename is missing after parsing.'));
            }
        });

        busboy.on('error', reject);

        // 3. Запуск парсинга
        // Декодируем event.body, если он в Base64
        const bodyBuffer = event.isBase64Encoded 
            ? Buffer.from(event.body, 'base64') 
            : Buffer.from(event.body);
        
        busboy.write(bodyBuffer);
        busboy.end();
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
        // 1. Проверка токена
        const token = process.env.GH_UPLOAD_TOKEN;
        if (!token) {
            console.error("CRITICAL ERROR: Missing GH_UPLOAD_TOKEN environment variable.");
            throw new Error("Missing GH_UPLOAD_TOKEN");
        }

        // 2. Парсинг данных с Busboy
        const { fileData: buffer, fileName: originalName } = await parseMultipartForm(event);

        if (!buffer || buffer.length === 0) {
            throw new Error("File buffer is empty after Busboy parsing.");
        }
        
        const base64 = buffer.toString("base64");
        
        // 3. Подготовка и загрузка на GitHub
        const fileName = `${Date.now()}-${originalName}`;
        const githubPath = `images/${fileName}`;
        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;

        // 4. Запрос к GitHub
        const githubRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                // Используем Bearer для современных токенов
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
            
            let githubErrorDetails = githubData.message || "Unknown GitHub error";
            if (githubRes.status === 401 || githubRes.status === 403) {
                 githubErrorDetails = `Authorization failed (${githubRes.status}). Check GH_UPLOAD_TOKEN permissions (repo scope) or ensure the token is valid.`;
            }
            
            throw new Error(`GitHub upload failed: ${githubErrorDetails}`);
        }
        
        // 5. Возврат URL
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
