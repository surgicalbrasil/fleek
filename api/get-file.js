import { Magic } from "@magic-sdk/admin";
import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  // Lista de domínios autorizados
  const allowedOrigins = ["https://surgical-brasil.on.fleek.app"];

  // Verificar se a origem da requisição está permitida
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Verificar se o token foi enviado
    const { token } = req.body;
    if (!token) {
      console.error("Requisição sem token.");
      return res.status(400).json({ success: false, error: "Token ausente." });
    }

    console.log("Token recebido:", token);

    // Inicializar o Magic Admin SDK
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // Validar o token Magic.Link
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata || !metadata.email) {
      console.error("Token inválido ou expirado.");
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    console.log("E-mail validado:", metadata.email);

    // Verificar se o e-mail está autorizado
    const userEmail = metadata.email;
    const authorizedEmails = ["vitorfelixyz@gmail.com", "surgical.brasil@gmail.com"];
    if (!authorizedEmails.includes(userEmail)) {
      console.error("E-mail não autorizado:", userEmail);
      return res.status(403).json({ success: false, error: "Acesso negado." });
    }

    console.log("E-mail autorizado. Enviando arquivo...");

    // Link para o arquivo criptografado
    const encryptedFileUrl = "https://bafkreifax2ynmga3u5nbmh6ha2kvldh7gukopifulovh2ueaxcgajhhs7i.ipfs.flk-ipfs.xyz";

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
