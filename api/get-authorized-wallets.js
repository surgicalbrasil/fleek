// /pages/api/get-authorized-wallets.js
import { google } from "googleapis";
import Cors from 'cors';

// Configuração do CORS para permitir o domínio do frontend e desenvolvimento local
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  origin: ['https://surgicalbrasil.github.io/fleek/', 'http://localhost:3000', '*'],
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
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS is not defined in environment variables.');
    }
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
    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not defined in environment variables.');
    }
    const range = "Sheet1!B:B"; // Consultando a coluna B para wallets

    const responseSheet = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = responseSheet.data.values;

    if (!rows || rows.length === 0) {
      return res.status(500).json({ success: false, error: "Nenhum dado encontrado na planilha." });
    }

    const authorizedWallets = rows.map(row => row[0].toLowerCase()); // Convertendo para lowercase para comparação case-insensitive
    return res.status(200).json({ success: true, wallets: authorizedWallets });
  } catch (err) {
    console.error("Erro ao buscar wallets autorizadas:", err);
    return res.status(500).json({ success: false, error: "Erro interno ao buscar wallets." });
  }
}
