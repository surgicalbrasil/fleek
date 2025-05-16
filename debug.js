/**
 * Script de teste para conexão de carteiras
 * Este script adiciona um botão de debug à interface para
 * ajudar a verificar se a conexão de carteira está funcionando
 */

document.addEventListener('DOMContentLoaded', function() {
  // Criar botão de debug
  const debugBtn = document.createElement('button');
  debugBtn.id = 'debug-button';
  debugBtn.textContent = 'Debug Wallet';
  debugBtn.style.position = 'fixed';
  debugBtn.style.bottom = '20px';
  debugBtn.style.right = '20px';
  debugBtn.style.zIndex = '1000';
  debugBtn.style.padding = '8px 16px';
  debugBtn.style.background = '#6c757d';
  debugBtn.style.color = 'white';
  debugBtn.style.border = 'none';
  debugBtn.style.borderRadius = '4px';
  debugBtn.style.cursor = 'pointer';
  
  document.body.appendChild(debugBtn);
  
  // Adicionar handler para o botão de debug
  debugBtn.addEventListener('click', debugWalletConnection);
});

// Função para debug da conexão de carteira
async function debugWalletConnection() {
  console.log('=== Iniciando debug da conexão de carteira ===');
  
  try {
    // Verificar disponibilidade das bibliotecas
    console.log('1. Verificando bibliotecas:');
    console.log('   - Web3 disponível:', typeof Web3 !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    console.log('   - WalletConnect disponível:', typeof WalletConnectProvider !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    console.log('   - Web3Modal disponível:', typeof Web3Modal !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    console.log('   - CoinbaseWalletSDK disponível:', typeof CoinbaseWalletSDK !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    console.log('   - AlchemyWeb3 disponível:', typeof AlchemyWeb3 !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    
    // Verificar módulo wallet-connect
    console.log('2. Verificando módulo wallet-connect:');
    if (typeof window.walletConnect !== 'undefined') {
      console.log('   - Módulo wallet-connect disponível ✅');
      console.log('   - Funções disponíveis:');
      for (const key in window.walletConnect) {
        console.log(`     • ${key}: ${typeof window.walletConnect[key]}`);
      }
    } else {
      console.log('   - Módulo wallet-connect não está disponível ❌');
    }
    
    // Verificar estado da conexão
    console.log('3. Verificando estado da conexão:');
    const authType = sessionStorage.getItem('auth-type');
    const walletAddress = sessionStorage.getItem('wallet-address');
    console.log('   - Tipo de autenticação:', authType || 'Nenhum');
    console.log('   - Endereço da carteira:', walletAddress || 'Nenhum');
    
    // Verificar se a MetaMask está instalada
    console.log('4. Verificando carteiras disponíveis:');
    if (window.ethereum) {
      console.log('   - MetaMask está disponível ✅');
      console.log('     Contas conectadas:', await window.ethereum.request({ method: 'eth_accounts' }));
    } else {
      console.log('   - MetaMask não está disponível ❌');
    }
    
    // Criar caixa de diálogo para mostrar o resultado
    showDebugResults();
    
  } catch (error) {
    console.error('Erro durante o debug:', error);
  }
  
  console.log('=== Debug da conexão de carteira concluído ===');
}

// Função para exibir resultados de debug na interface
function showDebugResults() {
  // Criar overlay
  const overlay = document.createElement('div');
  overlay.id = 'debug-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
  overlay.style.zIndex = '2000';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  
  // Criar caixa de diálogo
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = 'white';
  dialog.style.padding = '20px';
  dialog.style.borderRadius = '8px';
  dialog.style.maxWidth = '80%';
  dialog.style.maxHeight = '80%';
  dialog.style.overflow = 'auto';
  dialog.style.position = 'relative';
  
  // Botão de fechar
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '10px';
  closeBtn.style.right = '10px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#333';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));
  
  // Título
  const title = document.createElement('h3');
  title.textContent = 'Diagnóstico de Conexão de Carteira';
  title.style.marginTop = '0';
  title.style.marginBottom = '20px';
  
  // Testar conexão
  const testBtn = document.createElement('button');
  testBtn.textContent = 'Testar Conexão';
  testBtn.style.padding = '10px 16px';
  testBtn.style.background = '#007bff';
  testBtn.style.color = 'white';
  testBtn.style.border = 'none';
  testBtn.style.borderRadius = '4px';
  testBtn.style.cursor = 'pointer';
  testBtn.style.marginBottom = '20px';
  testBtn.addEventListener('click', async () => {
    try {
      testBtn.disabled = true;
      testBtn.textContent = 'Conectando...';
      
      const testResult = document.createElement('pre');
      testResult.style.backgroundColor = '#f8f9fa';
      testResult.style.padding = '10px';
      testResult.style.borderRadius = '4px';
      testResult.style.overflowX = 'auto';
      testResult.style.marginTop = '10px';
      
      try {
        if (window.walletConnect) {
          const connection = await window.walletConnect.connect();
          testResult.textContent = JSON.stringify(connection, null, 2);
          testResult.style.color = '#28a745';
        } else {
          throw new Error("Módulo wallet-connect não está disponível");
        }
      } catch (error) {
        testResult.textContent = `Erro: ${error.message}\n${error.stack}`;
        testResult.style.color = '#dc3545';
      }
      
      document.getElementById('test-results').appendChild(testResult);
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Testar Conexão';
    }
  });
  
  // Área para resultados de teste
  const testResults = document.createElement('div');
  testResults.id = 'test-results';
  
  // Adicionar conteúdo
  dialog.appendChild(closeBtn);
  dialog.appendChild(title);
  dialog.appendChild(testBtn);
  dialog.appendChild(testResults);
  
  // Adicionar à página
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}
