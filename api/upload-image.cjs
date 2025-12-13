import { IncomingForm } from "formidable";
import fs from "fs";

// Конфигурация Vercel/Next.js для отключения встроенного парсера тела запроса
export const config = {
  api: {
    bodyParser: false
  }
};

// --- КОНСТАНТЫ РЕПОЗИТОРИЯ (ПРОВЕРЬТЕ ТОЧНОСТЬ РЕГИСТРА!) ---
const GITHUB_OWNER = 'SergeyHv'; 
const GITHUB_REPO = 'tomato';
const GITHUB_BRANCH = 'main';
// --- КОНЕЦ КОНСТАНТ ---

export default async function handler(req, res) {
  // --- БЛОК CORS (Разрешает запросы с вашего фронтенда) ---
  const FRONTEND_ORIGIN = 'https://sergeyhv.github.io';
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Обработка предварительного запроса OPTIONS (Обязательно для CORS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // --- КОНЕЦ БЛОКА CORS ---


  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Проверка токена
  const token = process.env.GH_UPLOAD_TOKEN;
  if (!token) {
    console.error("CRITICAL ERROR: Missing GH_UPLOAD_TOKEN environment variable.");
    return res.status(500).json({ error: "Missing GH_UPLOAD_TOKEN" });
  }
  
  console.log("DEBUG: Token is present. Starting form parsing."); 

  // 2. Парсинг входящего файла с помощью Formidable
  const form = new IncomingForm();

  // Мы оборачиваем form.parse в Promise для лучшей асинхронной обработки
  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("FORM PARSE ERROR:", err);
        res.status(500).json({ error: "Form parse error." });
        return resolve();
      }

      try {
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        
        if (!file) {
          res.status(400).json({ error: "No file uploaded." });
          return resolve();
        }

        console.log("DEBUG: File received, starting read and base64 encoding."); 

        // Чтение файла
        const tempPath = file.filepath;
        const originalName = file.originalFilename;
        const buffer = fs.readFileSync(tempPath);
        const base64 = buffer.toString("base64");
        
        // Удаление временного файла
        fs.unlinkSync(tempPath);

        // 3. Подготовка к загрузке на GitHub
        const fileName = `${Date.now()}-${originalName}`;
        const githubPath = `images/${fileName}`;
        const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${githubPath}`;

        console.log(`DEBUG: Target API URL: ${apiUrl}`); 

        // 4. Запрос к GitHub (используем встроенный fetch)
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
            branch: GITHUB_BRANCH // Явное указание ветки
          })
        });

        const githubData = await githubRes.json();

        if (!githubRes.ok) {
          console.error("GITHUB UPLOAD FAILED:", githubRes.status, githubData.message || githubData);
          res.status(500).json({ 
            error: "GitHub upload failed",
            details: githubData.message || "Unknown GitHub error"
          });
          return resolve();
        }
        
        console.log("DEBUG: GitHub upload successful."); 

        // 5. Возврат URL
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${githubPath}`;

        res.status(200).json({ url: rawUrl });
        resolve();

      } catch (e) {
        console.error("CRITICAL UPLOAD ERROR:", e);
        res.status(500).json({ error: "Critical upload failed" });
        resolve();
      }
    });
  });
}
