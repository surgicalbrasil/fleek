// Sistema de proteção contra impressão

class AntiPrintSystem {
  constructor() {
    this.initialized = false;
    this.antiScreenshot = null; // Referência para o sistema anti-screenshot
  }
  
  // Inicializar o sistema
  init(antiScreenshotRef) {
    if (this.initialized) return;
    
    console.log("Inicializando sistema anti-impressão...");
    
    // Armazenar referência ao sistema anti-screenshot
    this.antiScreenshot = antiScreenshotRef || window.antiScreenshot;
    
    if (!this.antiScreenshot) {
      console.error("Sistema anti-screenshot não encontrado. Funcionalidades limitadas.");
    }
    
    // Sobrescrever função de impressão
    this.overridePrintFunctions();
    
    // Configurar detectores de eventos
    this.setupEventListeners();
    
    // Configurar proteção para iframes
    this.setupIframeProtection();
    
    // Configurar CSS de mídia
    this.setupPrintMediaCSS();
    
    console.log("Sistema anti-impressão inicializado");
    this.initialized = true;
  }
  
  // Sobrescrever funções de impressão
  overridePrintFunctions() {
    try {
      // Guardar referência original (para debugging)
      window._originalWindowPrint = window.print;
      
      // Sobrescrever função print global
      window.print = () => {
        console.warn("Tentativa de impressão via método window.print() detectada e bloqueada");
        this.handlePrintAttempt();
        return false;
      };
      
      // Métodos alternativos de impressão
      if (window.document && window.document.execCommand) {
        window.document._originalExecCommand = window.document.execCommand;
        window.document.execCommand = (command, ...args) => {
          if (command && command.toLowerCase() === 'print') {
            console.warn("Tentativa de impressão via document.execCommand('print') detectada e bloqueada");
            this.handlePrintAttempt();
            return false;
          }
          
          // Passar outros comandos para a função original
          return window.document._originalExecCommand(command, ...args);
        };
      }
      
      console.log("Funções de impressão sobrescritas com sucesso");
    } catch (e) {
      console.error("Erro ao sobrescrever funções de impressão:", e);
    }
  }
  
