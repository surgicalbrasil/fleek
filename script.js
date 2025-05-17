// Inicializar o Magic SDK
const magic = new Magic("pk_live_20134EF9B8F26232");

// Estado da autenticação
let currentAuthMethod = 'email';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Função para verificar se o e-mail está autorizado no backend
async function isEmailAuthorized(email) {
  try {
    console.log("Validando e-mail no backend...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-authorized-emails");
    if (!response.ok) {
      throw new Error(`Erro ao acessar o backend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API:", data);

    // Verifica se a resposta contém a lista de e-mails
    if (!data.emails || !Array.isArray(data.emails)) {
      console.error("Formato inesperado do JSON retornado pelo backend:", data);
      return false;
    }

    // Normaliza e verifica se o e-mail está autorizado
    const authorized = data.emails.map(e => e.toLowerCase()).includes(email.toLowerCase());
    console.log("E-mail autorizado?", authorized);
    return authorized;

  } catch (error) {
    console.error("Erro na validação do e-mail:", error);
    alert("Erro ao validar o e-mail. Tente novamente mais tarde.");
    return false;
  }
}

// Configurar os botões de alternância de autenticação
document.querySelectorAll('.auth-toggle').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.auth-toggle').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentAuthMethod = button.dataset.auth;
    
    const emailForm = document.querySelector('.auth-form');
    emailForm.style.display = currentAuthMethod === 'email' ? 'block' : 'none';
    
    // Atualizar o texto do botão de login conforme o método
    const loginButton = document.getElementById('login-button');
    if (currentAuthMethod === 'email') {
      loginButton.textContent = 'Fazer Login';
    } else if (currentAuthMethod === 'wallet') {
      loginButton.textContent = 'Conectar Carteira';
    }
  });
});

// Handler do botão de login
document.getElementById("login-button").addEventListener("click", async () => {
  if (currentAuthMethod === 'email') {
    const emailInput = document.getElementById("user-email");
    const email = emailInput.value.trim();

    if (!email) {
      alert("Por favor, insira um e-mail válido.");
      emailInput.focus();
      return;
    }

    const isAuthorized = await isEmailAuthorized(email);
    if (!isAuthorized) {
      alert("E-mail não autorizado. Assine o NDA.");
      return;
    }

    try {
      console.log("Realizando login com email...");
      await magic.auth.loginWithMagicLink({ email });
      const token = await magic.user.getIdToken();
      sessionStorage.setItem("auth-type", "email");
      sessionStorage.setItem("magic-token", token);
      document.getElementById("user-email").disabled = true;
      alert("Login realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      alert("Erro ao realizar login.");
    }  } else if (currentAuthMethod === 'wallet') {
    // Conectar via carteira (apenas MetaMask)
    try {
      await connectWallet();
    } catch (error) {
      console.error("Erro ao conectar com MetaMask:", error);
      
      if (error.message.includes("MetaMask não está instalada")) {
        alert("Por favor, instale a extensão MetaMask para usar esta funcionalidade.");
      } else if (error.message.includes("User rejected")) {
        alert("Você rejeitou a solicitação de conexão com a MetaMask.");
      } else {
        alert("Erro ao conectar com a MetaMask. Por favor, tente novamente.");
      }
    }
  }
});

// Função para acessar o documento
document.getElementById("acessar-arquivo").addEventListener("click", async () => {
  const authType = sessionStorage.getItem("auth-type");
  
  if (!authType) {
    alert("Sessão expirada. Faça login novamente.");
    return;
  }
  
  try {
    console.log("Buscando o documento PDF...");
    let requestBody = { 
      authType,
      fileName: "Paper.pdf" 
    };
    
    // Adicionar os dados de autenticação dependendo do método
    if (authType === "email") {
      const token = sessionStorage.getItem("magic-token");
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      requestBody.token = token;
    } else if (authType === "wallet") {
      const walletAddress = sessionStorage.getItem("wallet-address");
      if (!walletAddress) {
        alert("Carteira não conectada. Conecte sua carteira novamente.");
        return;
      }
      requestBody.walletAddress = walletAddress;
    }

    const response = await fetch("https://fleek-nine.vercel.app/api/get-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error("Erro ao acessar o documento.");
    }

    const pdfBlob = await response.blob();
    console.log("Documento PDF recebido:", pdfBlob);
    renderPDF(pdfBlob);
  } catch (error) {
    console.error("Erro ao carregar o documento:", error);
    alert("Erro ao acessar o documento.");
  }
});

// Função para renderizar o PDF
async function renderPDF(pdfBlob) {
  const pdfViewer = document.getElementById("pdf-viewer");
  pdfViewer.innerHTML = ""; // Limpar visualizador

  try {
    console.log("Renderizando o PDF...");
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfBlob)).promise;
    console.log(`Total de páginas: ${pdf.numPages}`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      pdfViewer.appendChild(canvas);
      console.log(`Página ${i} renderizada.`);
    }
  } catch (error) {
    console.error("Erro ao renderizar o PDF:", error);
    alert("Erro ao renderizar o PDF.");
  }
}

// Função para abrir o modal do Metaverso
document.getElementById("cadastro-metaverso").addEventListener("click", () => {
  const authType = sessionStorage.getItem("auth-type");
  
  if (!authType) {
    alert("Sessão expirada. Faça login novamente.");
    return;
  }
  
  if (authType === "email") {
    const token = sessionStorage.getItem("magic-token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      return;
    }
  } else if (authType === "wallet") {
    const walletAddress = sessionStorage.getItem("wallet-address");
    if (!walletAddress) {
      alert("Carteira não conectada. Conecte sua carteira novamente.");
      return;
    }
  }
  
  document.getElementById("metaverso-modal").style.display = "flex";
});

// Função para fechar o modal
document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("metaverso-modal").style.display = "none";
});

// Função de Logout
document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    console.log("Realizando logout...");
    const authType = sessionStorage.getItem("auth-type");
    
    if (authType === "email") {
      await magic.user.logout();
    } else if (authType === "wallet") {
      await disconnectWallet();
    }
    
    // Limpar sessão e resetar UI
    sessionStorage.clear();
    document.getElementById("user-email").disabled = false;
    document.getElementById("user-email").value = "";
    document.getElementById("login-button").disabled = false;
    document.querySelectorAll('.auth-toggle').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-auth="email"]').classList.add('active');
    document.querySelector('.auth-form').style.display = 'block';
    currentAuthMethod = 'email';
    
    alert("Logout realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    alert("Erro ao realizar logout.");
  }
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener("click", (event) => {
  const modal = document.getElementById("metaverso-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Variáveis para utilização do módulo wallet-connect.js
const walletConnect = window.walletConnect;

// Função para verificar se o endereço da carteira está autorizado
async function isWalletAuthorized(address) {
  try {
    console.log("Validando endereço de carteira no backend...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-authorized-wallets");
    if (!response.ok) {
      throw new Error(`Erro ao acessar o backend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API:", data);

    // Verifica se a resposta contém a lista de carteiras
    if (!data.wallets || !Array.isArray(data.wallets)) {
      console.error("Formato inesperado do JSON retornado pelo backend:", data);
      return false;
    }

    // Normaliza e verifica se o endereço está autorizado
    const authorized = data.wallets.map(w => w.toLowerCase()).includes(address.toLowerCase());
    console.log("Carteira autorizada?", authorized);
    return authorized;
  } catch (error) {
    console.error("Erro na validação da carteira:", error);
    alert("Erro ao validar a carteira. Tente novamente mais tarde.");
    return false;
  }
}

// Função para conectar a carteira usando o módulo wallet-connect.js
async function connectWallet() {
  try {
    console.log("Conectando carteira via wallet-connect.js...");
    
    // Chamar a função de conexão do módulo wallet-connect.js
    const connection = await walletConnect.connect();
    
    if (!connection || !connection.account) {
      throw new Error("Falha na conexão com a carteira");
    }
    
    console.log("Carteira conectada:", connection.account);
    
    try {
      // Verificar se a carteira está autorizada
      const isAuthorized = await isWalletAuthorized(connection.account);
      if (!isAuthorized) {
        await walletConnect.disconnect();
        alert("Carteira não autorizada. Assine o NDA.");
        return;
      }

      // Salvar informações no sessionStorage
      sessionStorage.setItem("auth-type", "wallet");
      sessionStorage.setItem("wallet-address", connection.account);

      // Atualizar UI
      document.getElementById("login-button").disabled = true;
      document.getElementById("user-email").disabled = true;
      
      // Mostrar endereço da carteira na interface
      const walletInfo = document.getElementById("wallet-info");
      const walletAddressEl = document.getElementById("wallet-address");
      walletInfo.classList.add("active");
      walletAddressEl.textContent = walletConnect.formatAddress(connection.account);

      // Configurar eventos personalizados para mudanças na carteira
      document.addEventListener('walletAccountChanged', handleWalletAccountChanged);
      document.addEventListener('walletDisconnected', handleWalletDisconnected);

      alert("Carteira conectada com sucesso!");
    } catch (authError) {
      console.error("Erro na verificação de autorização:", authError);
      await walletConnect.disconnect();
      alert("Erro ao verificar autorização da carteira. Tente novamente mais tarde.");
    }
  } catch (error) {
    console.error("Erro ao conectar a carteira:", error);
    if (error.message.includes("User rejected") || error.message.includes("User closed")) {
      alert("Conexão cancelada pelo usuário.");
    } else {
      alert("Erro ao conectar a carteira. Tente novamente.");
    }
  }
}

// Função auxiliar para desconexão segura da carteira
async function disconnectWallet() {
  try {
    await walletConnect.disconnect();
    
    // Remover da sessão
    sessionStorage.removeItem("wallet-address");
    sessionStorage.removeItem("auth-type");
    
    // Limpar UI
    const walletInfo = document.getElementById("wallet-info");
    walletInfo.classList.remove("active");
    document.getElementById("wallet-address").textContent = "";
    
    // Reativar botões
    document.getElementById("login-button").disabled = false;
    document.getElementById("user-email").disabled = false;
  } catch (err) {
    console.error("Erro ao desconectar carteira:", err);
  }
}

// Handler para mudança de conta da carteira
function handleWalletAccountChanged(event) {
  const newAccount = event.detail.account;
  console.log("Conta da carteira alterada:", newAccount);
  
  sessionStorage.setItem("wallet-address", newAccount);
  
  // Atualizar endereço na interface
  const walletAddressEl = document.getElementById("wallet-address");
  walletAddressEl.textContent = walletConnect.formatAddress(newAccount);
}

// Handler para desconexão da carteira
function handleWalletDisconnected() {
  console.log("Carteira desconectada");
  
  sessionStorage.removeItem("wallet-address");
  sessionStorage.removeItem("auth-type");
  
  document.getElementById("login-button").disabled = false;
  document.getElementById("user-email").disabled = false;
  
  // Ocultar informações da carteira
  const walletInfo = document.getElementById("wallet-info");
  walletInfo.classList.remove("active");
  document.getElementById("wallet-address").textContent = "";
}

// Função para inicializar a aplicação
async function initializeApp() {
  console.log("Inicializando aplicação...");
  
  // Verificar se já existe uma sessão ativa
  const authType = sessionStorage.getItem("auth-type");
  
  if (authType === "email") {
    // Verificar se o token ainda é válido
    const token = sessionStorage.getItem("magic-token");
    if (token) {
      try {
        // Tentar fazer uma operação simples para verificar o token
        const isLoggedIn = await magic.user.isLoggedIn();
        if (isLoggedIn) {
          console.log("Sessão de email válida");
          document.getElementById("user-email").disabled = true;
          document.getElementById("login-button").disabled = true;
        } else {
          console.log("Sessão de email expirada");
          sessionStorage.clear();
        }
      } catch (error) {
        console.error("Erro ao verificar sessão de email:", error);
        sessionStorage.clear();
      }
    } else {
      sessionStorage.clear();
    }
  } else if (authType === "wallet") {
    const walletAddress = sessionStorage.getItem("wallet-address");
    
    if (walletAddress) {
      try {
        console.log("Restaurando sessão de carteira...");
        // Tentar restaurar a conexão da carteira
        const connection = await walletConnect.restore();
        
        if (connection && connection.account) {
          console.log("Sessão de carteira restaurada:", connection.account);
          
          // Configurar a interface
          document.querySelectorAll('.auth-toggle').forEach(btn => btn.classList.remove('active'));
          document.querySelector('[data-auth="wallet"]').classList.add('active');
          document.querySelector('.auth-form').style.display = 'none';
          document.getElementById("login-button").textContent = 'Conectar Carteira';
          document.getElementById("login-button").disabled = true;
          currentAuthMethod = 'wallet';
          
          // Mostrar endereço da carteira na interface
          const walletInfo = document.getElementById("wallet-info");
          const walletAddressEl = document.getElementById("wallet-address");
          walletInfo.classList.add("active");
          walletAddressEl.textContent = walletConnect.formatAddress(connection.account);
          
          // Configurar eventos personalizados para mudanças na carteira
          document.addEventListener('walletAccountChanged', handleWalletAccountChanged);
          document.addEventListener('walletDisconnected', handleWalletDisconnected);
        } else {
          console.log("Não foi possível restaurar a sessão de carteira");
          sessionStorage.clear();
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão de carteira:", error);
        sessionStorage.clear();
      }
    } else {
      sessionStorage.clear();
    }
  }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", initializeApp);
