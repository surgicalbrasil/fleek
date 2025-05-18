/**
 * auth.js
 * Módulo de autenticação e gerenciamento de usuários
 */

// Variáveis do módulo
let magic = null;
let magicPubKey = null;
let isLoggedIn = false;
let userEmail = null;
let userMetadata = null;

/**
 * Inicializa o Magic SDK 
 * @returns {Promise<void>}
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
        throw new Error("Magic SDK não disponível");
      }
      throw new Error("Magic SDK Public Key não disponível");
    }
    
    magic = new Magic(magicPubKey);
    console.log("Magic SDK inicializado com sucesso");
    
    // Verificamos se o usuário já está logado
    await checkUserLoggedIn();
    return magic;
  } catch (error) {
    console.error("Erro ao inicializar Magic SDK:", error);
    throw error;
  }
}

/**
 * Verifica se um email está autorizado no backend
 * @param {string} email - O email para verificar
 * @returns {Promise<boolean>}
 */
async function isEmailAuthorized(email) {
  try {
    console.log("Validando e-mail no backend...");
    const response = await fetch("/api/get-authorized-emails");
    if (!response.ok) {
      throw new Error(`Erro ao acessar o backend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API:", data);

    // Verifica se a resposta contém a lista de e-mails
    if (!data.emails || !Array.isArray(data.emails)) {
      console.error("Formato inesperado do JSON retornado pelo backend:", data);
      return false;
    }

    // Normaliza e verifica se o e-mail está autorizado
    const authorized = data.emails.map(e => e.toLowerCase()).includes(email.toLowerCase());
    console.log("E-mail autorizado?", authorized);
    return authorized;
  } catch (error) {
    console.error("Erro na validação do e-mail:", error);
    return false;
  }
}

/**
 * Faz login com email usando o Magic SDK
 * @param {string} email - O email para login
 * @returns {Promise<boolean>}
 */
async function loginWithEmail(email) {
  try {
    if (!magic) {
      await initMagicSDK();
    }
    
    if (!email) {
      throw new Error("O email não pode estar vazio");
    }
    
    if (!await isEmailAuthorized(email)) {
      throw new Error("Email não autorizado");
    }
    
    const didToken = await magic.auth.loginWithMagicLink({ email });
    if (!didToken) {
      throw new Error("Falha ao gerar token de autenticação");
    }
    
    userEmail = email;
    userMetadata = await magic.user.getMetadata();
    isLoggedIn = true;
    
    // Evento de login bem-sucedido
    const loginEvent = new CustomEvent('auth:login', { 
      detail: { method: 'email', user: userMetadata } 
    });
    window.dispatchEvent(loginEvent);
    
    return true;
  } catch (error) {
    console.error("Erro ao fazer login com email:", error);
    // Evento de falha de login
    const loginFailEvent = new CustomEvent('auth:loginFailed', { 
      detail: { method: 'email', error: error.message } 
    });
    window.dispatchEvent(loginFailEvent);
    return false;
  }
}

/**
 * Logout do usuário
 * @returns {Promise<boolean>}
 */
async function logout() {
  try {
    if (!magic || !isLoggedIn) {
      return true; // Já está deslogado
    }
    
    await magic.user.logout();
    isLoggedIn = false;
    userEmail = null;
    userMetadata = null;
    
    // Evento de logout
    const logoutEvent = new CustomEvent('auth:logout');
    window.dispatchEvent(logoutEvent);
    
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return false;
  }
}

/**
 * Verifica se o usuário já está logado
 * @returns {Promise<boolean>}
 */
async function checkUserLoggedIn() {
  try {
    if (!magic) {
      await initMagicSDK();
    }
    
    isLoggedIn = await magic.user.isLoggedIn();
    
    if (isLoggedIn) {
      userMetadata = await magic.user.getMetadata();
      userEmail = userMetadata.email;
      
      // Evento de restauração de sessão
      const sessionEvent = new CustomEvent('auth:sessionRestored', { 
        detail: { user: userMetadata } 
      });
      window.dispatchEvent(sessionEvent);
    }
    
    return isLoggedIn;
  } catch (error) {
    console.error("Erro ao verificar login do usuário:", error);
    return false;
  }
}

/**
 * Retorna o objeto Magic SDK
 * @returns {Object|null}
 */
function getMagicInstance() {
  return magic;
}

/**
 * Retorna informações do usuário atual
 * @returns {Object|null}
 */
function getCurrentUser() {
  if (!isLoggedIn) return null;
  return {
    email: userEmail,
    metadata: userMetadata,
    isLoggedIn
  };
}

// Exportar funções e variáveis do módulo
export {
  initMagicSDK,
  isEmailAuthorized,
  loginWithEmail,
  logout,
  checkUserLoggedIn,
  getMagicInstance,
  getCurrentUser
};
