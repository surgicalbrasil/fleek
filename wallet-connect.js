// wallet-connect.js - Gerenciador de conexão de carteiras

// Configuração da chave da Alchemy
const ALCHEMY_API_KEY = "rW3MzqivxqHlGZPwxSMCs0hherD2pFsH";

// Estado da conexão
let provider = null;
let web3Instance = null;
let currentAccount = null;
let chainId = null;

// Configuração das opções do provedor para Web3Modal
const providerOptions = {
  // MetaMask é incluída por padrão (não precisa configurar)
  
  // WalletConnect
  walletconnect: {
    package: WalletConnectProvider.default,
    options: {
      rpc: {
        1: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        5: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        137: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      },
      chainId: 1,
      network: "mainnet"
    }
  },
    // Coinbase Wallet 
  coinbasewallet: {
    package: window.CoinbaseWalletSDK,
    options: {
      appName: "Confidential Viewer",
      rpc: {
        1: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        137: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      },
      chainId: 1,
      darkMode: false
    }
  }
};

// Inicializar Web3Modal
let web3Modal;

// Função para inicializar o modal
function initWeb3Modal() {
  web3Modal = new Web3Modal({
    cacheProvider: true, // Muito importante! Permite reconectar automaticamente
    theme: {
      background: "#f8f9fa",
      main: "#007bff",
      secondary: "#6c757d",
      border: "#e9ecef",
      hover: "#adb5bd"
    },
    providerOptions: providerOptions
  });
  
  console.log("Web3Modal inicializado com sucesso");
}

// Função para conectar à carteira
async function connectWallet() {
  try {
    console.log("Conectando carteira via Web3Modal...");

    // Inicializar o modal se ainda não foi inicializado
    if (!web3Modal) {
      initWeb3Modal();
    }
    
    // Conectar ao provedor
    provider = await web3Modal.connect();
    
    if (!provider) {
      throw new Error("Nenhum provedor selecionado");
    }
    
    // Configuração do Web3
    web3Instance = new Web3(provider);
    
    // Obter informação da rede conectada
    chainId = await web3Instance.eth.getChainId();
    console.log("Conectado à rede:", chainId);
    
    // Obter contas
    const accounts = await web3Instance.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      throw new Error("Não foi possível obter as contas da carteira");
    }
    
    currentAccount = accounts[0];
    console.log("Carteira conectada:", currentAccount);
    
    // Configurar eventos para mudanças na carteira
    setupEventListeners();
    
    return {
      account: currentAccount,
      chainId: chainId
    };
  } catch (error) {
    console.error("Erro ao conectar carteira:", error);
    throw error;
  }
}

// Função para desconectar carteira
async function disconnectWallet() {
  try {
    if (provider?.close) {
      await provider.close();
    }
    
    // Limpar cache
    await web3Modal.clearCachedProvider();
    
    // Resetar estado
    provider = null;
    web3Instance = null;
    currentAccount = null;
    chainId = null;
    
    console.log("Carteira desconectada com sucesso");
  } catch (error) {
    console.error("Erro ao desconectar carteira:", error);
  }
}

// Configurar event listeners para mudanças na carteira
function setupEventListeners() {
  if (!provider || !provider.on) {
    return;
  }
  
  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    console.log("Conta da carteira alterada:", accounts[0]);
    if (accounts.length === 0) {
      // Usuário desconectou a carteira de dentro da extensão
      disconnectWallet();
      // Disparar evento de desconexão
      document.dispatchEvent(new CustomEvent('walletDisconnected'));
    } else {
      currentAccount = accounts[0];
      // Disparar evento de mudança de conta
      document.dispatchEvent(new CustomEvent('walletAccountChanged', { 
        detail: { account: currentAccount } 
      }));
    }
  });
  
  // Subscribe to chainId change
  provider.on("chainChanged", (newChainId) => {
    console.log("Rede alterada:", newChainId);
    chainId = newChainId;
    // Disparar evento de mudança de rede
    document.dispatchEvent(new CustomEvent('walletChainChanged', { 
      detail: { chainId: chainId } 
    }));
  });
  
  // Subscribe to provider disconnection
  provider.on("disconnect", (error) => {
    console.log("Provedor desconectado:", error);
    disconnectWallet();
    document.dispatchEvent(new CustomEvent('walletDisconnected'));
  });
}

// Verificar se o usuário já conectou a carteira anteriormente
async function restoreConnection() {
  try {
    if (!web3Modal) {
      initWeb3Modal();
    }
    
    // Verificar se existe um provedor em cache
    if (web3Modal.cachedProvider) {
      console.log("Provedor em cache encontrado, restaurando conexão...");
      const connection = await connectWallet();
      return connection;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao restaurar conexão:", error);
    return null;
  }
}

// Função para verificar o saldo de ETH da carteira
async function getWalletBalance(address) {
  try {
    if (!web3Instance || !address) {
      throw new Error("Web3 ou endereço não disponível");
    }
    
    const balance = await web3Instance.eth.getBalance(address);
    return web3Instance.utils.fromWei(balance, 'ether');
  } catch (error) {
    console.error("Erro ao obter saldo:", error);
    throw error;
  }
}

// Função para formatar endereço da carteira
function formatWalletAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Exportar funções para uso global
window.walletConnect = {
  connect: connectWallet,
  disconnect: disconnectWallet,
  restore: restoreConnection,
  getBalance: getWalletBalance,
  formatAddress: formatWalletAddress,
  getCurrentAccount: () => currentAccount
};