/**
 * loader.js
 * Script de carregador para manter compatibilidade com o código original
 * Isso permite uma transição suave entre a antiga estrutura monolítica e a nova estrutura modular.
 */

// Verificar se a página está usando os módulos ES
const isUsingModules = document.querySelector('script[type="module"][src="src/js/app.js"]') !== null;

if (!isUsingModules) {
  console.warn("Utilizando loader de compatibilidade em vez de módulos ES. Considere atualizar para a versão modular completa.");
  
  // Função para carregar script dinamicamente
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Carregar scripts na ordem correta
  async function loadScripts() {
    try {
      // Carregar utilitários primeiro
      await loadScript('src/js/utils/utils.js');
      
      // Carregar módulos principais
      await loadScript('src/js/modules/config.js');
      await loadScript('src/js/modules/auth.js');
      await loadScript('src/js/modules/wallet-connector.js');
      await loadScript('src/js/modules/pdf-viewer.js');
      await loadScript('src/js/modules/ui-manager.js');
      
      // Finalmente carregar o app principal
      await loadScript('src/js/app.js');
      
      console.log("Scripts carregados com sucesso via loader de compatibilidade");
    } catch (error) {
      console.error("Erro ao carregar scripts:", error);
      alert("Erro ao carregar os scripts da aplicação. Por favor, recarregue a página.");
    }
  }
  
  // Iniciar carregamento quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', loadScripts);
}
