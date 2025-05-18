/**
 * wallet-connector.js
 * Módulo para gerenciar a conexão com carteiras Web3
 */

import { getConfig } from '../modules/config.js';
import { isWeb3Compatible, formatWalletAddress, logAction } from '../utils/utils.js';

// Variáveis privadas do módulo
let web3Instance = null;
let walletAddress = null;
let walletBalance = null;
let walletChainId = null;
let isConnected = false;
let provider = null;

/**
 * Inicializa o conector de carteira
 * @returns {Promise<boolean>}
 */
async function initWalletConnector() {
  try {
    console.log("Inicializando conector de carteira...");
    
    // Verificar compatibilidade
    if (!isWeb3Compatible()) {
      console.error("Este navegador não suporta Web3");
      throw new Error("Navegador não compatível com Web3");
    }
    
    // Tentar usar o provedor da Metamask/Web3 se disponível
    if (window.ethereum) {
      provider = window.ethereum;
      console.log("Provedor Web3 encontrado:", provider);
    } else if (window.web3) {
      provider = window.web3.currentProvider;
      console.log("Provedor web3 legado encontrado");
    } else {
      console.error("Nenhum provedor Web3 encontrado");
      throw new Error("Provedor Web3 não encontrado");
    }
    
    // Criar instância Web3 com tratamento adequado para diferentes ambientes
    if (typeof Web3 !== 'undefined') {
      web3Instance = new Web3(provider);
    } else if (typeof web3 !== 'undefined') {
      web3Instance = new web3.constructor(provider);
    } else if (window.ethereum) {
      // Abordagem mais moderna com ethereum diretamente
      web3Instance = {
        eth: {
          getAccounts: async () => {
            return window.ethereum.request({ method: 'eth_accounts' });
          },
          request: async (params) => {
            return window.ethereum.request(params);
          }
        }
      };
    } else {
      throw new Error("Web3 não está disponível");
    }
    
    // Verificar se já há uma conta conectada
    try {
      const accounts = await getAccounts();
      if (accounts && accounts.length > 0) {
        walletAddress = accounts[0];
        await updateWalletInfo();
        isConnected = true;
        
        // Disparar evento de conexão
        dispatchConnectedEvent();
      }
    } catch (error) {
      console.warn("Nenhuma conta conectada:", error);
    }
    
    // Configurar listeners para eventos da carteira
    setupWalletEventListeners();
    
    return true;
  } catch (error) {
    console.error("Erro ao inicializar conector de carteira:", error);
    return false;
  }
}

/**
 * Configura os listeners para eventos da carteira
 * @returns {void}
 */
function setupWalletEventListeners() {
  // Escutar eventos de mudança de conta
  if (provider && provider.on) {
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);
  }
}

/**
 * Manipula a mudança de contas
 * @param {Array<string>} accounts - Lista de contas
 * @returns {void}
 */
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // Usuário desconectou a carteira
    handleDisconnect();
  } else if (accounts[0] !== walletAddress) {
    walletAddress = accounts[0];
    await updateWalletInfo();
    
    // Atualizar estado global da aplicação
    if (window.fleekAppState) {
      window.fleekAppState.isLoggedIn = true;
      window.fleekAppState.authMethod = 'wallet';
      window.fleekAppState.walletAddress = walletAddress;
      window.fleekAppState.userIdentifier = walletAddress;
      console.log("Estado global atualizado após conexão de wallet:", window.fleekAppState);
    }
    
    if (isConnected) {
      dispatchConnectedEvent();
    }
  }
}

/**
 * Manipula a mudança de rede
 * @param {string} chainId - ID da rede em formato hexadecimal
 * @returns {void}
 */
async function handleChainChanged(chainId) {
  walletChainId = chainId;
  
  // Converter chainId para formato decimal para exibição
  const networkId = parseInt(chainId, 16);
  console.log(`Rede alterada para: ${networkId}`);
  
  // Atualizar informações da carteira na nova rede
  await updateWalletInfo();
  
  // Disparar evento de mudança de rede
  const chainEvent = new CustomEvent('wallet:chainChanged', { 
    detail: { chainId: networkId } 
  });
  window.dispatchEvent(chainEvent);
}

/**
 * Manipula a desconexão da carteira
 * @returns {void}
 */
function handleDisconnect() {
  walletAddress = null;
  walletBalance = null;
  isConnected = false;
  
  // Disparar evento de desconexão
  const disconnectEvent = new CustomEvent('wallet:disconnected');
  window.dispatchEvent(disconnectEvent);
  
  console.log("Carteira desconectada");
}

/**
 * Conecta à carteira
 * @returns {Promise<string>} - Endereço da carteira conectada
 */
