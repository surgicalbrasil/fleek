/**
 * app.js
 * Aplicação principal que integra todos os módulos
 */

import { initConfig, getConfig, isDevelopment } from './modules/config.js';
import { initMagicSDK, loginWithEmail, logout, checkUserLoggedIn } from './modules/auth.js';
import { initUI, showError, showPdfViewer, getCurrentAuthMethod, resetUIToInitialState } from './modules/ui-manager.js';
import { initPDFViewer, loadEncryptedFile, isDocumentAccessAuthorized } from './modules/pdf-viewer.js';
import { initWalletConnector, connectWallet, isWalletConnected, getWalletAddress } from './modules/wallet-connector.js';
import { logAction } from './utils/utils.js';

// Variáveis globais da aplicação
let appInitialized = false;

// Estado global da aplicação para compartilhar entre módulos
window.fleekAppState = {
  authMethod: 'email',
  isLoggedIn: false,
  userIdentifier: null,
  walletAddress: null,
  
  // Método para atualizar o estado de forma segura
  update: function(newState) {
    Object.assign(this, newState);
    console.log("Estado global atualizado:", JSON.stringify({
      authMethod: this.authMethod,
      isLoggedIn: this.isLoggedIn,
      hasIdentifier: !!this.userIdentifier
    }));
  },
  
  // Método para limpar o estado
  reset: function() {
    this.authMethod = 'email';
    this.isLoggedIn = false;
    this.userIdentifier = null;
    this.walletAddress = null;
    console.log("Estado global resetado");
  }
};

/**
 * Inicializa a aplicação
 * @returns {Promise<void>}
 */
