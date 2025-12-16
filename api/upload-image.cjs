// ===================================================================
// API: Загрузка изображения в GitHub (upload-image.cjs)
// ===================================================================

const Busboy = require("busboy");
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // ------------------------------
  // ✅ CORS
  // ------------------------------
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, admin-key, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).send("ok");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ------------------------------
  // ✅ Проверка admin-key
  // ------------------------------
  const adminKey = req.headers["admin-key"];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Invalid admin key" });
  }

  // ------------------------------
  // ✅ Парсим FormData через Busboy
  // ------------------------------
  const busboy = Busboy({ headers: req.headers });

  let fileBuffer = null;
  let fileName = null;

  busboy.on("file", (fieldname, file, info) => {
    const { filename } = info;

    // ✅ Генерируем безопасное имя файла
    const safeName =
      Date.now() +
      "-" +
      filename
        .normalize("NFKD")
        .replace(/[^\w.-]+
