import { Magic } from "@magic-sdk/admin";

export default async function handler(req, res) {
  try {
    // 1. Pegamos do body o 'token' (Magic.Link) e 'fileName' (nome do arquivo)
    const { token, fileName } = req.body;

    // 2. Inicializamos o Magic Admin SDK com a SECRET KEY
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // 3. Validamos o token, obtendo os dados do usuário (especialmente e-mail)
    const metadata = await magic.users.getMetadataByToken(token);

    // Se deu erro ou não veio e-mail, bloqueamos
    if (!metadata || !metadata.email) {
      return res.status(401).json({ success: false, error: "Token inválido" });
    }

    // 4. O e-mail do usuário que pediu acesso
    const userEmail = metadata.email;

    // 5. Verificar se esse e-mail consta na 'lista de NDA'
    const ndaList = ["vitorfelixyz@gmail.com","[email protected]"
      "[email protected]",    // Exemplo
      "maria@example.com"     // Exemplo
      // ... adicione quantos precisar
    ];
    if (!ndaList.includes(userEmail)) {
      return res.status(403).json({ success: false, error: "Acesso negado. E-mail não está na NDA." });
    }

    // 6. Se chegou aqui, então o usuário é autorizado.
    //    Vamos retornar o link do arquivo no Fleek.
    //    Substitua <SEU_HASH> pelo hash do IPFS gerado quando você subiu o Paper.pdf no Fleek.
    const ipfsHash = "<bafkreihnbx52e6ubbibtx4b3psmgr4cor5hhrtbafrewjp2z2xfvuxjpfy>";  

    // Exemplo: se o front-end pediu 'Paper.pdf', montamos a URL final:
    // Normalmente fica algo como https://ipfs.fleek.co/ipfs/<hash>/Paper.pdf
    const fileUrl = `https://ipfs.fleek.co/ipfs/${ipfsHash}/${fileName}`;

    // 7. (Opcional) Logar o acesso para auditoria
    console.log(`Acesso permitido: ${userEmail} -> ${fileName}`);

    // 8. Retornar ao front-end: "deu certo" + link para o arquivo
    return res.status(200).json({ success: true, fileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: "Erro interno no servidor" });
  }
}

