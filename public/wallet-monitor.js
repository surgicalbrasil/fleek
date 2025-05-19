/**
 * Script de monitoramento para conexão de carteiras
 * Versão discreta sem elementos visuais na UI
 */

// Verificar disponibilidade das bibliotecas principais
window.addEventListener('load', function() {
  console.log("===== Monitoramento da carteira Web3 =====");
  console.log("Web3 disponível:", typeof Web3 !== 'undefined');
  console.log("window.ethereum disponível:", typeof window.ethereum !== 'undefined');
  console.log("===== Fim da verificação =====");
  
  // Executar diagnóstico silencioso
  silentDebugWalletConnection();
});

// Função para diagnóstico silencioso da conexão de carteira
async function silentDebugWalletConnection() {
  console.log('=== Iniciando monitoramento da conexão de carteira ===');
  
  try {
    // Verificar disponibilidade das bibliotecas
    console.log('1. Verificando bibliotecas essenciais:');
    console.log('   - Web3 disponível:', typeof Web3 !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    console.log('   - window.ethereum disponível:', typeof window.ethereum !== 'undefined' ? 'Sim ✅' : 'Não ❌');
    
    // Verificar módulo wallet-connect
    console.log('2. Verificando módulo wallet-connect:');
    if (typeof window.walletConnect !== 'undefined') {
      console.log('   - Módulo wallet-connect disponível ✅');
    } else {
      console.log('   - Módulo wallet-connect não está disponível ❌');
    }
    
    // Verificar estado da conexão
    console.log('3. Verificando estado da conexão:');
    const authType = sessionStorage.getItem('auth-type');
    const walletAddress = sessionStorage.getItem('wallet-address');
    console.log('   - Tipo de autenticação:', authType || 'Nenhum');
    console.log('   - Endereço da carteira:', walletAddress || 'Nenhum');
    
    // Verificar MetaMask
    console.log('4. Verificando MetaMask:');
    if (window.ethereum) {
      console.log('   - MetaMask disponível ✅');
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('   - Contas conectadas:', accounts.length > 0 ? accounts : 'Nenhuma');
    } else {
      console.log('   - MetaMask não disponível ❌');
    }
    
  } catch (error) {
    console.error('Erro durante o monitoramento:', error);
  }
  
  console.log('=== Monitoramento da conexão de carteira concluído ===');
}
