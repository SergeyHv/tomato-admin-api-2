export const config = {
  api: {
    bodyParser: false
  }
};

import { IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.GH_UPLOAD_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN" });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("FORM PARSE ERROR:", err);
      return res.status(500).json({ error: "Form parse error" });
    }

    try {
      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: "No file" });
      }

      const tempPath = Array.isArray(file) ? file[0].filepath : file.filepath;
      const originalName = Array.isArray(file)
        ? file[0].originalFilename
        : file.originalFilename;

      const buffer = fs.readFileSync(tempPath);
      const base64 = buffer.toString("base64");

      const fileName = `${Date.now()}-${originalName}`;
      const githubPath = `images/${fileName}`;

      const githubRes = await fetch(
        "https://api.github.com/repos/SergeyHv/tomato/contents/" + githubPath,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "User-Agent": "tomato-admin-api"
          },
          body: JSON.stringify({
            message: "Upload image from admin",
            content: base64
          })
        }
      );

      const githubData = await githubRes.json();

      if (!githubRes.ok) {
        console.error("GITHUB ERROR:", githubData);
        return res.status(500).json({ error: "GitHub upload failed" });
      }

      const rawUrl = `https://raw.githubusercontent.com/SergeyHv/tomato/main/${githubPath}`;

      return res.status(200).json({ url: rawUrl });
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      return res.status(500).json({ error: "Upload failed" });
    }
  });
}
