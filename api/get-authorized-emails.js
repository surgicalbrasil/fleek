// /pages/api/get-authorized-emails.js
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
    
    // Buscando dados de toda a planilha para ter mais flexibilidade
    const sheetRange = "Sheet1!A1:Z1000"; // Range amplo para obter mais dados da planilha
    const responseSheet = await sheets.spreadsheets.values.get({ 
      spreadsheetId, 
      range: sheetRange 
    });
    
    const allRows = responseSheet.data.values;
    if (!allRows || allRows.length === 0) {
      return res.status(500).json({ success: false, error: "Nenhum dado encontrado na planilha." });
    }
    
    console.log("Amostra de linhas da planilha:", JSON.stringify(allRows.slice(0, 3)));
    
    // Verificando se o email está na coluna C (índice 2)
    const authorizedEmails = allRows
      .filter(row => row && row.length > 2 && row[2])  // Certificar que existe coluna C (índice 2)
      .map(row => row[2].toLowerCase())                // Pegar valor da coluna C e normalizar
      .filter(email => email && email.trim() !== '');  // Remover valores vazios
    
    console.log("Emails autorizados (amostra):", authorizedEmails.slice(0, 5));
    
    return res.status(200).json({ success: true, emails: authorizedEmails });
  } catch (err) {
    console.error("Erro ao buscar e-mails autorizados:", err);
    return res.status(500).json({ success: false, error: "Erro interno ao buscar e-mails." });
  }
}
