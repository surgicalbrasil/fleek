// Test script para verificar a funcionalidade de Wallet Connect

// Testar a conexão com a carteira
async function testWalletConnection() {
  console.log("===== Iniciando testes de conexão de carteira =====");
  
  try {
    // 1. Verificar se as bibliotecas Web3 e Alchemy estão disponíveis
    console.log("1. Verificando disponibilidade de bibliotecas...");
    if (!window.Web3) {
      console.error("❌ Web3 não está disponível");
    } else {
      console.log("✅ Web3 está disponível");
    }
    
    if (!window.AlchemyWeb3) {
      console.error("❌ AlchemyWeb3 não está disponível");
    } else {
      console.log("✅ AlchemyWeb3 está disponível");
    }
    
    // 2. Verificar se o Web3Modal está configurado corretamente
    console.log("2. Verificando configuração do Web3Modal...");
    if (!window.web3Modal) {
      console.error("❌ Web3Modal não está inicializado");
    } else {
      console.log("✅ Web3Modal está inicializado");
      console.log("Configurações:", window.web3Modal);
    }
    
    // 3. Verificar se as funções de carteira estão disponíveis
    console.log("3. Verificando funções de carteira...");
    if (typeof window.connectWallet !== "function") {
      console.error("❌ Função connectWallet não está definida");
    } else {
      console.log("✅ Função connectWallet está definida");
    }
    
    if (typeof window.isWalletAuthorized !== "function") {
      console.error("❌ Função isWalletAuthorized não está definida");
    } else {
      console.log("✅ Função isWalletAuthorized está definida");
    }
    
    // 4. Verificar se a API Alchemy está respondendo
    console.log("4. Testando conexão com a API Alchemy...");
    try {
      const alchemyWeb3 = AlchemyWeb3.createAlchemyWeb3(
        "https://eth-mainnet.alchemyapi.io/v2/rW3MzqivxqHlGZPwxSMCs0hherD2pFsH"
      );
      const blockNumber = await alchemyWeb3.eth.getBlockNumber();
      console.log(`✅ API Alchemy respondeu. Número do bloco atual: ${blockNumber}`);
    } catch (error) {
      console.error("❌ Erro ao conectar com a API Alchemy:", error);
    }
    
  } catch (error) {
    console.error("Erro nos testes:", error);
  }
  
  console.log("===== Testes concluídos =====");
}

// Executar os testes após a página carregar completamente
window.addEventListener('load', () => {
  // Adicionar botão de teste na interface se estiver em modo de desenvolvimento
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const testButton = document.createElement('button');
    testButton.textContent = 'Executar Testes de Wallet';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '1000';
    testButton.style.padding = '8px 12px';
    testButton.style.backgroundColor = '#6c757d';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '4px';
    testButton.style.cursor = 'pointer';
    
    testButton.addEventListener('click', testWalletConnection);
    
    document.body.appendChild(testButton);
    console.log("Botão de teste adicionado. Clique para executar testes.");
  }
});
