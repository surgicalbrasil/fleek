// /api/check-email.js
import { Magic } from "@magic-sdk/admin";
import { google } from "googleapis";

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  try {
    const { email } = req.body;

    // Verificar se o email foi enviado
    if (!email) {
      return res.status(400).json({ success: false, error: "E-mail ausente." });
    }

    const userEmail = email.toLowerCase();

    // Inicializar o cliente do Google Sheets
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_SHEETS_CREDENTIALS, 'base64').toString('utf-8'));

    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    await client.authorize();

    const sheets = google.sheets({ version: 'v4', auth: client });

    // Definir o ID da planilha e o intervalo
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:A";

    // Buscar os dados da planilha
    const responseSheet = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = responseSheet.data.values;

    if (!rows || rows.length === 0) {
      console.error("Nenhum dado encontrado na planilha.");
      return res.status(500).json({ success: false, error: "Nenhum dado encontrado na planilha." });
    }

    // Extrair os emails e converter para minúsculas
    const authorizedEmailsFromSheet = rows.map(row => row[0].toLowerCase());

    // Verificar se o email do usuário está na lista autorizada
    const isAuthorized = authorizedEmailsFromSheet.includes(userEmail);

    return res.status(200).json({ success: true, authorized: isAuthorized });
  } catch (err) {
    console.error("Erro no backend:", err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
