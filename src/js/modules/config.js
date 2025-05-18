/**
 * config.js
 * Módulo para gerenciar configurações globais da aplicação
 */

// Configurações padrão
const defaultConfig = {
  env: 'production',
  apiBaseUrl: '/api',
  magicPublicKey: null,
  fileEncryptionEnabled: true,
  securityMeasuresEnabled: true,
  debugEnabled: false
};

// Configurações atuais
let currentConfig = { ...defaultConfig };

/**
 * Inicializa as configurações
 * @returns {Promise<Object>}
 */
async function initConfig() {
  try {
    console.log("Inicializando configurações...");
    
    // Tentar carregar configurações do backend
    await loadBackendConfig();
    
    // Aplicar configurações específicas do ambiente
    applyEnvironmentSpecificConfig();
    
    console.log("Configurações inicializadas:", currentConfig);
    return currentConfig;
  } catch (error) {
    console.error("Erro ao inicializar configurações:", error);
    return currentConfig;
  }
}

/**
 * Carrega configurações do backend
 * @returns {Promise<void>}
 */
async function loadBackendConfig() {
  try {
    const response = await fetch('/api/get-config');
    if (!response.ok) {
      throw new Error(`Erro ao carregar configurações: ${response.statusText}`);
    }
    
    const serverConfig = await response.json();
    
    // Verificar e validar dados recebidos
    if (!serverConfig.config) {
      throw new Error('Formato de configuração inválido');
    }
    
    // Aplicar configurações do servidor
    Object.assign(currentConfig, {
      magicPublicKey: serverConfig.config.magicPublicKey,
      apiKeyHash: serverConfig.config.apiKeyHash,
      authorizedWallets: serverConfig.config.authorizedWallets || [],
      debugEnabled: serverConfig.config.debugMode || false
    });
    
  } catch (error) {
    console.warn("Erro ao carregar configurações do backend, usando padrões:", error);
    // Fallback para ambiente de desenvolvimento
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.info("Ambiente de desenvolvimento detectado, usando configurações locais");
      currentConfig.env = 'development';
      currentConfig.debugEnabled = true;
    }
  }
}

/**
 * Aplica configurações específicas do ambiente
 * @returns {void}
 */
function applyEnvironmentSpecificConfig() {
  // Ajustar configurações baseadas no ambiente atual
  if (currentConfig.env === 'development') {
    currentConfig.securityMeasuresEnabled = false; // Facilitar testes de desenvolvimento
    currentConfig.magicPublicKey = currentConfig.magicPublicKey || 'pk_live_20134EF9B8F26232'; // Chave de desenvolvimento
  }
  
  // Detectar ambiente baseado na URL
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    currentConfig.env = 'development';
  } else if (window.location.hostname.includes('fleek.co') || 
             window.location.hostname.includes('fleek.xyz')) {
    currentConfig.env = 'production';
  }
  
  // Aplicar configurações baseadas em flags da URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('debug') && (urlParams.get('debug') === 'true' || urlParams.get('debug') === '1')) {
    currentConfig.debugEnabled = true;
  }
}

/**
 * Retorna o valor de uma configuração específica
 * @param {string} key - A chave da configuração
 * @param {*} defaultValue - Valor padrão caso a configuração não exista
 * @returns {*}
 */
function getConfig(key, defaultValue = null) {
  return currentConfig.hasOwnProperty(key) ? currentConfig[key] : defaultValue;
}

/**
 * Define o valor de uma configuração específica
 * @param {string} key - A chave da configuração
 * @param {*} value - O valor a ser definido
 * @returns {void}
 */
function setConfig(key, value) {
  currentConfig[key] = value;
  
  // Registrar alteração em modo debug
  if (currentConfig.debugEnabled) {
    console.log(`Configuração atualizada: ${key} = ${value}`);
  }
}

/**
 * Verifica se o ambiente é de desenvolvimento
 * @returns {boolean}
 */
function isDevelopment() {
  return currentConfig.env === 'development';
}

/**
 * Verifica se o modo de debug está ativado
 * @returns {boolean}
 */
function isDebugEnabled() {
  return currentConfig.debugEnabled === true;
}

// Exportar funções do módulo
export {
  initConfig,
  getConfig,
  setConfig,
  isDevelopment,
  isDebugEnabled
};
