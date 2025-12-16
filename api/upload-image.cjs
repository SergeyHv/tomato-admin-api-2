const Busboy = require("busboy");
const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, admin-key, Authorization");

  if (req.method === "OPTIONS") return res.status(200).send("ok");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (req.headers["admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: "Invalid admin key" });
  }

  const busboy = Busboy({ headers: req.headers });

  let fileBuffer = null;
  let fileName = null;

  busboy.on("file", (field, file, info) => {
    const safeName =
      Date.now() +
      "-" +
      info.filename.normalize("NFKD").replace(/[^\w.-]+/g, "_");

    fileName = safeName;

    const chunks = [];
    file.on("data", chunk => chunks.push(chunk));
    file.on("end", () => {
      fileBuffer = Buffer.concat(chunks);
    });
  });

  busboy.on("finish", async () => {
    if (!fileBuffer) return res.status(400).json({ error: "No file" });

    try {
      const githubUrl = `https://api.github.com/repos/SergeyHv/tomato/contents/images/${fileName}`;

      const uploadRes = await fetch(githubUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${fileName}`,
          content: fileBuffer.toString("base64"),
        }),
      });

      const json = await uploadRes.json();

      if (!uploadRes.ok) {
        console.error("GitHub upload error:", json);
        return res.status(500).json({ error: "GitHub upload failed" });
      }

      return res.status(200).json({ filename: fileName });

    } catch (err) {
      console.error("upload-image error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }
  });

  req.pipe(busboy);
};
