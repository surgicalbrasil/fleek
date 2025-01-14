// api/get-file.js

import { Magic } from '@magic-sdk/admin';  // Biblioteca do Magic.Link (Admin)
import { NextResponse } from 'next/server'; // Se estiver usando Edge Functions, ou use normal exports

// Se estiver usando a Vercel Edge, a sintaxe é um pouco diferente. 
// Mas vamos supor que você use a Vercel Serverless normal (Node.js):
export default async function handler(req, res) {
  try {
    // 1. Pegar o token que veio do front-end
    const { token, fileName } = req.body;

    // 2. Inicializa o Magic Admin com sua SECRET KEY
    //    Essa key deve estar armazenada em variáveis de ambiente (process.env.MAGIC_SECRET_KEY)
    const magic = new Magic(process.env.MAGIC_SECRET_KEY);

    // 3. Validar o token
    const metadata = await magic.users.getMetadataByToken(token);
    if (!metadata || !metadata.email) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const userEmail = metadata.email;

    // 4. Verificar NDA
    //    Aqui é onde você checa se userEmail está na sua lista de NDAs
    //    Exemplo pseudo-lógico:
    const ndaList = ['[email protected]', '[email protected]']; // Exemplo fixo
    if (!ndaList.includes(userEmail)) {
      return res.status(403).json({ error: 'Acesso negado. NDA não encontrado.' });
    }

    // 5. LOG de acesso (exemplo simples, sem Sheets)
    console.log(`${new Date().toISOString()} - ${userEmail} acessou o arquivo ${fileName}`);

    // 6. Se chegar aqui, o usuário está liberado
    //    Você pode retornar o link do arquivo no Fleek (IPFS) ou
    //    mandar outro tipo de resposta. Exemplo:
    const fileUrl = `https://ipfs.fleek.co/ipfs/SEU_HASH_EXEMPLO/${fileName}`;
    
    return res.status(200).json({ success: true, fileUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
