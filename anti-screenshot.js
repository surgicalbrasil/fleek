// Sistema de proteção contra capturas de tela

class AntiScreenshotSystem {
  constructor() {
    this.isSecure = false;
    this.captureDetected = false;
    this.captureAttempts = 0;
    this.maxAttempts = 1; // Política mais rigorosa: encerrar na primeira tentativa
    this.blurTimeout = null;
    
    // Elementos DOM
    this.overlay = null;
    this.watermark = null;
    this.alertBox = null;
    this.pdfViewer = null;
      // Métodos bind
    this.handlePrintScreen = this.handlePrintScreen.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleDevTools = this.handleDevTools.bind(this);
    this.handlePrintAttempt = this.handlePrintAttempt.bind(this);
    this.resetCaptureState = this.resetCaptureState.bind(this);
    this.closeAlert = this.closeAlert.bind(this);
  }
  
  // Inicializar o sistema
  init() {
    console.log("Inicializando sistema anti-captura de tela...");
    
    // Interceptar função de impressão do navegador
    this.overridePrintFunction();
    
    // Só inicializar quando o documento estiver totalmente carregado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  // Configurar o sistema
  setup() {
    this.pdfViewer = document.getElementById('pdf-viewer');
    
    // Adicionar classe de modo seguro
    if (this.pdfViewer) {
      this.pdfViewer.classList.add('secure-mode');
    }
    
    // Criar overlay
    this.createOverlays();
    
    // Criar alert box
    this.createAlertBox();
    
    // Instalar os event listeners
    this.installEventListeners();
    
    // Verificar suporte de funcionalidades
    this.checkFeatureSupport();
    
    // Monitorar criação de iframes para prevenir impressão através deles
    this.setupIframeMonitor();
    
    console.log("Sistema anti-captura de tela inicializado");
    this.isSecure = true;
  }
  
  // Criar overlays
  createOverlays() {
    // Criar overlay anti-captura
    this.overlay = document.createElement('div');
    this.overlay.className = 'anti-screenshot-overlay';
    document.body.appendChild(this.overlay);
    
    // Criar marca d'água
    this.watermark = document.createElement('div');
    this.watermark.className = 'doc-watermark';
    document.body.appendChild(this.watermark);
  }
    // Criar caixa de alerta
  createAlertBox() {
    this.alertBox = document.createElement('div');
    this.alertBox.className = 'security-alert';
    this.alertBox.innerHTML = `
      <h3>Alerta de Segurança</h3>
      <p>Detectamos uma tentativa de captura de tela. Este documento é confidencial e protegido contra cópias não autorizadas.</p>
      <p class="critical-alert">AVISO: Qualquer tentativa de captura de tela resultará no encerramento imediato da sessão.</p>
      <button id="close-alert">Entendi</button>
    `;
    document.body.appendChild(this.alertBox);
    
    // Adicionar evento de clique ao botão
    document.getElementById('close-alert').addEventListener('click', this.closeAlert);
  }
  // Instalar event listeners
  installEventListeners() {
    // Detectar PrintScreen
    document.addEventListener('keyup', this.handlePrintScreen);
    document.addEventListener('keydown', this.handlePrintScreen);
    
    // Detectar alterações de visibilidade (mudança de aba)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Detector de DevTools
    window.addEventListener('resize', this.handleDevTools);
    
    // Bloqueio de menu de contexto
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Bloqueio de seleção de texto no visualizador
    if (this.pdfViewer) {
      this.pdfViewer.addEventListener('selectstart', e => e.preventDefault());
    }
    
    // Detectar eventos de clipboard (cópia)
    document.addEventListener('copy', e => {
      e.preventDefault();
      this.triggerCaptureProtection();
      return false;
    });
    
    // Detectar eventos de clipboard (para print screen)
    window.addEventListener('paste', e => {
      // Verificar se o conteúdo da área de transferência contém imagem
      if (e.clipboardData && e.clipboardData.types) {
        const types = e.clipboardData.types;
        if (
          types.indexOf('Files') !== -1 || 
          types.indexOf('image/png') !== -1 || 
          types.indexOf('image/jpeg') !== -1 || 
          types.indexOf('image/gif') !== -1
        ) {
          console.log('Tentativa de colar imagem detectada');
          this.triggerCaptureProtection();
        }
      }
    });
      // Bloquear tentativas de impressão
    window.addEventListener('beforeprint', e => {
      console.log('Tentativa de impressão detectada');
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      this.handlePrintAttempt();
      return false;
    }, true); // Capturar na fase de captura
    
    // Método alternativo para detectar impressão (Ctrl+P)
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        console.log('Tentativa de impressão via atalho detectada');
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        this.handlePrintAttempt();
        return false;
      }
    }, true); // Capturar na fase de captura
    
    // Método adicional para detectar impressão (menu de contexto)
    document.addEventListener('mouseup', e => {
      // Verificar se o botão direito foi clicado (possível menu de impressão)
      if (e.button === 2) {
        // O menu já é bloqueado pelo event listener de contextmenu
        // Este é apenas um registro adicional
        console.log('Detectado clique com botão direito - monitorando para opções de impressão');
      }
    });
  }
    // Verificar suporte de funcionalidades
  checkFeatureSupport() {
    // Verificar se o navegador suporta ClipboardEvent
    const hasClipboardAPI = 'ClipboardEvent' in window;
    console.log(`Suporte à API de Clipboard: ${hasClipboardAPI}`);
    
    // Se não houver suporte, notificar no console
    if (!hasClipboardAPI) {
      console.warn("Este navegador pode não suportar todos os recursos de proteção contra capturas de tela.");
    }
  }
    // Sobrescrever função de impressão do navegador
  overridePrintFunction() {
    try {
      // Guardar referência original (para debugging apenas)
      window._originalPrint = window.print;
      
      // Sobrescrever função print
      window.print = () => {
        console.warn("Tentativa de impressão via método window.print() detectada e bloqueada");
        this.handlePrintAttempt();
        return false;
      };
      
      // Para iframes também
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.print = () => {
              console.warn("Tentativa de impressão via iframe detectada e bloqueada");
              this.handlePrintAttempt();
              return false;
            };
          }
        } catch (e) {
          // Ignora erros de cross-origin
          console.log("Não foi possível acessar iframe - possível restrição de cross-origin");
        }
      });
      
      console.log("Função de impressão do navegador sobrescrita com sucesso");
    } catch (e) {
      console.error("Erro ao sobrescrever função de impressão:", e);
    }
  }
  
  // Monitorar criação dinâmica de iframes
  setupIframeMonitor() {
    try {
      // Criar um observador para mudanças no DOM
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes && mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              
              // Verificar se o nó é um iframe
              if (node.tagName && node.tagName.toLowerCase() === 'iframe') {
                console.log('Novo iframe detectado - aplicando proteção contra impressão');
                
                // Aguardar carregamento do iframe
                node.addEventListener('load', () => {
                  try {
                    if (node.contentWindow) {
                      // Sobrescrever função de impressão no iframe
                      node.contentWindow.print = () => {
                        console.warn("Tentativa de impressão via iframe dinâmico bloqueada");
                        this.handlePrintAttempt();
                        return false;
                      };
                      
                      // Adicionar listener para Ctrl+P dentro do iframe
                      if (node.contentDocument) {
                        node.contentDocument.addEventListener('keydown', (e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                            e.preventDefault();
                            e.stopPropagation();
                            console.warn("Tentativa de impressão via atalho em iframe detectada");
                            this.handlePrintAttempt();
                            return false;
                          }
                        }, true);
                      }
                    }
                  } catch (e) {
                    // Ignora erros de cross-origin
                    console.log("Não foi possível acessar conteúdo do iframe - possível restrição de cross-origin");
                  }
                });
              }
            }
          }
        });
      });
      
      // Configurar e iniciar o observador
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log("Monitor de iframes dinâmicos inicializado");
    } catch (e) {
      console.error("Erro ao configurar monitor de iframes:", e);
    }
  }
  
  // Handler para tecla PrintScreen
  handlePrintScreen(e) {
    // Códigos de tecla conhecidos para PrintScreen
    if (
      e.key === 'PrintScreen' || 
      e.keyCode === 44 || 
      e.code === 'PrintScreen' ||
      // Combinações de teclas comuns para captura de tela
      (e.ctrlKey && e.key === 'p') ||
      (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'c')) ||
      (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.triggerCaptureProtection();
      return false;
    }
  }
  
  // Handler para mudança de visibilidade
  handleVisibilityChange() {
    // Se a página ficar oculta, pode ser uma indicação de captura de tela usando ferramentas externas
    if (document.visibilityState === 'hidden') {
      const now = new Date().getTime();
      
      // Armazenar o timestamp quando a página ficou oculta
      this._tabHiddenTime = now;
    } else if (document.visibilityState === 'visible' && this._tabHiddenTime) {
      const now = new Date().getTime();
      const hiddenDuration = now - this._tabHiddenTime;
      
      // Se a página ficou oculta por pouco tempo (menos de 1 segundo)
      // pode ser uma indicação de Alt+Tab para ferramenta de captura
      if (hiddenDuration < 1000) {
        this.triggerCaptureProtection();
      }
      
      this._tabHiddenTime = null;
    }
  }
    // Handler para detectar abertura de DevTools
  handleDevTools() {
    // Diferença entre altura da janela e altura interna do navegador
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // Se a diferença for grande, pode ser um indício de DevTools aberto
    if (widthDiff > 200 || heightDiff > 200) {
      this.triggerCaptureProtection();
    }
  }
  
  // Handler para tentativas de impressão
  handlePrintAttempt() {
    console.warn(`Tentativa de impressão detectada - Encerrando sessão imediatamente`);
    this.captureAttempts += 1;
    this.captureDetected = true;
    
    // Ativar overlay
    this.overlay.classList.add('active');
    
    // Aplicar blur ao conteúdo
    if (this.pdfViewer) {
      this.pdfViewer.classList.add('capture-detected');
    }
    
    // Mostrar alerta de impressão não autorizada
    this.alertBox.innerHTML = `
      <h3>Alerta de Segurança Crítico</h3>
      <p>Tentativa de impressão detectada. Este documento é estritamente confidencial e protegido contra impressões não autorizadas.</p>
      <p class="critical-alert">A sessão será encerrada imediatamente por motivos de segurança.</p>
    `;
    
    // Mostrar alerta
    this.alertBox.classList.add('active');
    
    // Encerrar a sessão imediatamente após a primeira tentativa
    setTimeout(() => {
      this.terminateSession();
    }, 1500); // Pequeno delay para o usuário ver o alerta
  }
    // Acionar proteção contra captura
  triggerCaptureProtection() {
    this.captureAttempts += 1;
    this.captureDetected = true;
    
    console.warn(`Tentativa de captura de tela detectada - Encerrando sessão imediatamente`);
    
    // Ativar overlay
    this.overlay.classList.add('active');
    
    // Aplicar blur ao conteúdo
    if (this.pdfViewer) {
      this.pdfViewer.classList.add('capture-detected');
    }
    
    // Mostrar alerta brevemente antes de encerrar
    this.showAlertBeforeTermination();
    
    // Encerrar a sessão imediatamente após a primeira tentativa
    setTimeout(() => {
      this.terminateSession();
    }, 1500); // Pequeno delay para o usuário ver o alerta
  }
    // Mostrar alerta de segurança
  showAlert() {
    // Atualizar contador de tentativas
    const counter = this.alertBox.querySelector('#attempt-counter');
    if (counter) {
      counter.textContent = this.captureAttempts;
    }
    
    // Mostrar alerta
    this.alertBox.classList.add('active');
  }
  
  // Mostrar alerta de encerramento imediato
  showAlertBeforeTermination() {
    // Modificar o conteúdo do alerta para indicar encerramento imediato
    this.alertBox.innerHTML = `
      <h3>Alerta de Segurança Crítico</h3>
      <p>Tentativa de captura de tela detectada. Este documento é estritamente confidencial.</p>
      <p class="critical-alert">A sessão será encerrada imediatamente por motivos de segurança.</p>
    `;
    
    // Mostrar alerta
    this.alertBox.classList.add('active');
  }
  
  // Fechar alerta
  closeAlert() {
    this.alertBox.classList.remove('active');
  }
  
  // Resetar estado de captura
  resetCaptureState() {
    this.captureDetected = false;
    this.overlay.classList.remove('active');
    
    if (this.pdfViewer) {
      this.pdfViewer.classList.remove('capture-detected');
    }
  }
    // Encerrar sessão imediatamente após tentativa de captura de tela
  terminateSession() {
    console.error("Violação de segurança: Tentativa de captura de tela detectada. Encerrando sessão.");
    
    // Registrar evento de segurança (poderia ser enviado para um servidor de logs)
    const securityEvent = {
      type: 'security_violation',
      action: 'screenshot_attempt',
      timestamp: new Date().toISOString(),
      userInfo: {
        authType: sessionStorage.getItem('auth-type') || 'unknown',
        // Não incluir informações sensíveis como email ou wallet no log
      }
    };
    console.warn('Evento de segurança registrado:', securityEvent);
    
    // Limpar sessão
    sessionStorage.clear();
    
    // Aplicar efeito visual de encerramento de sessão
    document.body.classList.add('security-lockdown');
    
    // Redirecionar para página inicial
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}

// Inicializar o sistema quando o script for carregado
const antiScreenshot = new AntiScreenshotSystem();
window.addEventListener('load', () => antiScreenshot.init());

// Exportar para uso global
window.antiScreenshot = antiScreenshot;
