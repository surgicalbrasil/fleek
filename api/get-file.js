// /api/get-file.js
import { Magic } from "@magic-sdk/admin";
import crypto from "crypto";
import fetch from "node-fetch";
import { google } from "googleapis"; // Importa a biblioteca googleapis

export default async function handler(req, res) {
  // Configurar cabeçalhos de CORS
  res.setHeader("Access-Control-Allow-Origin", "https://surgical-brasil.on-fleek.app"); // Substitua pela URL do seu front-end
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    console.log("Requisição OPTIONS recebida.");
    return res.status(200).end();
  }

  try {
    const { token, fileName } = req.body;
    console.log(`Recebido token: ${token} e fileName: ${fileName}`);

    // Verificar se o token e fileName foram enviados
    if (!token || !fileName) {
      console.log("Token ou fileName ausentes.");
      return res.status(400).json({ success: false, error: "Token e nome do arquivo são obrigatórios." });
    }

    // Inicializar o Magic Admin SDK
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);
    console.log("Magic SDK inicializado.");

    // Validar o token Magic.Link
    const metadata = await magic.users.getMetadataByToken(token);
    console.log(`Metadata obtido: ${JSON.stringify(metadata)}`);

    if (!metadata || !metadata.email) {
      console.log("Token inválido ou expirado.");
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    const userEmail = metadata.email.toLowerCase();
    console.log(`Email do usuário: ${userEmail}`);

    // Inicializar o cliente do Google Sheets
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_SHEETS_CREDENTIALS, 'base64').toString('utf-8'));
    console.log("Credenciais do Google Sheets decodificadas.");

    const client = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    await client.authorize();
    console.log("Autorizado no Google Sheets.");

    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log("Cliente do Google Sheets inicializado.");

    // Definir o ID da planilha e o intervalo
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE || "Sheet1!A:A";
    console.log(`Spreadsheet ID: ${spreadsheetId}, Range: ${range}`);

    // Buscar os dados da planilha
    const responseSheet = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = responseSheet.data.values;
    console.log(`Número de e-mails obtidos: ${rows ? rows.length : 0}`);

    if (!rows || rows.length === 0) {
      console.error("Nenhum dado encontrado na planilha.");
      return res.status(500).json({ success: false, error: "Nenhum dado encontrado na planilha." });
    }

    // Extrair os emails e converter para minúsculas
    const authorizedEmailsFromSheet = rows.map(row => row[0].toLowerCase());
    console.log(`E-mails autorizados: ${authorizedEmailsFromSheet.join(", ")}`);

    // Verificar se o email do usuário está na lista autorizada
    if (!authorizedEmailsFromSheet.includes(userEmail)) {
      console.log("Acesso negado para o e-mail:", userEmail);
      return res.status(403).json({ success: false, error: "Acesso negado." });
    }

    // Link para o arquivo criptografado
    const encryptedFileUrl = process.env.ENCRYPTED_FILE_URL || "https://bafkreifax2ynmga3u5nbmh6ha2kvldh7gukopifulovh2ueaxcgajhhs7i.ipfs.flk-ipfs.xyz";
    console.log(`URL do arquivo criptografado: ${encryptedFileUrl}`);

    // Buscar o arquivo criptografado no IPFS
    const response = await fetch(encryptedFileUrl);
    if (!response.ok) {
      console.log("Erro ao acessar o arquivo criptografado.");
      throw new Error("Erro ao acessar o arquivo criptografado.");
    }

    const encryptedData = await response.buffer();
    console.log("Arquivo criptografado obtido.");

    // Descriptografar o arquivo
    const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    const IV = Buffer.from(process.env.ENCRYPTION_IV, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    console.log("Arquivo descriptografado.");

    // Configurar cabeçalhos para envio do PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    console.log("Cabeçalhos de resposta configurados.");

    // Enviar o PDF descriptografado
    return res.end(decryptedData);
  } catch (err) {
    console.error("Erro no backend:", err);

    // Garantir que os cabeçalhos de CORS estão definidos antes de enviar a resposta de erro
    res.setHeader("Access-Control-Allow-Origin", "https://surgical-brasil.on-fleek.app"); // Substitua pela URL do seu front-end
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
