// magic-sdk-module-test.js
// Script para testar a funcionalidade do módulo Magic SDK

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Iniciando testes do módulo Magic SDK...");
  
  try {
    // Verificar se o módulo está disponível
    if (typeof window.magicSDK === 'undefined') {
      console.error("❌ ERRO: O módulo Magic SDK não está disponível");
      document.getElementById('test-result').innerHTML = 
        '<div class="error">❌ O módulo Magic SDK não está carregado corretamente</div>';
      return;
    }
    
    console.log("✓ Módulo Magic SDK disponível");
    
    // Testar a inicialização do Magic SDK
    const magic = await window.magicSDK.initMagicSDK();
    if (!magic) {
      console.error("❌ ERRO: Falha ao inicializar o Magic SDK");
      document.getElementById('test-result').innerHTML = 
        '<div class="error">❌ Falha ao inicializar o Magic SDK</div>';
      return;
    }
    
    console.log("✓ Magic SDK inicializado com sucesso");
    
    // Verificar função de verificação de login
    const isLoggedIn = await window.magicSDK.isMagicLoggedIn();
    console.log(`✓ Verificação de login funcionando: ${isLoggedIn ? 'Usuário logado' : 'Usuário não logado'}`);
    
    // Exibir resultado de sucesso
    document.getElementById('test-result').innerHTML = 
      `<div class="success">
        ✅ Módulo Magic SDK funcionando corretamente<br>
        - Módulo disponível: ✓<br>
        - Inicialização: ✓<br>
        - Verificação de login: ✓ (${isLoggedIn ? 'Usuário logado' : 'Usuário não logado'})
      </div>`;
    
  } catch (error) {
    console.error("❌ ERRO durante o teste do módulo Magic SDK:", error);
    document.getElementById('test-result').innerHTML = 
      `<div class="error">
        ❌ Erro ao testar o módulo Magic SDK<br>
        ${error.message || error}
      </div>`;
  }
});