async function initApp() {
  try {
    console.log("Inicializando aplicação...");
    
    // Inicializar configurações
    await initConfig();
    
    // Inicializar UI
    initUI();
    
    // Inicializar Magic SDK com timeout de proteção
    try {
      await Promise.race([
        initMagicSDK(),
        new Promise((_, reject) => setTimeout(() => {
          console.warn("Timeout ao inicializar Magic SDK");
          reject(new Error("Timeout ao inicializar Magic SDK"));
        }, 5000))
      ]);
    } catch (magicError) {
      console.error("Falha ao inicializar Magic SDK:", magicError);
      // Continuamos mesmo com erro, para dar chance ao login por carteira
    }
    
    // Inicializar conector de carteira
    try {
      await initWalletConnector();
    } catch (walletError) {
      console.error("Falha ao inicializar conector de carteira:", walletError);
      // Continuamos mesmo com erro, para dar chance ao login por email
    }
    
    // Inicializar visualizador de PDF
    initPDFViewer('pdf-viewer');
    
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Verificar estado de autenticação
    await checkInitialAuthState();
    
    appInitialized = true;
    console.log("Aplicação inicializada com sucesso");
    
    // Marcar UI como inicializada
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.classList.add('initialized');
      authContainer.style.opacity = '1'; // Garantir visibilidade
    }
    
    // Esconder o overlay de carregamento
    hideLoadingOverlay();
    
    // Adicionar classe ao body indicando inicialização completa
    document.body.classList.add('app-initialized');
    
    logAction('app:initialized', {
      isDev: isDevelopment(),
      debug: getConfig('debugEnabled'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao inicializar a aplicação:", error);
    showError(`Erro ao inicializar a aplicação: ${error.message}`);
  }
}

/**
 * Configura os listeners para eventos da aplicação
 * @returns {void}
 */
function setupEventListeners() {
  // Eventos de solicitação de login da UI
  window.addEventListener('ui:requestLogin', async (event) => {
    try {
      const method = event.detail.method;
      
      if (method === 'email') {
        const email = event.detail.email;
        if (!email) {
          throw new Error("Email não fornecido");
        }
        
        await loginWithEmail(email);
      } else if (method === 'wallet') {
        await connectWallet();
      }
    } catch (error) {
      console.error("Erro ao processar login:", error);
      showError(`Erro no login: ${error.message}`);
    }
  });
  
  // Evento de solicitação de logout
  window.addEventListener('ui:requestLogout', async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      showError(`Erro no logout: ${error.message}`);
    }
  });
    // Evento de solicitação de acesso a arquivo
  window.addEventListener('ui:requestFileAccess', async () => {
    try {
      // Mostrar overlay de carregamento
      showLoadingOverlay("Acessando documento...");
      
      // Verificar se está logado usando o estado global
      const isLoggedIn = window.fleekAppState && window.fleekAppState.isLoggedIn;
      const isWalletConnected = window.fleekAppState && window.fleekAppState.authMethod === 'wallet' && window.fleekAppState.walletAddress;
      
      if (!isLoggedIn && !isWalletConnected) {
        throw new Error("Você precisa estar logado para acessar documentos");
      }
      
      // Obter identificador do usuário diretamente do estado global
      let userIdentifier = '';
      if (window.fleekAppState && window.fleekAppState.userIdentifier) {
        userIdentifier = window.fleekAppState.userIdentifier;
      } else if (window.fleekAppState && window.fleekAppState.authMethod === 'email') {
        // Fallback para obter o email se não estiver no estado global
        userIdentifier = document.getElementById('user-email') ? document.getElementById('user-email').value : '';
      } else if (window.fleekAppState && window.fleekAppState.authMethod === 'wallet' && window.fleekAppState.walletAddress) {
        userIdentifier = window.fleekAppState.walletAddress;
      }
      
      if (!userIdentifier) {
        throw new Error("Não foi possível identificar o usuário. Por favor, tente fazer login novamente.");
      }
      
      console.log("Identificador do usuário:", userIdentifier);
      
      // No cenário real, o hash seria usado como chave de descriptografia
      const decryptionKey = `key_${userIdentifier}`;
      
      // Carregar arquivo criptografado com autenticação apropriada
      await loadEncryptedFile('Paper.pdf', decryptionKey);
      
      // Verificar acesso autorizado
      if (!isDocumentAccessAuthorized()) {
        throw new Error("Acesso não autorizado ao documento");
      }
      
      // Mostrar visualizador de PDF
      showPdfViewer(true);
      
    } catch (error) {
      console.error("Erro ao acessar documento:", error);
      showError(`Erro ao acessar documento: ${error.message}`);
    }
  });
  
  // Evento para obter identificador do usuário para marca d'água
  window.addEventListener('ui:getUserIdentifier', (event) => {
    let userIdentifier = '';
    
    if (getCurrentAuthMethod() === 'email') {
      const authEvent = new CustomEvent('auth:getUserEmail', {
        detail: { callback: (email) => userIdentifier = email }
      });
      window.dispatchEvent(authEvent);
    } else if (isWalletConnected()) {
      userIdentifier = getWalletAddress();
    } else {
      userIdentifier = 'Usuário não identificado';
    }
    
    if (event.detail && typeof event.detail.callback === 'function') {
      event.detail.callback(userIdentifier);
    }
  });
  
  // Evento para obter email do usuário
  window.addEventListener('auth:getUserEmail', (event) => {
    // Função simulada para obter o email
    const email = document.getElementById('user-email').value;
    
    if (event.detail && typeof event.detail.callback === 'function') {
      event.detail.callback(email);
    }
  });
}

/**
 * Verifica o estado inicial de autenticação após inicializar a aplicação
 * @returns {Promise<void>}
 */
