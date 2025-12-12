import { google } from "googleapis";

export async function getSheetsClient() {
  // Проверяем, есть ли ключ в переменных окружения
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Переменная GOOGLE_SERVICE_ACCOUNT_KEY не установлена");
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive"
    ]
  });

  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}
