/**
 * utils.js
 * Utilitários compartilhados para o projeto
 */

/**
 * Cria um hash simples de uma string
 * @param {string} input - String para criar hash
 * @returns {string} - Hash resultante
 */
function simpleHash(input) {
  let hash = 0;
  if (!input || input.length === 0) return hash.toString(16);
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para inteiro de 32 bits
  }
  
  return hash.toString(16);
}

/**
 * Formata um endereço de carteira para exibição
 * @param {string} address - Endereço completo da carteira
 * @param {number} prefixLength - Comprimento do prefixo a manter
 * @param {number} suffixLength - Comprimento do sufixo a manter
 * @returns {string} - Endereço formatado
 */
function formatWalletAddress(address, prefixLength = 6, suffixLength = 4) {
  if (!address || address.length < (prefixLength + suffixLength + 3)) {
    return address;
  }
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}

/**
 * Gera um ID único
 * @returns {string} - ID único
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Formata tamanho de arquivo em bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @param {number} decimals - Número de casas decimais
 * @returns {string} - Tamanho formatado
 */
function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Verifica se o navegador é compatível com Web3
 * @returns {boolean} - Verdadeiro se o navegador é compatível
 */
function isWeb3Compatible() {
  return (typeof Web3 !== 'undefined' || 
          typeof web3 !== 'undefined' || 
          typeof window.ethereum !== 'undefined');
}

/**
 * Tenta copiar um texto para a área de transferência
 * @param {string} text - Texto a ser copiado
 * @returns {Promise<boolean>} - Verdadeiro se copiado com sucesso
 */
async function copyToClipboard(text) {
  try {
    if (!navigator.clipboard) {
      throw new Error("API de área de transferência não disponível");
    }
    
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Erro ao copiar para área de transferência:", error);
    return false;
  }
}

/**
 * Detecta o sistema operacional do usuário
 * @returns {string} - Nome do sistema operacional
 */
function detectOS() {
  const userAgent = window.navigator.userAgent;
  
  if (userAgent.indexOf('Windows') !== -1) return 'Windows';
  if (userAgent.indexOf('Mac') !== -1) return 'MacOS';
  if (userAgent.indexOf('Linux') !== -1) return 'Linux';
  if (userAgent.indexOf('Android') !== -1) return 'Android';
  if (userAgent.indexOf('iOS') !== -1) return 'iOS';
  
  return 'Desconhecido';
}

/**
 * Detecta o navegador do usuário
 * @returns {string} - Nome do navegador
 */
function detectBrowser() {
  const userAgent = window.navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') !== -1) return 'Chrome';
  if (userAgent.indexOf('Firefox') !== -1) return 'Firefox';
  if (userAgent.indexOf('Safari') !== -1) return 'Safari';
  if (userAgent.indexOf('Edge') !== -1) return 'Edge';
  if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) return 'Opera';
  
  return 'Desconhecido';
}

/**
 * Registra uma ação de log que pode ser enviada ao servidor
 * @param {string} action - Nome da ação
 * @param {Object} data - Dados adicionais da ação
 * @returns {void}
 */
function logAction(action, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    action,
    timestamp,
    data,
    userAgent: window.navigator.userAgent,
    platform: detectOS(),
    browser: detectBrowser()
  };
  
  console.log(`[LOG] ${action}`, logEntry);
  
  // Aqui poderia enviar o log para o servidor
  // fetch('/api/log', { method: 'POST', body: JSON.stringify(logEntry) });
}

// Exportar funções do módulo
export {
  simpleHash,
  formatWalletAddress,
  generateUUID,
  formatFileSize,
  isWeb3Compatible,
  copyToClipboard,
  detectOS,
  detectBrowser,
  logAction
};