async function checkInitialAuthState() {  try {
    console.log("Verificando estado inicial de autenticação...");
    showLoadingOverlay("Verificando autenticação...");
    
    // Importar funções de UI antecipadamente para evitar problemas
    const { resetUIToInitialState, debugUIState } = await import('./modules/ui-manager.js');
    
    // Criar uma promessa para o timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.warn("Timeout de segurança atingido para verificação de autenticação");
        reject(new Error("Timeout de verificação de autenticação"));
      }, 5000);
    });
    
    // Verificação de segurança para garantir que o overlay não ficará preso
    const maxAuthCheckTime = setTimeout(() => {
      console.warn("Timeout de segurança atingido para verificação de autenticação");
      hideLoadingOverlay();
      resetUIToInitialState();
      document.body.classList.add('auth-checked');
      document.body.classList.add('auth-timeout');
    }, 5000); // 5 segundos é um tempo seguro para a verificação
    
    try {
      // Verificar se usuário já está logado com Magic
      const isLoggedIn = await checkUserLoggedIn();
      
      // Verificar se uma carteira já está conectada
      const walletConnected = isWalletConnected();
      
      if (isLoggedIn || walletConnected) {
        console.log("Usuário já está autenticado:", { magicLogin: isLoggedIn, walletConnected });
        // Atualizar explicitamente o estado global
        window.fleekAppState.isLoggedIn = true;
        window.fleekAppState.authMethod = isLoggedIn ? 'email' : 'wallet';
      } else {
        console.log("Usuário não está autenticado");
        // Redefinir o estado global para garantir consistência
        window.fleekAppState.isLoggedIn = false;
        window.fleekAppState.authMethod = 'email';
        window.fleekAppState.userIdentifier = null;
        
        // Forçar resetar a UI para garantir que os botões estejam visíveis
        resetUIToInitialState();
      }
    } catch (innerError) {
      console.error("Erro durante verificação de autenticação:", innerError);
      resetUIToInitialState();
    }
    
    // Log do estado da UI para debug
    debugUIState();
    
    // Garantir que o overlay seja escondido independentemente do resultado
    hideLoadingOverlay();
    
    // Adicionar uma classe para indicar que a autenticação foi verificada
    document.body.classList.add('auth-checked');
    
    // Cancelar o timeout de segurança
    clearTimeout(maxAuthCheckTime);  } catch (error) {
    console.error("Erro ao verificar estado de autenticação:", error);
    hideLoadingOverlay();
    // Garantir que a UI seja redefinida em caso de erro
    resetUIToInitialState();
    document.body.classList.add('auth-checked');
  }
}

/**
 * Esconde o overlay de carregamento
 * @returns {void}
 */
