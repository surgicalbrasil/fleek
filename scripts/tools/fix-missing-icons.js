// Arquivo: fix-missing-icons.js
// Este script detecta ícones faltando e tenta corrigí-los

// Lista de ícones SVG para substituição
const iconReplacements = {
  'email': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  'wallet': `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="18" cy="12" r="2"></circle><path d="M10 8h4"></path><path d="M2 12h4"></path><path d="M10 16h2"></path></svg>`
};

// Verificar se há ícones vazios ou quebrados após o carregamento da página
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log("Verificando ícones ausentes...");
    
    // Verificar se todos os botões de autenticação têm ícones
    const emailToggle = document.querySelector('[data-auth="email"]');
    const walletToggle = document.querySelector('[data-auth="wallet"]');
    
    // Verificar e corrigir botão de e-mail
    if (emailToggle) {
      const emailIcon = emailToggle.querySelector('.icon');
      if (!emailIcon || emailIcon.getBoundingClientRect().width === 0) {
        console.log("Corrigindo ícone do botão de e-mail");
        emailToggle.innerHTML = iconReplacements.email + ' Login com Email';
      }
    }
    
    // Verificar e corrigir botão de carteira
    if (walletToggle) {
      const walletIcon = walletToggle.querySelector('.icon');
      if (!walletIcon || walletIcon.getBoundingClientRect().width === 0) {
        console.log("Corrigindo ícone do botão de carteira");
        walletToggle.innerHTML = iconReplacements.wallet + ' Login com Wallet';
      }
    }
  }, 1000);
});
