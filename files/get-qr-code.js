// /pages/api/get-qr-code.js
import { Magic } from "@magic-sdk/admin";
import Cors from "cors";

// Inicializa o middleware CORS para permitir apenas o domínio especificado
const cors = Cors({
  methods: ["POST", "OPTIONS"],
  origin: "https://surgical-brasil.on-fleek.app",
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Função para executar o middleware CORS
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // Executa o middleware CORS
  await runMiddleware(req, res, cors);

  // Lidar com requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    // Inicializa o Magic SDK com a chave secreta
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // Valida o token e obtém os metadados do usuário
    const metadata = await magic.users.getMetadataByToken(token);

    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    // Gerar QR code dinâmico
    // Aqui estamos usando um URL fixo fornecido, mas você pode implementar lógica para gerar URLs dinâmicas
    const dynamicQrCodeUrl = "https://gotas.social/show_qr/1738063390950x857811700764901400";

    return res.status(200).json({ success: true, qrCode: dynamicQrCodeUrl });
  } catch (err) {
    console.error("Erro no backend /get-qr-code:", err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