  // Configurar listeners de eventos relacionados a impressão
  setupEventListeners() {
    // Detectar evento beforeprint
    window.addEventListener('beforeprint', (e) => {
      console.warn("Evento beforeprint detectado");
      e.preventDefault();
      e.stopImmediatePropagation();
      this.handlePrintAttempt();
      return false;
    }, true);
    
    // Detectar atalhos de teclado comuns para impressão
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.keyCode === 80)) {
        console.warn("Atalho de impressão detectado: Ctrl/Cmd + P");
        e.preventDefault();
        e.stopImmediatePropagation();
        this.handlePrintAttempt();
        return false;
      }
    }, true);
    
    // Detectar tentativas de abrir menu de impressão através de botão direito
    document.addEventListener('contextmenu', (e) => {
      // Já bloqueado pelo sistema anti-screenshot, mas registrado aqui também
      console.log("Menu de contexto bloqueado - possível acesso a opções de impressão");
    });
  }
  
  // Configurar proteção para iframes
  setupIframeProtection() {
    try {
      // Proteger iframes existentes
      document.querySelectorAll('iframe').forEach(iframe => {
        this.protectIframe(iframe);
      });
      
      // Monitorar novos iframes
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes && mutation.addedNodes.length) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              if (node.nodeName && node.nodeName.toLowerCase() === 'iframe') {
                console.log("Novo iframe detectado - aplicando proteção contra impressão");
                this.protectIframe(node);
              }
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (e) {
      console.error("Erro ao configurar proteção para iframes:", e);
    }
  }
  
  // Proteger um iframe específico
  protectIframe(iframe) {
    try {
      iframe.addEventListener('load', () => {
        try {
          if (iframe.contentWindow) {
            // Sobrescrever função print no iframe
            iframe.contentWindow.print = () => {
              console.warn("Tentativa de impressão via iframe bloqueada");
              this.handlePrintAttempt();
              return false;
            };
            
            // Adicionar listener para atalhos de teclado no iframe
            if (iframe.contentDocument) {
              iframe.contentDocument.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                  e.preventDefault();
                  e.stopPropagation();
                  console.warn("Tentativa de impressão via atalho em iframe detectada");
                  this.handlePrintAttempt();
                  return false;
                }
              }, true);
              
              // Adicionar eventos beforeprint no iframe
              iframe.contentWindow.addEventListener('beforeprint', (e) => {
                console.warn("Tentativa de impressão via iframe detectada");
                e.preventDefault();
                e.stopPropagation();
                this.handlePrintAttempt();
                return false;
              }, true);
            }
          }
        } catch (e) {
          // Ignora erros de same-origin policy
          console.log("Não foi possível acessar o conteúdo do iframe - possível restrição de cross-origin");
        }
      });
    } catch (e) {
      console.error("Erro ao proteger iframe:", e);
    }
  }
  
  // Configurar CSS para mídia de impressão
  setupPrintMediaCSS() {
    try {
      // Criar estilo para mídia de impressão
      const printStyle = document.createElement('style');
      printStyle.setAttribute('media', 'print');
      printStyle.textContent = `
        body * {
          display: none !important;
        }
        
        body:after {
          content: "IMPRESSÃO NÃO AUTORIZADA. Este documento está protegido contra impressão.";
          display: block !important;
          font-size: 24px;
          color: #dc3545;
          font-weight: bold;
          text-align: center;
          margin: 50px;
          border: 5px solid #dc3545;
          padding: 50px;
        }
      `;
      
      document.head.appendChild(printStyle);
      console.log("CSS de proteção para mídia de impressão adicionado");
    } catch (e) {
      console.error("Erro ao adicionar CSS para mídia de impressão:", e);
    }
  }
  
  // Tratar tentativa de impressão
  handlePrintAttempt() {
    console.warn("Tentativa de impressão detectada - Aplicando medidas de segurança");
    
    // Se tivermos referência ao sistema anti-screenshot, usar a mesma lógica
    if (this.antiScreenshot && typeof this.antiScreenshot.handlePrintAttempt === 'function') {
      this.antiScreenshot.handlePrintAttempt();
    } else {
      // Caso contrário, implementação própria
      this.showPrintAlert();
      
      // Registrar evento
      const securityEvent = {
        type: 'security_violation',
        action: 'print_attempt',
        timestamp: new Date().toISOString()
      };
      console.warn('Evento de segurança registrado:', securityEvent);
      
      // Terminar sessão
      setTimeout(() => {
        this.terminateSession();
      }, 1500);
    }
  }
  
  // Mostrar alerta de tentativa de impressão
  showPrintAlert() {
    // Criar alerta se não existir
    if (!this.alertBox) {
      this.alertBox = document.createElement('div');
      this.alertBox.className = 'security-alert';
      document.body.appendChild(this.alertBox);
    }
    
    // Atualizar conteúdo
    this.alertBox.innerHTML = `
      <h3>Alerta de Segurança Crítico</h3>
      <p>Tentativa de impressão detectada. Este documento é estritamente confidencial e protegido contra impressões não autorizadas.</p>
      <p class="critical-alert">A sessão será encerrada imediatamente por motivos de segurança.</p>
    `;
    
    // Mostrar alerta
    this.alertBox.classList.add('active');
  }
  
  // Encerrar sessão
  terminateSession() {
    // Limpar sessão
    sessionStorage.clear();
    
    // Aplicar efeito visual
    document.body.classList.add('security-lockdown');
    
    // Redirecionar
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
}

// Inicializar o sistema quando o script for carregado
const antiPrint = new AntiPrintSystem();
window.addEventListener('load', () => {
  // Inicializar após o sistema anti-screenshot
  setTimeout(() => {
    antiPrint.init(window.antiScreenshot);
  }, 100);
});

// Exportar para uso global
window.antiPrint = antiPrint;
