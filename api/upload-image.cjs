// ===================================================================
// Файл: api/upload-image.cjs (ФОРМАТ VERCEL FUNCTION, ИСПРАВЛЕННЫЙ BUSBOY)
// ===================================================================

// Импорт Busboy (используем require('busboy') для совместимости с Vercel)
const Busboy = require('busboy');

// --- КОНСТАНТЫ РЕПОЗИТОРИЯ ---
const GITHUB_OWNER = 'SergeyHv'; 
const GITHUB_REPO = 'tomato';
const GITHUB_BRANCH = 'main';
// --- КОНЕЦ КОНСТАНТ ---

// Vercel требует, чтобы основной экспорт был функцией-обработчиком (req, res)
// Для асинхронной обработки потоков (Busboy) используем Promise
module.exports = (req, res) => {
    
    // --- Настройка CORS ---
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // --- Обработка CORS Preflight (OPTIONS) ---
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Обертываем всю асинхронную логику в Promise, чтобы Vercel дождался ее завершения
    return new Promise(async (resolve, reject) => {
        
        try {
            // 1. Проверка токена
            const token = process.env.GH_UPLOAD_TOKEN;
            if (!token) {
                console.error("CRITICAL ERROR: Missing GH_UPLOAD_TOKEN environment variable.");
                res.status(500).json({ error: "Missing GH_UPLOAD_TOKEN" });
                return resolve(); // Завершаем обработку
            }

            // 2. Инициализация Busboy
            // req.headers содержит заголовки, необходимые для парсинга multipart
            const busboy = Busboy({ headers: req.headers });
            let fileData = null;
            let originalName = null;

            // 3. Обработка файла
            busboy.on('file', (fieldname, file, info) => {
                if (fieldname !== 'file') {
                    // Пропускаем все, кроме файла
                    file.resume();
                    return;
                }
                
                const { filename } = info;
                originalName = filename;

                let buffer = Buffer.alloc(0);
                file.on('data', (data) => {
                    buffer = Buffer.concat([buffer, data]);
                });
                file.on('end', () => {
                    fileData = buffer;
                });
                file.on('error', (e) => {
                    reject(e); 
                });
            });

            // 4. Окончание парсинга
            busboy.on('finish', async () => {
                try {
                    if (!fileData || fileData.length === 0) {
                        throw new Error("File buffer is empty after Busboy parsing.");
                    }

                    const base64 = fileData.toString("base64");
                    
                    // 5. Подготовка и загрузка на GitHub
                    const fileName = `${Date.now()}-${originalName}`;
                    const githubPath = `images/${fileName}`;
                    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;

                    // 6. Запрос к GitHub
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
                        
                        let githubErrorDetails = githubData.message || "Unknown GitHub error";
                        if (githubRes.status === 401 || githubRes.status === 403) {
                            githubErrorDetails = `Authorization failed (${githubRes.status}). Check GH_UPLOAD_TOKEN permissions (repo scope) or ensure the token is valid.`;
                        }
                        
                        throw new Error(`GitHub upload failed: ${githubErrorDetails}`);
                    }
                    
                    // 7. Возврат URL
                    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;

                    // Отправляем успешный JSON-ответ Vercel
                    res.status(200).json({ url: rawUrl });
                    resolve();

                } catch (e) {
                    console.error("CRITICAL UPLOAD ERROR (Busboy finish):", e);
                    res.status(500).json({ error: "Critical upload failed", details: e.message });
                    resolve(); // Завершаем Promise
                }
            });

            // 8. Обработка ошибок потока
            busboy.on('error', (e) => {
                console.error("Busboy stream error:", e);
                res.status(500).json({ error: "Busboy stream error", details: e.message });
                resolve();
            });

            // 9. Начинаем парсинг: передаем поток запроса (req) в Busboy
            req.pipe(busboy);

        } catch (e) {
            console.error("Top-level handler error:", e);
            res.status(500).json({ error: "Top-level error", details: e.message });
            resolve();
        }
    });
};
