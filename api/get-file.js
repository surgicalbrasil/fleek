import { Magic } from "@magic-sdk/admin";
import crypto from "crypto";
import fetch from "node-fetch";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: "Token ausente." });
    }

    // Validar token Magic.Link
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    const userEmail = metadata.email;
    const authorizedEmails = ["vitorfelixyz@gmail.com"];
    if (!authorizedEmails.includes(userEmail)) {
      return res.status(403).json({ success: false, error: "Acesso negado." });
    }

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

