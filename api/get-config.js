// Endpoint para fornecer dados de configuração de forma segura
// A API Key está configurada nas variáveis de ambiente no Vercel
import crypto from 'crypto';

export default function handler(req, res) {
  // Configurar CORS adequadamente para produção
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Se for uma solicitação OPTIONS (preflight), responda com sucesso
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  
  // Buscar a API key das variáveis de ambiente
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('API_KEY is not defined in environment variables.');
  }
  
  // Retorna dados de configuração sem expor a API key diretamente
  res.status(200).json({
    provider: 'metamask',
    timestamp: new Date().toISOString(),
    // Fornecer apenas dados necessários para o frontend
    config: {
      apiKeyHash: crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 10),
      network: 'mainnet'
    }
  });
}
