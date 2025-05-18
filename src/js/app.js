/**
 * app.js
 * Aplicação principal que integra todos os módulos
 */

import { initConfig, getConfig, isDevelopment } from './modules/config.js';
import { initMagicSDK, loginWithEmail, logout, checkUserLoggedIn } from './modules/auth.js';
import { initUI, showError, showPdfViewer, getCurrentAuthMethod } from './modules/ui-manager.js';
import { initPDFViewer, loadEncryptedFile, isDocumentAccessAuthorized } from './modules/pdf-viewer.js';
import { initWalletConnector, connectWallet, isWalletConnected, getWalletAddress } from './modules/wallet-connector.js';
import { logAction } from './utils/utils.js';

// Variáveis globais da aplicação
let appInitialized = false;

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
    
    // Inicializar Magic SDK
    await initMagicSDK();
    
    // Inicializar conector de carteira
    await initWalletConnector();
    
    // Inicializar visualizador de PDF
    initPDFViewer('pdf-viewer');
    
    // Configurar listeners de eventos
    setupEventListeners();
    
    // Verificar estado de autenticação
    await checkInitialAuthState();    appInitialized = true;
    console.log("Aplicação inicializada com sucesso");
    
    // Marcar UI como inicializada
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.classList.add('initialized');
    }
    
    // Esconder o overlay de carregamento
    hideLoadingOverlay();
    
    logAction('app:initialized', {
      isDev: isDevelopment(),
      debug: getConfig('debugEnabled')
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
      // Verificar se está logado
      const isLoggedIn = await checkUserLoggedIn();
      
      if (!isLoggedIn && !isWalletConnected()) {
        throw new Error("Você precisa estar logado para acessar documentos");
      }
        // Obter identificador do usuário (email ou carteira)
      let userIdentifier = '';
      if (getCurrentAuthMethod() === 'email') {
        const authEvent = new CustomEvent('auth:getUserEmail', {
          detail: { callback: (email) => userIdentifier = email }
        });
        window.dispatchEvent(authEvent);
      } else {
        userIdentifier = getWalletAddress();
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
async function checkInitialAuthState() {
  try {
    console.log("Verificando estado inicial de autenticação...");
    showLoadingOverlay("Verificando autenticação...");
    
    // Atrasar um pouco para garantir que a UI esteja estável antes de verificar autenticação
    // Isso ajuda a evitar o efeito de "piscar" dos botões
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se usuário já está logado com Magic
    const isLoggedIn = await checkUserLoggedIn();
    
    // Verificar se uma carteira já está conectada
    const walletConnected = isWalletConnected();
    
    // Importar a função de debug para verificar o estado da UI
    const { debugUIState } = await import('./modules/ui-manager.js');
    
    if (isLoggedIn || walletConnected) {
      console.log("Usuário já está autenticado:", { magicLogin: isLoggedIn, walletConnected });
      // A UI já deve ter sido atualizada pelos eventos disparados por checkUserLoggedIn()
      // ou pela inicialização do wallet-connector
    } else {
      console.log("Usuário não está autenticado");
      
      // Forçar resetar a UI para garantir que os botões estejam visíveis
      const { resetUIToInitialState } = await import('./modules/ui-manager.js');
      resetUIToInitialState();
    }
    
    // Log do estado da UI para debug
    debugUIState();
    
    // Atrasar um pouco antes de esconder o overlay
    // para dar tempo aos eventos de UI serem processados
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Garantir que o overlay seja escondido
    hideLoadingOverlay();
    
    // Adicionar uma classe para indicar que a autenticação foi verificada
    document.body.classList.add('auth-checked');
    
  } catch (error) {
    console.error("Erro ao verificar estado de autenticação:", error);
    hideLoadingOverlay();
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
    overlay.classList.add('hidden');
    
    // Marcar a aplicação como inicializada
    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.classList.add('initialized');
    }
    
    // Tentar garantir que a UI esteja visível
    setTimeout(async () => {
      try {
        const { resetUIToInitialState } = await import('./modules/ui-manager.js');
        resetUIToInitialState();
      } catch (e) {
        console.error("Erro ao garantir visibilidade da UI:", e);
      }
    }, 100);
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

// Exportar funções do módulo
export {
  initApp
};
