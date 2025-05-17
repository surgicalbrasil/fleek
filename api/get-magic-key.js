// Endpoint para fornecer a chave pública do Magic SDK de forma segura

import Cors from 'cors';

// Configuração do CORS para permitir apenas o domínio do frontend
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  origin: 'https://surgicalbrasil.github.io/fleek/',
});

export default async function handler(req, res) {
  // Configuração CORS
  await new Promise((resolve, reject) => {
    cors(req, res, (err) => {
      if (err) {
        console.error("Erro no CORS:", err);
        return reject(err);
      }
      resolve();
    });
  });

  // Se for uma solicitação OPTIONS (preflight), responda com sucesso
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  // Buscar a Magic Public Key das variáveis de ambiente
  const magicPublicKey = process.env.MAGIC_PUBLIC_KEY;
  
  // Verificar se a chave existe
  if (!magicPublicKey) {
    return res.status(500).json({ error: 'Configuração do servidor ausente' });
  }
  
  // Retorna apenas a chave pública
  res.status(200).json({
    magicPublicKey: magicPublicKey
  });
}