function hideLoadingOverlay() {
  console.log("Escondendo overlay de carregamento");
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    try {
      // Forçar a remoção da classe antes de adicionar a classe hidden
      overlay.className = 'loading-overlay';
      overlay.classList.add('hidden');
      overlay.style.display = 'none'; // Forçar diretamente o estilo display none
      overlay.style.visibility = 'hidden'; // Garantir que também esteja invisível
      overlay.style.opacity = '0'; // Tornar completamente transparente
      overlay.style.pointerEvents = 'none'; // Impedir interações
      
      // Marcar a aplicação como inicializada
      const authContainer = document.querySelector('.auth-container');
      if (authContainer) {
        authContainer.classList.add('initialized');
        authContainer.style.opacity = '1'; // Garantir visibilidade
        authContainer.style.visibility = 'visible'; // Garantir que esteja visível
        authContainer.style.display = 'block'; // Garantir que esteja exibido
      }
      
      // Resetar UI para estado inicial usando um método resistente a falhas
      try {
        // Primeiro, tente usar resetUIToInitialState do namespace fleekUIManager
        if (window.fleekUIManager && typeof window.fleekUIManager.resetUIToInitialState === 'function') {
          console.log("Usando resetUIToInitialState de fleekUIManager");
          window.fleekUIManager.resetUIToInitialState();
        }
        // Em seguida, tente a função global
        else if (typeof resetUIToInitialState === 'function') {
          console.log("Usando resetUIToInitialState global");
          resetUIToInitialState();
        }
        // Se nenhuma dessas opções funcionar, tente a função importada
        else if (typeof window.resetUIToInitialState === 'function') {
          console.log("Usando resetUIToInitialState global (window)");
          window.resetUIToInitialState();
        }
        // Por último, execute um fallback
        else {
          throw new Error("resetUIToInitialState não encontrado");
        }
      } catch (resetError) {
        console.warn("resetUIToInitialState falhou:", resetError);
        console.warn("Executando fallback de restauração da UI");
        
        // Fallback completo para garantir que todos os elementos de UI estejam visíveis
        const elementsToReset = [
          '#login-button', '.auth-container', '.auth-toggle', 
          '#logout-button', '#acessar-arquivo', '#cadastro-metaverso', 
          'button', '[role="button"]', 'a.button', 'input[type="button"]'
        ];
        
        document.querySelectorAll(elementsToReset.join(', ')).forEach(elem => {
          if (elem) {
            // Para botões que devem começar visíveis (como login)
            if (elem.id === 'login-button' || elem.classList.contains('auth-toggle')) {
              elem.style.display = 'block';
              elem.style.visibility = 'visible';
              elem.style.opacity = '1';
            }
            // Para elementos que podem começar ocultos dependendo do estado de autenticação
            else {
              // Restaurar para o estado natural do elemento
              elem.style.visibility = 'visible';
              elem.style.opacity = '1';
            }
            
            // Garantir que sejam clicáveis
            elem.style.pointerEvents = 'auto';
            elem.style.cursor = 'pointer';
          }
        });
        
        // Dispara um evento personalizado para sinalizar que a UI foi restaurada
        document.dispatchEvent(new CustomEvent('uiRestored', { detail: { method: 'fallback' } }));
      }
      
      // Notificar serviços que dependem do carregamento completo
      document.dispatchEvent(new CustomEvent('appLoaded'));
    } catch (e) {
      console.error("Erro ao esconder overlay:", e);
      // Fallback de emergência - garantir que os elementos essenciais sejam visíveis
      document.querySelectorAll('#login-button, .auth-container, .auth-toggle').forEach(elem => {
        if (elem) {
          elem.style.display = 'block';
          elem.style.visibility = 'visible';
          elem.style.opacity = '1';
          elem.style.pointerEvents = 'auto';
        }
      });
      
      // Forçar remoção do overlay mesmo em caso de erro
      overlay.style.display = 'none';
      overlay.style.visibility = 'hidden';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  }
}

/**
 * Mostra o overlay de carregamento
 * @param {string} message - Mensagem opcional a ser mostrada
 * @returns {void}
 */
function showLoadingOverlay(message) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    const textElement = overlay.querySelector('.loading-text');
    if (textElement && message) {
      textElement.textContent = message;
    }
    overlay.classList.remove('hidden');
  }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM carregado, inicializando aplicação...");
  // Mostrar overlay de carregamento imediatamente
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
  
  // Iniciar a aplicação
  initApp()
    .then(() => {
      // Verificação de segurança para garantir que a UI esteja visível
      setTimeout(async () => {
        try {
          console.log("Verificação de segurança do estado da UI");
          const loginButton = document.getElementById('login-button');
          const logoutButton = document.getElementById('logout-button');
          
          // Verificar se os botões estão em estados inconsistentes
          if (loginButton && logoutButton) {
            const loginHidden = loginButton.style.display === 'none' || loginButton.style.opacity === '0';
            const logoutHidden = logoutButton.style.display === 'none' || logoutButton.style.opacity === '0';
            
            if (loginHidden && logoutHidden) {
              console.warn("Detectado estado inconsistente da UI - ambos os botões estão ocultos");
              const { resetUIToInitialState } = await import('./modules/ui-manager.js');
              resetUIToInitialState();
            }
          }
        } catch (e) {
          console.error("Erro na verificação de segurança da UI:", e);
        }
      }, 1500);
    });
});

// Wrapper para obter o método de autenticação atual
function getCurrentAuthMethod() {
  // Importar diretamente do módulo ui-manager
  const method = window.fleekAppState ? window.fleekAppState.authMethod : 'email';
  console.log("App: Método de autenticação atual:", method);
  return method;
}

// Exportar funções do módulo
export {
  initApp,
  getCurrentAuthMethod
};
