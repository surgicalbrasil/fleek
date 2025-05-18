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
    
    appInitialized = true;
    console.log("Aplicação inicializada com sucesso");
    
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
      
      // No cenário real, o hash seria usado como chave de descriptografia
      const decryptionKey = `key_${userIdentifier}`;
      
      // Carregar arquivo criptografado
      await loadEncryptedFile('Paper.encrypted', decryptionKey);
      
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

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initApp);

// Exportar funções do módulo
export {
  initApp
};
