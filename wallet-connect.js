// wallet-connect.js - Gerenciador de conexão de carteiras

// Configuração da chave da Infura (anteriormente usávamos Alchemy)
const INFURA_API_KEY = "82e06acf7f54495f873137ea30e21300";

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
        1: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        5: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
        137: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
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
        1: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        137: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`
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
  try {
    console.log("Verificando disponibilidade do Web3Modal...");
    
    // Verificar se o objeto Web3Modal existe globalmente
    if (typeof Web3Modal === 'undefined') {
      console.error("Web3Modal não está disponível. Verifique se a biblioteca foi carregada corretamente.");
      
      // Tentar usar window.ethereum diretamente se estiver disponível
      if (window.ethereum) {
        console.log("Web3Modal não está disponível, mas ethereum foi detectado. Tentando usar diretamente...");
        return true; // Continue mesmo sem Web3Modal
      } else {
        throw new Error("Web3Modal não está disponível");
      }
    }
    
    console.log("Criando instância do Web3Modal...");
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
  } catch (error) {
    console.error("Erro ao inicializar Web3Modal:", error);
    alert("Erro ao inicializar o seletor de carteiras. Por favor, tente novamente mais tarde ou entre em contato com o suporte.");
    throw error;
  }
}

// Função para conectar à carteira
async function connectWallet() {
  try {
    console.log("Conectando carteira...");

    // Verificar se o objeto Web3 está disponível
    if (typeof Web3 === 'undefined') {
      console.error("Web3 não está disponível");
      alert("A biblioteca Web3 não está disponível. Verifique sua conexão com a internet e tente novamente.");
      throw new Error("Web3 não está disponível");
    }

    // Inicializar o modal se ainda não foi inicializado
    if (!web3Modal) {
      console.log("Inicializando Web3Modal...");
      try {
        initWeb3Modal();
      } catch (error) {
        console.error("Falha ao inicializar Web3Modal, tentando conectar diretamente com Metamask...");
      }
    }
    
    // Verificar se devemos usar o provider do navegador diretamente (fallback)
    console.log("Solicitando conexão ao provedor...");
    
    // Se o web3Modal não estiver disponível, tente usar ethereum diretamente
    if (!web3Modal && window.ethereum) {
      console.log("Usando ethereum diretamente...");
      provider = window.ethereum;
      await window.ethereum.request({ method: 'eth_requestAccounts' });
    } else if (web3Modal) {
      provider = await web3Modal.connect();
    } else {
      throw new Error("Nenhum provedor Web3 disponível");
    }
    
    if (!provider) {
      console.error("Nenhum provedor selecionado");
      throw new Error("Nenhum provedor selecionado");
    }
    
    // Configuração do Web3
    console.log("Configurando instância Web3...");
    web3Instance = new Web3(provider);
    
    // Obter informação da rede conectada
    console.log("Obtendo informações da rede...");
    chainId = await web3Instance.eth.getChainId();
    console.log("Conectado à rede:", chainId);
    
    // Obter contas
    console.log("Obtendo contas da carteira...");
    const accounts = await web3Instance.eth.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      console.error("Não foi possível obter as contas da carteira");
      throw new Error("Não foi possível obter as contas da carteira");
    }
    
    currentAccount = accounts[0];
    console.log("Carteira conectada:", currentAccount);
    
    // Configurar eventos para mudanças na carteira
    console.log("Configurando event listeners...");
    setupEventListeners();
    
    return {
      account: currentAccount,
      chainId: chainId
    };  } catch (error) {
    console.error("Erro ao conectar carteira:", error);
    
    // Mensagens de erro mais detalhadas para ajudar na depuração
    let errorMessage = "Erro ao conectar carteira. ";
    
    if (error.message.includes("Web3Modal is not a constructor")) {
      errorMessage += "A biblioteca Web3Modal não foi carregada corretamente. Por favor, recarregue a página e tente novamente.";
    } else if (error.message.includes("Web3 não está disponível")) {
      errorMessage += "A biblioteca Web3 não está disponível. Verifique sua conexão com a internet e tente novamente.";
    } else if (error.message.includes("User rejected") || error.message.includes("User denied")) {
      errorMessage += "Você rejeitou a solicitação de conexão.";
    } else if (error.message.includes("Already processing")) {
      errorMessage += "Uma conexão já está em processamento. Por favor, aguarde ou recarregue a página.";
    } else {
      errorMessage += "Verifique se você tem uma carteira Web3 instalada e tente novamente.";
    }
    
    alert(errorMessage);
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

// Verificar disponibilidade das bibliotecas e configurar fallback
window.addEventListener('load', function() {
  console.log("Verificando disponibilidade das bibliotecas Web3...");
  
  // Verificar Web3Modal
  if (typeof Web3Modal === 'undefined') {
    console.warn("Web3Modal não detectado. Configurando fallback...");
    
    // Criar uma versão simples do Web3Modal que usa diretamente o provider do navegador
    window.Web3Modal = class FallbackWeb3Modal {
      constructor(options) {
        this.options = options;
        this.cachedProvider = localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER');
        console.log("FallbackWeb3Modal criado");
      }
      
      async connect() {
        if (window.ethereum) {
          console.log("Solicitando contas via ethereum...");
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          localStorage.setItem('WEB3_CONNECT_CACHED_PROVIDER', 'injected');
          return window.ethereum;
        } else {
          throw new Error("Nenhum provider Web3 encontrado");
        }
      }
      
      async clearCachedProvider() {
        localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
      }
    };
    
    console.log("Web3Modal substituído por fallback");
  }
  
  // Verificar outras bibliotecas necessárias
  console.log("Verificação de bibliotecas Web3:");
  console.log("- Web3 disponível:", typeof Web3 !== 'undefined');
  console.log("- ethereum disponível:", typeof window.ethereum !== 'undefined');
  console.log("- WalletConnectProvider disponível:", typeof WalletConnectProvider !== 'undefined');
  console.log("- CoinbaseWalletSDK disponível:", typeof CoinbaseWalletSDK !== 'undefined');
});

// Função para conectar diretamente com Metamask (fallback)
async function connectDirectWithMetamask() {
  try {
    console.log("Tentando conexão direta com Metamask...");
    
    if (!window.ethereum) {
      throw new Error("Metamask não está instalado");
    }
    
    // Solicitar contas
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("Nenhuma conta disponível");
    }
    
    // Configurar estado
    provider = window.ethereum;
    web3Instance = new Web3(provider);
    currentAccount = accounts[0];
    chainId = await web3Instance.eth.getChainId();
    
    console.log("Conectado diretamente à Metamask:", currentAccount);
    
    // Configurar eventos
    setupEventListeners();
    
    return {
      account: currentAccount,
      chainId: chainId
    };
  } catch (error) {
    console.error("Erro ao conectar diretamente com Metamask:", error);
    throw error;
  }
}

// Exportar funções para uso global
window.walletConnect = {
  connect: connectWallet,
  connectDirect: connectDirectWithMetamask, // Adicionar método alternativo
  disconnect: disconnectWallet,
  restore: restoreConnection,
  getBalance: getWalletBalance,
  formatAddress: formatWalletAddress,
  getCurrentAccount: () => currentAccount
};