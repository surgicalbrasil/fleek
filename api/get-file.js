// /api/get-file.js
import { Magic } from "@magic-sdk/admin";
import crypto from "crypto";
import fetch from "node-fetch";
import { google } from "googleapis"; // Importa a biblioteca googleapis

export default async function handler(req, res) {
  // CORS permissivo (voltar ao esquema original)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { token } = req.body;

    // Verificar se o token foi enviado
    if (!token) {
      return res.status(400).json({ success: false, error: "Token ausente." });
    }

    // Inicializar o Magic Admin SDK
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // Validar o token Magic.Link
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    const userEmail = metadata.email.toLowerCase(); // Converte para minúsculas para consistência

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
    if (!authorizedEmailsFromSheet.includes(userEmail)) {
      return res.status(403).json({ success: false, error: "Acesso negado." });
    }

    // Link para o arquivo criptografado
    const encryptedFileUrl = process.env.ENCRYPTED_FILE_URL || "https://bafkreifax2ynmga3u5nbmh6ha2kvldh7gukopifulovh2ueaxcgajhhs7i.ipfs.flk-ipfs.xyz";

    // Buscar o arquivo criptografado no IPFS
    const response = await fetch(encryptedFileUrl);
    if (!response.ok) {
      throw new Error("Erro ao acessar o arquivo criptografado.");
    }

    const encryptedData = await response.buffer();

    // Descriptografar o arquivo
    const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const IV = Buffer.from(process.env.ENCRYPTION_IV, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // Configurar cabeçalhos para envio do PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=Paper.pdf");

    // Enviar o PDF descriptografado
    return res.end(decryptedData);
  } catch (err) {
    console.error("Erro no backend:", err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
