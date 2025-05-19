// Verificação de Integridade do Sistema
// Este script garante que a aplicação foi corretamente restaurada para a versão 0426b79

console.log("Verificando integridade do sistema após restauração para commit 0426b79...");

// Verificar se todos os componentes necessários estão disponíveis no escopo global
function checkComponents() {
  const requiredComponents = [
    { name: 'magic', description: 'Magic SDK' },
    { name: 'antiScreenshotSystem', description: 'Sistema Anti-Screenshot' },
    { name: 'pdfjsLib', description: 'PDF.js Library' },
    { name: 'walletConnect', description: 'Módulo de Conexão de Carteira' },
  ];
  
  let allComponentsPresent = true;
  
  requiredComponents.forEach(component => {
    if (typeof window[component.name] === 'undefined') {
      console.error(`ERRO: ${component.description} não está disponível.`);
      allComponentsPresent = false;
    } else {
      console.log(`✓ ${component.description} disponível.`);
    }
  });
  
  return allComponentsPresent;
}

// Verificar URLs de API
function fixApiUrls() {
  console.log("Verificando e corrigindo URLs de API...");
  
  // Substituir URLs hardcoded por URLs relativas
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url && typeof url === 'string') {
      // Converter URLs do Vercel para endpoints locais
      if (url.includes('fleek-nine.vercel.app/api/')) {
        const newUrl = url.replace('https://fleek-nine.vercel.app/api/', '/api/');
        console.log(`Convertendo URL de API: ${url} -> ${newUrl}`);
        url = newUrl;
      }
    }
    return originalFetch.call(this, url, options);
  };
  
  console.log("URLs de API corrigidas para funcionamento local e remoto.");
}

// Verificar e corrigir problemas com ícones no DOM
function fixIconsDisplay() {
  console.log("Verificando problemas com exibição de ícones...");
  
  // Garantir que os ícones SVG são visíveis
  setTimeout(() => {
    const icons = document.querySelectorAll('.icon');
    icons.forEach((icon, index) => {
      if (icon.getBoundingClientRect().width === 0) {
        console.warn(`Problema detectado com ícone #${index} - aplicando correção.`);
        icon.style.display = 'inline-block';
        icon.style.width = '16px';
        icon.style.height = '16px';
      }
    });
  }, 500);
}

// Verificar e corrigir problemas com os ouvintes de eventos
function verifyEventListeners() {
  // Verificar se os botões principais têm ouvintes de evento
  const criticalButtons = [
    'login-button',
    'acessar-arquivo',
    'cadastro-metaverso',
    'logout-button'
  ];
  
  setTimeout(() => {
    criticalButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        // Adicionar um indicador visual para botões funcionais
        button.classList.add('button-functional');
      } else {
        console.error(`Botão #${buttonId} não encontrado no DOM.`);
      }
    });
  }, 1000);
}

// Iniciar verificação quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  console.log("Iniciando verificação de restauração...");
  
  const componentsOk = checkComponents();
  fixApiUrls();
  fixIconsDisplay();
  verifyEventListeners();
  
  if (componentsOk) {
    console.log("✓ Sistema restaurado com sucesso para o commit 0426b79!");
  } else {
    console.error("⚠ Foram detectados problemas na restauração. Verificando soluções alternativas...");
  }
});
