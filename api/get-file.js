import { Magic } from "@magic-sdk/admin";

export default async function handler(req, res) {
  // Permitir todas as origens (solução temporária)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder a requisições preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // 1. Validar o corpo da requisição
    if (!req.body || !req.body.token || !req.body.fileName) {
      return res.status(400).json({ success: false, error: "Requisição inválida. Faltando dados." });
    }

    // 2. Pegar o token e o nome do arquivo do corpo da requisição
    const { token, fileName } = req.body;

    // 3. Inicializar o Magic Admin SDK
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // 4. Validar o token e obter os metadados do usuário
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido ou expirado." });
    }

    // 5. O e-mail do usuário que pediu acesso
    const userEmail = metadata.email;

    // 6. Verificar se o e-mail consta na lista de NDA
    const ndaList = [
      "vitorfelixyz@gmail.com",
      "[email protected]",
      "maria@example.com"
    ];
    if (!ndaList.includes(userEmail)) {
      return res.status(403).json({ success: false, error: "Acesso negado. E-mail não está na NDA." });
    }

    // 7. Montar o link do arquivo no Fleek
    const ipfsHash = "bafkreihnbx52e6ubbibtx4b3psmgr4cor5hhrtbafrewjp2z2xfvuxjpfy"; // Substitua pelo seu hash IPFS correto
    const fileUrl = `https://ipfs.fleek.co/ipfs/${ipfsHash}/${fileName}`;

    // 8. Logar o acesso para auditoria (opcional)
    console.log(`Acesso permitido: ${userEmail} -> ${fileName}`);

    // 9. Retornar o link do arquivo ao front-end
    return res.status(200).json({ success: true, fileUrl });
  } catch (err) {
    console.error("Erro no backend:", err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor." });
  }
}
