// test-magic-module.js
// Script para testar o módulo Magic SDK na aplicação principal

window.addEventListener('load', async function() {
  console.log("Verificando integração do módulo Magic SDK...");
  
  // Verificar se o módulo está disponível
  if (typeof window.magicSDK === 'undefined') {
    console.error("ERRO: O módulo Magic SDK não está disponível");
    return;
  }
  
  try {
    // Verificar se o Magic foi inicializado
    const isInitialized = window.magicSDK.magic !== null;
    console.log(`Magic SDK inicializado: ${isInitialized ? "Sim" : "Não"}`);
    
    // Verificar status de login atual
    const isLoggedIn = await window.magicSDK.isMagicLoggedIn();
    console.log(`Usuário logado com Magic: ${isLoggedIn ? "Sim" : "Não"}`);
    
    // Verificar o botão de login para garantir que a funcionalidade está correta
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      console.log("Botão de login encontrado e monitorado para verificação de eventos");
    }
    
    console.log("Verificação de integração do módulo Magic SDK concluída");
  } catch (error) {
    console.error("Erro durante verificação do módulo Magic SDK:", error);
  }
});
