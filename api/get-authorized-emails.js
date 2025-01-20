// /pages/api/get-authorized-emails.js
import { google } from "googleapis";
import Cors from 'cors';

// Configuração do CORS para permitir apenas o domínio do frontend
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  origin: 'https://surgical-brasil.on-fleek.app',
});

export default async function handler(req, res) {
  // Configuração CORS sem middleware externo
  await new Promise((resolve, reject) => {
    cors(req, res, (err) => {
      if (err) {
        console.error("Erro no CORS:", err);
        return reject(err);
      }
      resolve();
    });
  });

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_SHEETS_CREDENTIALS, 'base64').toString('utf-8'));
    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    await client.authorize();

    const sheets = google.sheets({ version: 'v4', auth: client });
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:A";

    const responseSheet = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = responseSheet.data.values;

    if (!rows || rows.length === 0) {
      return res.status(500).json({ success: false, error: "Nenhum dado encontrado na planilha." });
    }

    const authorizedEmails = rows.map(row => row[0].toLowerCase());
    return res.status(200).json({ success: true, emails: authorizedEmails });
  } catch (err) {
    console.error("Erro ao buscar e-mails autorizados:", err);
    return res.status(500).json({ success: false, error: "Erro interno ao buscar e-mails." });
  }
}
