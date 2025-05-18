/**
 * ui-manager.js
 * Módulo para gerenciar a interface do usuário
 */

// Estado da UI
const ui = {
  currentAuthMethod: 'email',
  showPdfViewer: false,
  showMetaversoModal: false,
  elements: {}
};

/**
 * Inicializa o gerenciador de UI
 * @returns {void}
 */
function initUI() {
  console.log("Inicializando UI Manager");
  
  // Armazenar referências aos elementos da UI
  cacheElements();
  
  // Verificar se os elementos essenciais foram encontrados
  if (!ui.elements.loginButton || !ui.elements.logoutButton) {
    console.error("Elementos essenciais da UI não foram encontrados!");
    // Tentaremos novamente após um curto atraso
    setTimeout(() => {
      console.log("Tentando reinicializar UI após delay");
      cacheElements();
      completeInitialization();
    }, 100);
    return;
  }
  
  // Continuar com a inicialização normal
  completeInitialization();
}

/**
 * Completa a inicialização da UI após garantir que elementos existam
 * @returns {void}
 */
function completeInitialization() {
  // Esconder todos os botões inicialmente para evitar flickering
  hideAllButtons();
  
  // Configurar estado inicial dos botões (ficarão escondidos até a aplicação inicializar)
  resetUIToInitialState();
  
  // Configurar botões de alternância de autenticação
  setupAuthToggle();
  
  // Configurar botão de login
  setupLoginButton();
  
  // Configurar botão de acesso a arquivo
  setupFileAccessButton();
  
  // Configurar botão de cadastro no metaverso
  setupMetaversoButton();
  
  // Configurar botão de logout
  setupLogoutButton();
  
  // Configurar ouvintes de eventos de autenticação
  setupAuthListeners();
  
  // Configurar listeners para visualizador de PDF
  setupPdfViewerListeners();
  
  console.log("UI Manager inicializado completamente");
  debugUIState();
}

/**
 * Armazena referências aos elementos da UI
 * @returns {void}
 */
function cacheElements() {
  // Elementos de autenticação
  ui.elements.authToggles = document.querySelectorAll('.auth-toggle');
  ui.elements.emailForm = document.querySelector('.auth-form');
  ui.elements.userEmail = document.getElementById('user-email');
  ui.elements.walletInfo = document.getElementById('wallet-info');
  ui.elements.walletAddress = document.getElementById('wallet-address');
  ui.elements.loginButton = document.getElementById('login-button');
  ui.elements.logoutButton = document.getElementById('logout-button');
  
  // Elementos de acesso a documentos
  ui.elements.acessarArquivo = document.getElementById('acessar-arquivo');
  
  // Elementos do metaverso
  ui.elements.cadastroMetaverso = document.getElementById('cadastro-metaverso');
  ui.elements.metaversoModal = document.getElementById('metaverso-modal');
  ui.elements.closeModal = document.getElementById('close-modal');
  
  // Elementos do visualizador de PDF
  ui.elements.pdfViewer = document.getElementById('pdf-viewer');
}

/**
 * Configura os botões de alternância de autenticação
 * @returns {void}
 */
function setupAuthToggle() {
  ui.elements.authToggles.forEach(button => {
    button.addEventListener('click', () => {
      ui.elements.authToggles.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      ui.currentAuthMethod = button.dataset.auth;
      
      // Mostrar/esconder formulário de email conforme o método
      ui.elements.emailForm.style.display = ui.currentAuthMethod === 'email' ? 'block' : 'none';
      
      // Mostrar/esconder informações da carteira
      ui.elements.walletInfo.style.display = ui.currentAuthMethod === 'wallet' ? 'flex' : 'none';
      
      // Atualizar o texto do botão de login conforme o método
      if (ui.currentAuthMethod === 'email') {
        ui.elements.loginButton.textContent = 'Fazer Login';
      } else if (ui.currentAuthMethod === 'wallet') {
        ui.elements.loginButton.textContent = 'Conectar Carteira';
      }
    });
  });
}

/**
 * Configura o botão de login
 * @returns {void}
 */
function setupLoginButton() {
  ui.elements.loginButton.addEventListener('click', () => {
    // Disparar evento com método de autenticação
    const authEvent = new CustomEvent('ui:requestLogin', { 
      detail: { 
        method: ui.currentAuthMethod,
        email: ui.currentAuthMethod === 'email' ? ui.elements.userEmail.value : null
      } 
    });
    window.dispatchEvent(authEvent);
  });
}

