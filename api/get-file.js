// /pages/api/get-file.js
import { Magic } from "@magic-sdk/admin";
import crypto from "crypto";
import fetch from "node-fetch";
import { google } from "googleapis";
import Cors from 'cors';

// Inicializa o middleware CORS para permitir apenas o domínio especificado
const cors = Cors({
  methods: ['POST', 'OPTIONS'], // Métodos permitidos
  origin: 'https://surgical-brasil.on-fleek.app', // Permitir apenas o domínio especificado
  allowedHeaders: ['Content-Type'], // Cabeçalhos permitidos
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

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { token, fileName } = req.body;

    if (!token || !fileName) {
      return res.status(400).json({ success: false, error: "Token e nome do arquivo são obrigatórios." });
    }

    // Magic SDK: Validação do token
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);
    const metadata = await magic.users.getMetadataByToken(token);

    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    const userEmail = metadata.email.toLowerCase();

    // Google Sheets: Configuração e leitura dos e-mails autorizados
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

    const authorizedEmailsFromSheet = rows.map(row => row[0].toLowerCase());

    if (!authorizedEmailsFromSheet.includes(userEmail)) {
      return res.status(403).json({ success: false, error: "Acesso negado." });
    }

    // Buscar e descriptografar o arquivo
    const encryptedFileUrl = process.env.ENCRYPTED_FILE_URL || "https://github.com/surgicalbrasil/Encrypted/raw/refs/heads/main/Paper.encrypted";
    const response = await fetch(encryptedFileUrl);

    if (!response.ok) {
      throw new Error("Erro ao acessar o arquivo criptografado.");
    }

    const encryptedData = await response.buffer();
    const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const IV = Buffer.from(process.env.ENCRYPTION_IV, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    return res.end(decryptedData);
  } catch (err) {
    console.error("Erro no backend:", err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
