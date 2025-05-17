// wallet-connect.js - Gerenciador de conexão de carteiras

// Configuração segura para APIs
// A API Key é obtida do backend para não expor no frontend
let apiKey = null; // Será preenchido assincronamente

// Função para obter configurações seguras do servidor
async function getSecureConfig() {
  try {
    const response = await fetch('/api/get-config');
    if (!response.ok) {
      console.error('Erro ao obter configuração:', response.statusText);
      return null;
    }
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Falha ao obter configuração:', error);
    return null;
  }
}

// Inicializar configurações quando a página carregar
window.addEventListener('load', async function() {
  try {
    const config = await getSecureConfig();
    if (config && config.config && config.config.apiKeyHash) {
      // Usando o hash da API key ao invés da key completa
      apiKey = config.config.apiKeyHash;
      console.log('Configurações carregadas com sucesso');
    } else {
      console.warn('Não foi possível obter as configurações do servidor');
    }
  } catch (error) {
    console.error('Erro ao inicializar configurações:', error);
  }
});

// Estado da conexão
let provider = null;
let web3Instance = null;
let currentAccount = null;
let chainId = null;

// Configuração simplificada - apenas MetaMask
const providerOptions = {
  // Deixar vazio para usar apenas MetaMask
  // MetaMask é incluída por padrão, sem necessidade de configuração adicional
};

// Função para verificar se a MetaMask está disponível
function checkMetaMaskAvailability() {
  try {
    console.log("Verificando disponibilidade da MetaMask...");
    
    if (window.ethereum) {
      console.log("MetaMask detectada ✅");
      return true;
    } else {
      console.error("MetaMask não está disponível. Por favor, instale a extensão MetaMask.");
      return false;
    }
  } catch (error) {
    console.error("Erro ao verificar disponibilidade da MetaMask:", error);
    return false;
  }
}

// Função para conectar à carteira (apenas MetaMask)
async function connectWallet() {
  try {
    console.log("Conectando carteira (MetaMask)...");

    // Verificar se o objeto Web3 está disponível
    if (typeof Web3 === 'undefined') {
      console.error("Web3 não está disponível");
      alert("A biblioteca Web3 não está disponível. Verifique sua conexão com a internet e tente novamente.");
      throw new Error("Web3 não está disponível");
    }

    // Verificar se a MetaMask está instalada
    if (!window.ethereum) {
      console.error("MetaMask não está instalada");
      alert("MetaMask não está instalada. Por favor, instale a extensão MetaMask para continuar.");
      throw new Error("MetaMask não está instalada");
    }
    
    console.log("Solicitando acesso à MetaMask...");
    
    // Conectar diretamente via MetaMask
    provider = window.ethereum;
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
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

// Função para desconectar carteira (MetaMask)
async function disconnectWallet() {
  try {
    // Nota: MetaMask não tem uma função nativa de "disconnect"
    // Só podemos limpar nosso estado local
    
    // Resetar estado
    provider = null;
    web3Instance = null;
    currentAccount = null;
    chainId = null;
    
    // Limpar qualquer armazenamento local
    localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
    
    console.log("Estado da carteira resetado com sucesso");
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

// Verificar se o usuário já está conectado com a MetaMask
async function restoreConnection() {
  try {
    // Verificar se a MetaMask está disponível
    if (!window.ethereum) {
      console.log("MetaMask não está disponível para restauração");
      return null;
    }
    
    // Verificar se há contas já conectadas na MetaMask
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    
    if (accounts && accounts.length > 0) {
      console.log("Conta da MetaMask já conectada, restaurando conexão...");
      // Usar a conexão existente
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

// Verificar disponibilidade da MetaMask ao carregar
window.addEventListener('load', function() {
  console.log("Verificando disponibilidade da MetaMask...");
  
  if (window.ethereum) {
    console.log("MetaMask disponível ✅");
  } else {
    console.warn("MetaMask não detectada ❌");
    alert("MetaMask não detectada. Para usar a funcionalidade de carteira, por favor instale a extensão MetaMask.");
  }
  
  // Verificar Web3
  console.log("Web3 disponível:", typeof Web3 !== 'undefined' ? "Sim ✅" : "Não ❌");
});

// Exportar funções para uso global
window.walletConnect = {
  connect: connectWallet,
  disconnect: disconnectWallet,
  restore: restoreConnection,
  getBalance: getWalletBalance,
  formatAddress: formatWalletAddress,
  getCurrentAccount: () => currentAccount
};