async function connectWallet() {
  try {
    if (!provider) {
      await initWalletConnector();
      if (!provider) {
        throw new Error("Não foi possível inicializar o provedor Web3");
      }
    }
    
    // Requisitar acesso à conta com tratamento para diferentes APIs
    let accounts = [];
    const methods = [
      // Método 1: API EIP-1193 (padrão moderno)
      async () => {
        if (provider.request) {
          return provider.request({ method: 'eth_requestAccounts' });
        }
        throw new Error("Método não suportado");
      },
      // Método 2: Web3 1.0
      async () => {
        if (web3Instance.eth.requestAccounts) {
          return web3Instance.eth.requestAccounts();
        }
        throw new Error("Método não suportado");
      },
      // Método 3: Fallback para enable
      async () => {
        if (provider.enable) {
          return provider.enable();
        }
        throw new Error("Método não suportado");
      },
      // Método 4: Último recurso - apenas verificar contas existentes
      async () => {
        const accounts = await getAccounts();
        if (accounts && accounts.length > 0) return accounts;
        throw new Error("Não foi possível solicitar acesso à carteira");
      }
    ];
    
    // Tentar cada método até um funcionar
    let lastError = null;
    for (const method of methods) {
      try {
        accounts = await method();
        if (accounts && accounts.length > 0) break;
      } catch (error) {
        lastError = error;
        console.warn("Tentativa de conexão falhou:", error.message);
      }
    }
    
    if (!accounts || accounts.length === 0) {
      throw lastError || new Error("Nenhuma conta autorizada");
    }
    
    walletAddress = accounts[0];
    await updateWalletInfo();
    isConnected = true;
    
    // Verificar se a carteira está autorizada
    await checkWalletAuthorization(walletAddress);
    
    // Disparar evento de conexão bem sucedida
    dispatchConnectedEvent();
    
    return walletAddress;
  } catch (error) {
    console.error("Erro ao conectar carteira:", error);
    
    // Disparar evento de falha na conexão
    const failEvent = new CustomEvent('wallet:connectionFailed', { 
      detail: { error: error.message } 
    });
    window.dispatchEvent(failEvent);
    
    throw error;
  }
}

/**
 * Obtém as contas disponíveis
 * @returns {Promise<Array<string>>}
 */
async function getAccounts() {
  if (!web3Instance || !web3Instance.eth) {
    throw new Error("Web3 não está inicializado");
  }
  
  try {
    let accounts;
    
    if (typeof web3Instance.eth.getAccounts === 'function') {
      accounts = await web3Instance.eth.getAccounts();
    } else if (web3Instance.eth.request) {
      accounts = await web3Instance.eth.request({ method: 'eth_accounts' });
    } else if (provider && provider.request) {
      accounts = await provider.request({ method: 'eth_accounts' });
    } else {
      throw new Error("Método de leitura de contas não disponível");
    }
    
    return accounts;
  } catch (error) {
    console.error("Erro ao obter contas:", error);
    return [];
  }
}

/**
 * Atualiza as informações da carteira
 * @returns {Promise<void>}
 */
async function updateWalletInfo() {
  if (!walletAddress || !web3Instance || !web3Instance.eth) {
    return;
  }
  
  try {
    // Obter saldo
    let balance;
    
    if (typeof web3Instance.eth.getBalance === 'function') {
      balance = await web3Instance.eth.getBalance(walletAddress);
    } else if (web3Instance.eth.request) {
      balance = await web3Instance.eth.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
    } else if (provider && provider.request) {
      balance = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      });
    }
    
    // Converter de Wei para Ether
    if (balance) {
      if (typeof web3Instance.utils !== 'undefined' && web3Instance.utils.fromWei) {
        walletBalance = web3Instance.utils.fromWei(balance, 'ether');
      } else if (typeof web3 !== 'undefined' && web3.utils && web3.utils.fromWei) {
        walletBalance = web3.utils.fromWei(balance, 'ether');
      } else {
        // Fallback manual (1 ether = 10^18 wei)
        walletBalance = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
      }
    }
    
    // Obter ID da rede atual
    if (!walletChainId) {
      if (provider && provider.chainId) {
        walletChainId = provider.chainId;
      } else if (provider && provider.request) {
        walletChainId = await provider.request({ method: 'eth_chainId' });
      } else if (web3Instance.eth.getChainId) {
        walletChainId = await web3Instance.eth.getChainId();
      }
    }
    
    logAction('wallet:info_updated', { 
      address: formatWalletAddress(walletAddress),
      chainId: walletChainId 
    });
  } catch (error) {
    console.error("Erro ao atualizar informações da carteira:", error);
  }
}

/**
 * Verifica se a carteira está autorizada
 * @param {string} address - Endereço da carteira
 * @returns {Promise<boolean>}
 */