/**
 * Configura o botão de acesso ao arquivo
 * @returns {void}
 */
function setupFileAccessButton() {
  ui.elements.acessarArquivo.addEventListener('click', () => {
    const fileRequestEvent = new CustomEvent('ui:requestFileAccess');
    window.dispatchEvent(fileRequestEvent);
  });
}

/**
 * Configura o botão e modal do Metaverso
 * @returns {void}
 */
function setupMetaversoButton() {
  // Abrir modal
  ui.elements.cadastroMetaverso.addEventListener('click', () => {
    ui.elements.metaversoModal.style.display = 'flex';
  });
  
  // Fechar modal
  ui.elements.closeModal.addEventListener('click', () => {
    ui.elements.metaversoModal.style.display = 'none';
  });
  
  // Fechar modal ao clicar fora dele
  window.addEventListener('click', (event) => {
    if (event.target === ui.elements.metaversoModal) {
      ui.elements.metaversoModal.style.display = 'none';
    }
  });
}

/**
 * Configura o botão de logout
 * @returns {void}
 */
function setupLogoutButton() {
  ui.elements.logoutButton.addEventListener('click', () => {
    const logoutEvent = new CustomEvent('ui:requestLogout');
    window.dispatchEvent(logoutEvent);
  });
}

/**
 * Configura listeners para eventos de autenticação
 * @returns {void}
 */
function setupAuthListeners() {
  // Login bem-sucedido
  window.addEventListener('auth:login', (event) => {
    updateUIAfterLogin(event.detail);
  });
  
  // Falha de login
  window.addEventListener('auth:loginFailed', (event) => {
    showError(`Falha no login: ${event.detail.error}`);
  });
  
  // Logout
  window.addEventListener('auth:logout', () => {
    updateUIAfterLogout();
  });
    // Restauração de sessão
  window.addEventListener('auth:sessionRestored', (event) => {
    console.log("Sessão restaurada:", event.detail);
    updateUIAfterLogin({
      method: 'email',
      user: event.detail.user
    });
  });
  
  // Conexão de carteira bem-sucedida
  window.addEventListener('wallet:connected', (event) => {
    updateWalletInfo(event.detail.address, event.detail.balance);
  });
  
  // Falha na conexão de carteira
  window.addEventListener('wallet:connectionFailed', (event) => {
    showError(`Falha na conexão da carteira: ${event.detail.error}`);
  });
}

/**
 * Configura listeners para eventos do visualizador de PDF
 * @returns {void}
 */
function setupPdfViewerListeners() {
  // PDF carregado
  window.addEventListener('pdf:loaded', (event) => {
    showPdfViewer(true);
  });
  
  // Erro ao carregar PDF
  window.addEventListener('pdf:error', (event) => {
    showError(`Erro ao carregar documento: ${event.detail.error}`);
    showPdfViewer(false);
  });
  
  // Erro ao carregar arquivo
  window.addEventListener('pdf:loadError', (event) => {
    showError(`Erro ao carregar arquivo: ${event.detail.error}`);
    showPdfViewer(false);
  });
  
  // Solicitar identificador do usuário para marca d'água
  window.addEventListener('pdf:getUserIdentifier', (event) => {
    const userIdentifierEvent = new CustomEvent('ui:requestUserIdentifier');
    window.dispatchEvent(userIdentifierEvent);
    
    // Em um cenário real, esperaríamos pela resposta
    // Por enquanto, usando uma callback simples
    if (typeof event.detail.callback === 'function') {
      const userEvent = new CustomEvent('ui:getUserIdentifier', {
        detail: { callback: event.detail.callback }
      });
      window.dispatchEvent(userEvent);
    }
  });
}

/**
 * Atualiza a UI após o login bem-sucedido
 * @param {Object} detail - Detalhes do login
 * @returns {void}
 */
function updateUIAfterLogin(detail) {
  console.log("Atualizando UI após login:", detail);
  
  // Atualizar UI baseado no método de login
  const method = detail.method || 'email';
  
  if (method === 'email') {
    ui.elements.emailForm.style.display = 'none';
    ui.elements.userEmail.disabled = true;
    ui.elements.walletInfo.style.display = 'none';
  } else if (method === 'wallet') {
    ui.elements.emailForm.style.display = 'none';
    ui.elements.walletInfo.style.display = 'flex';
    
    // Atualizar endereço da carteira se disponível
    if (detail.user && detail.user.publicAddress) {
      updateWalletInfo(detail.user.publicAddress, '');
    }
  }
  
  // Utilizar nossa função para definir o estado autenticado
  setAuthenticatedState(method);
  
  // Desativar toggles de autenticação
  ui.elements.authToggles.forEach(toggle => {
    toggle.disabled = true;
  });
  
  // Registrar estado da UI para depuração
  debugUIState();
}

