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
    
    // Verificar se a biblioteca Magic está carregada
    if (typeof Magic === 'undefined') {
      console.error("A biblioteca Magic SDK não foi carregada corretamente");
      throw new Error("Magic SDK não disponível");
    }
    
    if (!magicPubKey) {
      console.error("Chave Magic SDK não encontrada");
      throw new Error("Magic SDK Public Key não disponível");
    }
    
    // Inicializar o Magic SDK
    magic = new Magic(magicPubKey);
    console.log("Magic SDK inicializado com sucesso");
    
    // Verificar a versão do Magic SDK e configurar métodos compatíveis
    try {
      if (magic.version) {
        console.log("Magic SDK versão:", magic.version);
      }
      
      // Verificar se os métodos necessários estão disponíveis
      // Se magic.user.getMetadata não existir, adicionamos um polyfill
      if (magic.user && !magic.user.getMetadata && magic.user.getInfo) {
        console.log("Adicionando polyfill para getMetadata usando getInfo");
        magic.user.getMetadata = async function() {
          const info = await magic.user.getInfo();
          return info;
        };
      }
      
      // Expor magic para debugging e testes
      window.magic = magic;
    } catch (e) {
      console.log("Aviso: Configuração de compatibilidade de API falhou:", e);
    }
    
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
    
    // Tentar login com diferentes métodos disponíveis
    let didToken;
    try {
      didToken = await magic.auth.loginWithMagicLink({ email });
    } catch (err) {
      console.warn("loginWithMagicLink falhou, tentando método alternativo:", err);
      if (magic.auth.loginWithEmailOTP) {
        didToken = await magic.auth.loginWithEmailOTP({ email });
      } else {
        throw err;
      }
    }
    
    if (!didToken) {
      throw new Error("Falha ao gerar token de autenticação");
    }
    
    userEmail = email;
    
    // Obter metadados com tratamento para diferentes versões da API
    try {
      userMetadata = await magic.user.getInfo();
    } catch (metadataError) {
      console.warn("getInfo falhou, tentando getMetadata:", metadataError);
      try {
        userMetadata = await magic.user.getMetadata();
      } catch (fallbackError) {
        console.error("Não foi possível obter os metadados do usuário:", fallbackError);
        userMetadata = { email };
      }
    }
    
    isLoggedIn = true;
    
    // Evento de login bem-sucedido
    const loginEvent = new CustomEvent('auth:login', { 
      detail: { method: 'email', user: userMetadata } 
    });
    window.dispatchEvent(loginEvent);
    
    return true;
  } catch (error) {
    console.error("Erro ao fazer login com email:", error);
    
    // Fornecer mensagens de erro mais específicas para facilitar a depuração
    let errorMessage = error.message;
    if (error.message.includes("getMetadata is not a function")) {
      errorMessage = "Incompatibilidade na versão do Magic SDK. Contate o suporte técnico.";
    } else if (error.message.includes("magic.auth")) {
      errorMessage = "Erro na inicialização do serviço de autenticação. Tente novamente mais tarde.";
    }
    
    // Evento de falha de login
    const loginFailEvent = new CustomEvent('auth:loginFailed', { 
      detail: { 
        method: 'email', 
        error: errorMessage,
        originalError: error.message,
        stack: error.stack
      } 
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
      // A versão mais recente do Magic SDK usa getUserInfo em vez de getMetadata
      try {
        userMetadata = await magic.user.getInfo();
      } catch (metadataError) {
        // Fallback para API legada se necessário
        console.warn("Erro ao usar getInfo, tentando método alternativo:", metadataError);
        try {
          userMetadata = await magic.user.getMetadata();
        } catch (fallbackError) {
          console.error("Não foi possível obter os metadados do usuário:", fallbackError);
          // Criar metadados mínimos
          userMetadata = { email: "user@example.com" }; // Será substituído quando o email for identificado
        }
      }
      
      // Obter email do usuário (diferentes versões do Magic SDK podem ter estruturas diferentes)
      if (userMetadata && userMetadata.email) {
        userEmail = userMetadata.email;
      } else if (userMetadata && userMetadata.data && userMetadata.data.email) {
        userEmail = userMetadata.data.email;
      } else {
        console.warn("Não foi possível obter o email do usuário dos metadados");
      }
      
      // Atualizar o estado global da aplicação
      if (window.fleekAppState) {
        window.fleekAppState.isLoggedIn = true;
        window.fleekAppState.authMethod = 'email';
        window.fleekAppState.userIdentifier = userEmail;
        console.log("Estado global atualizado após login:", window.fleekAppState);
      }
      
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
  // Expor a instância do Magic SDK para testes também
  if (magic) {
    window.magic = magic;
  }
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

// Configurar listeners para eventos de autenticação
window.addEventListener('auth:getAuthMethod', (event) => {
  if (event.detail && typeof event.detail.callback === 'function') {
    event.detail.callback(isLoggedIn ? 'email' : 'wallet');
  }
});

window.addEventListener('auth:getToken', async (event) => {
  if (!isLoggedIn || !magic) {
    if (event.detail && typeof event.detail.callback === 'function') {
      event.detail.callback(null);
    }
    return;
  }
  
  try {
    const token = await magic.user.getIdToken();
    if (event.detail && typeof event.detail.callback === 'function') {
      event.detail.callback(token);
    }
  } catch (error) {
    console.error("Erro ao obter token:", error);
    if (event.detail && typeof event.detail.callback === 'function') {
      event.detail.callback(null);
    }
  }
});

window.addEventListener('auth:getUserEmail', (event) => {
  if (event.detail && typeof event.detail.callback === 'function') {
    event.detail.callback(userEmail || '');
  }
});
