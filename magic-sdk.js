// magic-sdk.js
// Módulo para gerenciamento do Magic SDK

// Variáveis que serão exportadas
let magic = null;
let magicPubKey = null;
let isLoggedInWithMagic = false;
let userMetadata = null;

/**
 * Inicializa o Magic SDK obtendo a chave da API
 * @returns {Promise<Magic>} Instância do Magic SDK
 */
async function initMagicSDK() {
  try {
    // Tenta buscar a chave do backend, com fallback para desenvolvimento local
    const response = await fetch("/api/get-magic-key").catch(err => {
      console.warn("Erro ao buscar chave do Magic SDK no servidor, usando fallback:", err);
      return null;
    });
    
    if (response && response.ok) {
      const data = await response.json();
      magicPubKey = data.magicPublicKey;
    } else {
      // Chave de fallback para desenvolvimento local
      console.warn("Usando chave Magic SDK de desenvolvimento");
      magicPubKey = "pk_live_20134EF9B8F26232"; // Usando a chave do .env ou .env.example
    }
    
    if (!magicPubKey) {
      console.error("Chave Magic SDK não encontrada. Verificando se a biblioteca está carregada...");
      if (typeof Magic === 'undefined') {
        console.error("A biblioteca Magic SDK não foi carregada corretamente");
        alert("Erro ao carregar o Magic SDK. Verifique sua conexão com a internet e tente novamente.");
        return null;
      }
      throw new Error("Magic SDK Public Key não disponível");
    }
    
    // Inicializar o Magic SDK com a chave
    try {
      magic = new Magic(magicPubKey);
      console.log("Magic SDK inicializado com sucesso");
      return magic;
    } catch (error) {
      console.error("Erro ao inicializar Magic SDK:", error);
      alert("Erro ao inicializar o serviço de autenticação. Tente novamente mais tarde.");
      return null;
    }
  } catch (error) {
    console.error("Erro na inicialização do Magic SDK:", error);
    return null;
  }
}

/**
 * Verifica se o usuário está logado com Magic
 * @returns {Promise<boolean>} Status de login
 */
async function isMagicLoggedIn() {
  if (!magic) {
    await initMagicSDK();
    if (!magic) return false;
  }
  
  try {
    isLoggedInWithMagic = await magic.user.isLoggedIn();
    return isLoggedInWithMagic;
  } catch (error) {
    console.error("Erro ao verificar status de login do Magic:", error);
    return false;
  }
}

/**
 * Obtém os metadados do usuário logado
 * @returns {Promise<Object|null>} Metadados do usuário ou null
 */
async function getMagicUserMetadata() {
  if (!magic) {
    await initMagicSDK();
    if (!magic) return null;
  }
  
  if (!isLoggedInWithMagic) {
    const loggedIn = await isMagicLoggedIn();
    if (!loggedIn) return null;
  }
  
  try {
    userMetadata = await magic.user.getMetadata();
    return userMetadata;
  } catch (error) {
    console.error("Erro ao obter metadados do usuário:", error);
    return null;
  }
}

/**
 * Faz login usando o Magic SDK com email
 * @param {string} email - Email do usuário
 * @returns {Promise<boolean>} Status de sucesso do login
 */
async function loginWithMagic(email) {
  if (!magic) {
    await initMagicSDK();
    if (!magic) return false;
  }
  
  try {
    showLoading("Enviando link mágico...");
    
    await magic.auth.loginWithMagicLink({ email });
    
    isLoggedInWithMagic = await magic.user.isLoggedIn();
    if (isLoggedInWithMagic) {
      userMetadata = await magic.user.getMetadata();
      hideLoading();
      return true;
    } else {
      hideLoading();
      return false;
    }
  } catch (error) {
    console.error("Erro no login com Magic:", error);
    hideLoading();
    return false;
  }
}

/**
 * Faz logout do Magic SDK
 * @returns {Promise<boolean>} Status de sucesso do logout
 */
async function logoutFromMagic() {
  if (!magic) return true;
  
  try {
    await magic.user.logout();
    isLoggedInWithMagic = false;
    userMetadata = null;
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout do Magic:", error);
    return false;
  }
}

// Funções auxiliares para a UI
function showLoading(message) {
  const loadingElement = document.getElementById('loading');
  const loadingMessageElement = document.getElementById('loading-message');
  
  if (loadingMessageElement) {
    loadingMessageElement.textContent = message || "Carregando...";
  }
  
  if (loadingElement) {
    loadingElement.style.display = 'flex';
  }
}

function hideLoading() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

// Exportar as funções e variáveis que serão usadas em outros arquivos
window.magicSDK = {
  initMagicSDK,
  isMagicLoggedIn,
  getMagicUserMetadata,
  loginWithMagic,
  logoutFromMagic,
  get magic() { return magic; },
  get isLoggedIn() { return isLoggedInWithMagic; },
  get userMetadata() { return userMetadata; }
};