/**
 * Atualiza a UI após o logout
 * @returns {void}
 */
function updateUIAfterLogout() {
  // Resetar formulário de email
  ui.elements.userEmail.value = '';
  ui.elements.userEmail.disabled = false;
  ui.elements.emailForm.style.display = 'block';
  
  // Ocultar informações da carteira
  ui.elements.walletInfo.style.display = 'none';
  ui.elements.walletAddress.textContent = '';
  
  // Resetar estado da UI para o estado inicial
  resetUIToInitialState();
  
  // Registrar estado da UI para depuração
  debugUIState();
  ui.elements.cadastroMetaverso.style.display = 'none';
  
  // Reativar toggles de autenticação
  ui.elements.authToggles.forEach(toggle => {
    toggle.disabled = false;
  });
  
  // Resetar método de autenticação
  ui.currentAuthMethod = 'email';
  ui.elements.authToggles[0].click();
  
  // Fechar visualizador de PDF
  showPdfViewer(false);
}

/**
 * Atualiza informações da carteira na UI
 * @param {string} address - Endereço da carteira
 * @param {string} balance - Saldo da carteira
 * @returns {void}
 */
function updateWalletInfo(address, balance) {
  if (!address) return;
  
  // Formatar endereço para exibição
  const formattedAddress = address.substring(0, 6) + '...' + address.substring(address.length - 4);
  
  ui.elements.walletAddress.textContent = `${formattedAddress} (${balance || '0'} ETH)`;
  ui.elements.walletInfo.style.display = 'block';
}

/**
 * Exibe ou oculta o visualizador de PDF
 * @param {boolean} show - Indica se deve mostrar ou ocultar
 * @returns {void}
 */
function showPdfViewer(show) {
  ui.showPdfViewer = show;
  
  if (show) {
    ui.elements.pdfViewer.style.display = 'block';
    document.body.classList.add('viewing-document');
  } else {
    ui.elements.pdfViewer.style.display = 'none';
    document.body.classList.remove('viewing-document');
  }
}

/**
 * Exibe mensagem de erro
 * @param {string} message - Mensagem de erro
 * @returns {void}
 */
function showError(message) {
  alert(message);
}

/**
 * Retorna o método de autenticação atual
 * @returns {string}
 */
function getCurrentAuthMethod() {
  return ui.currentAuthMethod;
}

/**
 * Atualiza a exibição da UI com base no método de autenticação
 * @param {string} method - Método de autenticação ('email' ou 'wallet')
 * @returns {void}
 */