async function checkWalletAuthorization(address) {
  try {
    console.log(`Verificando autorização para carteira: ${formatWalletAddress(address)}`);
    
    // Primeiro, verificar lista local de configuração
    const authorizedWallets = getConfig('authorizedWallets', []);
    if (authorizedWallets.length > 0) {
      const isAuthorized = authorizedWallets.some(wallet => 
        wallet.toLowerCase() === address.toLowerCase());
      
      if (isAuthorized) {
        console.log("Carteira autorizada na configuração local");
        return true;
      }
    }
    
    // Verificar no backend
    const response = await fetch("/api/get-authorized-wallets");
    if (!response.ok) {
      throw new Error(`Erro ao acessar o backend: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Verificar se a resposta contém a lista de carteiras
    if (!data.wallets || !Array.isArray(data.wallets)) {
      console.error("Formato inesperado do JSON retornado pelo backend:", data);
      throw new Error("Erro ao validar autorização da carteira");
    }
    
    // Verificar se a carteira está autorizada
    const authorized = data.wallets.some(wallet => 
      wallet.toLowerCase() === address.toLowerCase());
    
    console.log("Carteira autorizada?", authorized);
    
    if (!authorized) {
      throw new Error("Carteira não autorizada para acessar o sistema");
    }
    
    return true;
  } catch (error) {
    console.error("Erro na validação da carteira:", error);
    
    // Disparar evento de carteira não autorizada
    const authEvent = new CustomEvent('wallet:unauthorized', {
      detail: { error: error.message }
    });
    window.dispatchEvent(authEvent);
    
    throw error;
  }
}

/**
 * Dispara evento de carteira conectada
 * @returns {void}
 */
function dispatchConnectedEvent() {
  // Evento de carteira conectada
  const connectedEvent = new CustomEvent('wallet:connected', {
    detail: {
      address: walletAddress,
      balance: walletBalance,
      chainId: walletChainId
    }
  });
  window.dispatchEvent(connectedEvent);
  
  // Também disparar evento de autenticação para integrar com o fluxo de autenticação geral
  const authEvent = new CustomEvent('auth:login', {
    detail: {
      method: 'wallet',
      user: {
        publicAddress: walletAddress,
        balance: walletBalance,
        chainId: walletChainId
      }
    }
  });
  window.dispatchEvent(authEvent);
}

/**
 * Desconecta a carteira
 * @returns {Promise<boolean>}
 */
async function disconnectWallet() {
  try {
    // Nota: Nem todos os provedores suportam desconexão explícita
    if (provider && provider.disconnect) {
      await provider.disconnect();
    }
    
    handleDisconnect();
    return true;
  } catch (error) {
    console.error("Erro ao desconectar carteira:", error);
    return false;
  }
}

/**
 * Verifica se a carteira está conectada
 * @returns {boolean}
 */
function isWalletConnected() {
  // Verificação adicional para garantir que a carteira está realmente conectada
  if (!isConnected || !walletAddress) {
    return false;
  }
  
  // Verificar se o provedor está disponível
  if (!provider) {
    console.warn("Provedor Web3 não está disponível");
    isConnected = false;
    return false;
  }
  
  // Verificar o formato do endereço da carteira
  if (typeof walletAddress !== 'string' || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.warn("Formato de endereço de carteira inválido:", walletAddress);
    isConnected = false;
    return false;
  }
  
  // Verificação do estado do provider (especialmente importante para MetaMask)
  try {
    if (provider.isConnected && typeof provider.isConnected === 'function') {
      const providerConnected = provider.isConnected();
      if (!providerConnected) {
        console.warn("Provider reporta desconexão");
        isConnected = false;
        return false;
      }
    }
    
    // Verificação adicional para Metamask
    if (window.ethereum && window.ethereum.selectedAddress) {
      if (window.ethereum.selectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn("Endereço selecionado na Metamask não corresponde ao endereço armazenado");
        walletAddress = window.ethereum.selectedAddress; // Atualizar para o endereço atual
      }
    }
  } catch (e) {
    console.warn("Erro ao verificar estado de conexão do provider:", e);
  }
  
  return isConnected && walletAddress !== null;
}

/**
 * Retorna o endereço da carteira
 * @returns {string|null}
 */
function getWalletAddress() {
  // Verificação adicional para garantir que o endereço é válido
  if (walletAddress && typeof walletAddress === 'string' && walletAddress.startsWith('0x')) {
    return walletAddress;
  }
  return null;
}

/**
 * Retorna o saldo da carteira
 * @returns {string|null}
 */
function getWalletBalance() {
  return walletBalance;
}

// Exportar funções do módulo
export {
  initWalletConnector,
  connectWallet,
  disconnectWallet,
  getWalletAddress,
  isWalletConnected,
  getWalletChainId,
  restoreWalletConnection
};

// Adicionar listener para eventos de wallet
window.addEventListener('wallet:getAddress', (event) => {
  if (event.detail && typeof event.detail.callback === 'function') {
    event.detail.callback(walletAddress || '');
  }
});
