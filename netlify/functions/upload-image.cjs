// ===================================================================
// Файл: netlify/functions/upload-image.cjs (ФОРМАТ NETLIFY FUNCTION)
// ===================================================================

// ВНИМАНИЕ: Netlify Functions не поддерживает 'fs' (filesystem) напрямую,
// особенно для временных файлов. Мы перепишем логику парсинга
// тела запроса, чтобы она работала в serverless-среде.

const { IncomingForm } = require("formidable");
// fs здесь может работать, но лучше использовать чистый буфер из event.body

// --- КОНСТАНТЫ РЕПОЗИТОРИЯ ---
const GITHUB_OWNER = 'SergeyHv'; 
const GITHUB_REPO = 'tomato';
const GITHUB_BRANCH = 'main';
// --- КОНЕЦ КОНСТАНТ ---

// 1. Оборачиваем логику в exports.handler
exports.handler = async (event, context) => {
    
    // 2. Блок CORS (Header для ответа)
    const headers = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': 'https://sergeyhv.github.io', 
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    };

    // Обработка предварительного запроса OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: "Method not allowed" })
        };
    }

    // 3. Проверка токена
    const token = process.env.GH_UPLOAD_TOKEN;
    if (!token) {
        console.error("CRITICAL ERROR: Missing GH_UPLOAD_TOKEN environment variable.");
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Missing GH_UPLOAD_TOKEN" })
        };
    }
    
    // --- 4. Адаптация Formidable для Netlify ---
    // Netlify (AWS Lambda) требует, чтобы мы обрабатывали event.body
    
    // Эта функция парсит тело запроса multipart/form-data в памяти
    const parseForm = (event) => {
        return new Promise((resolve, reject) => {
            const form = new IncomingForm();
            // Включаем опцию keepExtensions: true, чтобы formidable не терял расширение
            form.keepExtensions = true; 
            
            // Нам нужно создать Mock Request Object, чтобы Formidable мог работать с event.body
            const mockReq = { 
                headers: event.headers, 
                body: event.body,
                method: event.httpMethod
            };
            
            // Если тело закодировано в base64 (стандартно для Netlify event.body)
            if (event.isBase64Encoded) {
                 mockReq.body = Buffer.from(event.body, 'base64');
            }

            // Важно: Formidable ожидает потоковый объект, а у нас строка/буфер.
            // Это обходной путь - мы создаем поток из буфера
            const stream = require('stream');
            const bufferStream = new stream.PassThrough();
            bufferStream.end(mockReq.body);
            
            // Привязываем буфер-поток к mockReq
            mockReq.pipe = (dest) => bufferStream.pipe(dest);

            // Парсим с использованием нашего mockReq
            form.parse(mockReq, (err, fields, files) => {
                if (err) return reject(err);
                resolve({ fields, files });
            });
        });
    };
    
    try {
        const { files } = await parseForm(event);

        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        if (!file) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "No file uploaded." })
            };
        }
        
        // 5. Чтение файла и кодирование в Base64
        // Внимание: formidable уже сохранил файл во временное место,
        // теперь мы его читаем, кодируем и удаляем.
        const tempPath = file.filepath;
        const originalName = file.originalFilename;
        const buffer = require('fs').readFileSync(tempPath); // Используем fs.readFileSync для чтения
        const base64 = buffer.toString("base64");
        
        // Удаление временного файла
        require('fs').unlinkSync(tempPath);
        
        // 6. Подготовка к загрузке на GitHub
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
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: "GitHub upload failed",
                    details: githubData.message || "Unknown GitHub error"
                })
            };
        }
        
        // 8. Возврат URL
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: rawUrl })
        };

    } catch (e) {
        console.error("CRITICAL UPLOAD ERROR:", e);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Critical upload failed", details: e.message })
        };
    }
};