function updateAuthDisplay(method) {
  // Atualizar os botões de alternância
  ui.elements.authToggles.forEach(btn => {
    if (btn.dataset.auth === method) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Atualizar campos visíveis
  ui.currentAuthMethod = method;
  ui.elements.emailForm.style.display = method === 'email' ? 'block' : 'none';
  ui.elements.walletInfo.style.display = method === 'wallet' ? 'flex' : 'none';
  
  // Atualizar texto do botão de acordo com o estado
  const isLoggedIn = ui.elements.loginButton.style.display === 'none';
  if (!isLoggedIn) {
    if (method === 'email') {
      ui.elements.loginButton.textContent = 'Fazer Login';
    } else if (method === 'wallet') {
      ui.elements.loginButton.textContent = 'Conectar Carteira';
    }
  }
}

/**
 * Mostra o estado atual da UI no console para depuração
 * @returns {void}
 */
function debugUIState() {
  console.log("Estado atual da UI:", {
    currentAuthMethod: ui.currentAuthMethod,
    loginButton: ui.elements.loginButton?.style.display,
    logoutButton: ui.elements.logoutButton?.style.display,
    emailForm: ui.elements.emailForm?.style.display,
    walletInfo: ui.elements.walletInfo?.style.display,
    acessarArquivo: ui.elements.acessarArquivo?.style.display,
    cadastroMetaverso: ui.elements.cadastroMetaverso?.style.display
  });
}

/**
 * Oculta todos os botões para evitar flickering durante a inicialização
 * @returns {void}
 */
function hideAllButtons() {
  console.log("Ocultando botões temporariamente");
  
  if (!ui.elements.loginButton || !ui.elements.logoutButton) {
    console.warn("Elementos UI não encontrados durante hideAllButtons");
    return;
  }
  
  // Em vez de apenas ocultar, definimos a opacidade para 0
  // Isso mantém o layout intacto, mas torna os botões invisíveis
  // Importante: não mudamos as propriedades display ou visibility
  ui.elements.loginButton.style.opacity = '0';
  ui.elements.logoutButton.style.opacity = '0';
  ui.elements.acessarArquivo.style.opacity = '0';
  ui.elements.cadastroMetaverso.style.opacity = '0';
  
  // Garantir que os botões serão reexibidos após um tempo, como fallback de segurança
  setTimeout(() => {
    console.log("Garantindo visibilidade dos botões (timeout de segurança)");
    resetUIToInitialState();
  }, 2000);
}

/**
 * Redefine a UI para o estado inicial não autenticado
 * @returns {void}
 */
function resetUIToInitialState() {
  console.log("Resetando UI para estado inicial");
  
  // Verificar se os elementos existem
  if (!ui.elements.loginButton || !ui.elements.logoutButton) {
    console.warn("Elementos UI não encontrados, recachear elementos");
    cacheElements(); // Tentar buscar os elementos novamente
    
    if (!ui.elements.loginButton || !ui.elements.logoutButton) {
      console.error("Elementos UI ainda não encontrados após recache");
      return;
    }
  }
  
  // Definir estado padrão dos elementos
  ui.elements.loginButton.style.display = 'block';
  ui.elements.loginButton.style.opacity = '1';
  ui.elements.loginButton.style.visibility = 'visible';
  
  ui.elements.logoutButton.style.display = 'none';
  ui.elements.logoutButton.style.opacity = '1';
  
  ui.elements.acessarArquivo.style.display = 'none';
  ui.elements.acessarArquivo.style.opacity = '1';
  
  ui.elements.cadastroMetaverso.style.display = 'none';
  ui.elements.cadastroMetaverso.style.opacity = '1';
  
  // Garantir que o formulário de e-mail esteja visível se for o método atual
  if (ui.currentAuthMethod === 'email') {
    ui.elements.emailForm.style.display = 'block';
    ui.elements.loginButton.textContent = 'Fazer Login';
  } else if (ui.currentAuthMethod === 'wallet') {
    ui.elements.emailForm.style.display = 'none';
    ui.elements.loginButton.textContent = 'Conectar Carteira';
  }
  
  // Log do estado final
  debugUIState();
}

/**
 * Define o estado da UI para usuário autenticado
 * @param {string} method - Método de autenticação ('email' ou 'wallet')
 * @returns {void}
 */
function setAuthenticatedState(method) {
  console.log(`Configurando estado autenticado para método: ${method}`);
  
  if (!ui.elements.loginButton || !ui.elements.logoutButton) {
    console.warn("Elementos UI não encontrados, recachear elementos");
    cacheElements(); // Tentar buscar os elementos novamente
    
    if (!ui.elements.loginButton || !ui.elements.logoutButton) {
      console.error("Elementos UI ainda não encontrados após recache");
      return;
    }
  }
  
  ui.currentAuthMethod = method;
  
  // Garantir que os elementos tenham seus estilos definidos corretamente
  ui.elements.loginButton.style.display = 'none';
  ui.elements.loginButton.style.visibility = 'visible';
  ui.elements.loginButton.style.opacity = '1';
  
  ui.elements.logoutButton.style.display = 'block';
  ui.elements.logoutButton.style.visibility = 'visible';
  ui.elements.logoutButton.style.opacity = '1';
  
  ui.elements.acessarArquivo.style.display = 'block';
  ui.elements.acessarArquivo.style.visibility = 'visible';
  ui.elements.acessarArquivo.style.opacity = '1';
  
  ui.elements.cadastroMetaverso.style.display = 'block';
  ui.elements.cadastroMetaverso.style.visibility = 'visible';
  ui.elements.cadastroMetaverso.style.opacity = '1';
  
  // Registrar estado da UI para depuração
  debugUIState();
}

// Exportar funções do módulo
export {
  initUI,
  showError,
  showPdfViewer,
  updateWalletInfo,
  getCurrentAuthMethod,
  debugUIState
};
