export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { filename, contentBase64 } = req.body;

  if (!filename || !contentBase64) {
    return res.status(400).json({ error: "Missing filename or content" });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_USER = "SergeyHv";
  const GITHUB_REPO = "tomato";
  const GITHUB_BRANCH = "main";
  const IMAGES_PATH = "images";

  const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${IMAGES_PATH}/${filename}`;

  const payload = {
    message: `Upload ${filename}`,
    content: contentBase64,
    branch: GITHUB_BRANCH
  };

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.status >= 400) {
    return res.status(500).json({ error: data });
  }

  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${IMAGES_PATH}/${filename}`;

  res.status(200).json({ url: rawUrl });
}
