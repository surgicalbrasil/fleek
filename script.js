// Inicializar o Magic SDK
const magic = new Magic("pk_live_20134EF9B8F26232");

// Estado da autenticação
let currentAuthMethod = 'email';

// Inicializar o Web3Modal com Alchemy
const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          1: `https://eth-mainnet.g.alchemy.com/v2/rW3MzqivxqHlGZPwxSMCs0hherD2pFsH`,
          5: `https://eth-goerli.g.alchemy.com/v2/rW3MzqivxqHlGZPwxSMCs0hherD2pFsH`,
          11155111: `https://eth-sepolia.g.alchemy.com/v2/rW3MzqivxqHlGZPwxSMCs0hherD2pFsH`
        }
      }
    }
  }
});

// Variáveis para WalletConnect
let provider = null;
let web3 = null;
let account = null;

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Função para mostrar mensagens de erro/sucesso
function showMessage(message, isError = false) {
  console.log(isError ? 'Erro:' : 'Sucesso:', message);
  window.alert(message);
}

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

    if (!data.emails || !Array.isArray(data.emails)) {
      throw new Error("Formato inesperado do JSON retornado pelo backend");
    }

    const authorized = data.emails.map(e => e.toLowerCase()).includes(email.toLowerCase());
    console.log("E-mail autorizado?", authorized);
    return authorized;

  } catch (error) {
    console.error("Erro na validação do e-mail:", error);
    showMessage("Erro ao validar o e-mail. Tente novamente mais tarde.", true);
    return false;
  }
}

// Função para verificar se a wallet está autorizada no backend
async function isWalletAuthorized(walletAddress) {
  try {
    console.log("Validando wallet no backend...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-authorized-wallets");
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar o backend: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Resposta da API:", data);

    if (!data.wallets || !Array.isArray(data.wallets)) {
      throw new Error("Formato inesperado do JSON retornado pelo backend");
    }

    const authorized = data.wallets.map(w => w.toLowerCase()).includes(walletAddress.toLowerCase());
    console.log("Wallet autorizada?", authorized);
    return authorized;

  } catch (error) {
    console.error("Erro na validação da wallet:", error);
    showMessage("Erro ao validar a wallet. Tente novamente mais tarde.", true);
    return false;
  }
}

// Função para limpar o estado da wallet
async function clearWalletState() {
  if (provider?.close) {
    try {
      await provider.close();
    } catch (e) {
      console.error("Erro ao fechar provider:", e);
    }
  }
  
  try {
    await web3Modal.clearCachedProvider();
  } catch (e) {
    console.error("Erro ao limpar cache do provider:", e);
  }
  
  provider = null;
  web3 = null;
  account = null;
}

// Configurar os botões de alternância de autenticação
document.querySelectorAll('.auth-toggle').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      // Remover classe active de todos os botões
      document.querySelectorAll('.auth-toggle').forEach(btn => btn.classList.remove('active'));
      
      // Adicionar classe active ao botão clicado
      button.classList.add('active');
      
      // Atualizar método de autenticação
      currentAuthMethod = button.dataset.auth;
      
      // Mostrar/esconder formulário de email
      const emailForm = document.querySelector('.auth-form');
      if (emailForm) {
        emailForm.style.display = currentAuthMethod === 'email' ? 'flex' : 'none';
      }

      // Se mudar para wallet e já estiver conectado, limpar o estado
      if (currentAuthMethod === 'wallet' && provider) {
        await clearWalletState();
      }

      console.log('Método de autenticação alterado para:', currentAuthMethod);
    } catch (error) {
      console.error('Erro ao alternar método de autenticação:', error);
      showMessage('Erro ao alternar método de autenticação. Tente novamente.', true);
    }
  });
});

// Handler do botão de login
document.getElementById("login-button").addEventListener("click", async () => {
  try {
    if (currentAuthMethod === 'email') {
      const emailInput = document.getElementById("user-email");
      const email = emailInput.value.trim();

      if (!email) {
        showMessage("Por favor, insira um e-mail válido.", true);
        emailInput.focus();
        return;
      }

      const isAuthorized = await isEmailAuthorized(email);
      if (!isAuthorized) {
        showMessage("E-mail não autorizado. Assine o NDA.", true);
        return;
      }

      console.log("Realizando login com email...");
      await magic.auth.loginWithMagicLink({ email });
      const token = await magic.user.getIdToken();
      
      sessionStorage.setItem("auth-type", "email");
      sessionStorage.setItem("magic-token", token);
      document.getElementById("user-email").disabled = true;
      
      showMessage("Login realizado com sucesso!");
      
    } else if (currentAuthMethod === 'wallet') {
      if (!web3Modal) {
        showMessage("Web3Modal não está inicializado.", true);
        return;
      }

      console.log("Conectando wallet...");
      provider = await web3Modal.connect();
      
      if (!provider) {
        showMessage("Não foi possível conectar à wallet.", true);
        return;
      }

      web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      
      if (!accounts || accounts.length === 0) {
        showMessage("Nenhuma conta encontrada.", true);
        await clearWalletState();
        return;
      }

      account = accounts[0];
      console.log("Conta conectada:", account);

      const isAuthorized = await isWalletAuthorized(account);
      if (!isAuthorized) {
        showMessage("Wallet não autorizada. Assine o NDA.", true);
        await clearWalletState();
        return;
      }
      
      sessionStorage.setItem("auth-type", "wallet");
      sessionStorage.setItem("wallet-address", account);
      showMessage("Login realizado com sucesso via wallet!");

      // Configurar listeners para eventos da wallet
      provider.on("accountsChanged", async (accounts) => {
        if (accounts.length === 0) {
          await clearWalletState();
          sessionStorage.clear();
          showMessage("Wallet desconectada.");
        }
      });

      provider.on("disconnect", async () => {
        await clearWalletState();
        sessionStorage.clear();
        showMessage("Wallet desconectada.");
      });
    }
  } catch (error) {
    console.error("Erro durante o login:", error);
    showMessage(error.message || "Erro durante o login. Tente novamente.", true);
    
    if (currentAuthMethod === 'wallet') {
      await clearWalletState();
    }
  }
});

// Função para acessar o documento
document.getElementById("acessar-arquivo").addEventListener("click", async () => {
  try {
    const authType = sessionStorage.getItem("auth-type");
    const token = sessionStorage.getItem("magic-token");
    const walletAddress = sessionStorage.getItem("wallet-address");
    
    if (!authType || (!token && !walletAddress)) {
      showMessage("Sessão expirada. Faça login novamente.", true);
      return;
    }

    console.log("Buscando o documento PDF...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token,
        walletAddress,
        authType,
        fileName: "Paper.pdf" 
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao acessar o documento.");
    }

    const pdfBlob = await response.blob();
    console.log("Documento PDF recebido:", pdfBlob);
    await renderPDF(pdfBlob);
  } catch (error) {
    console.error("Erro ao carregar o documento:", error);
    showMessage("Erro ao acessar o documento.", true);
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
    showMessage("Erro ao renderizar o PDF.", true);
  }
}

// Função para abrir o modal do Metaverso
document.getElementById("cadastro-metaverso").addEventListener("click", () => {
  try {
    const authType = sessionStorage.getItem("auth-type");
    const token = sessionStorage.getItem("magic-token");
    const walletAddress = sessionStorage.getItem("wallet-address");
    
    if (!authType || (!token && !walletAddress)) {
      showMessage("Sessão expirada. Faça login novamente.", true);
      return;
    }
    
    document.getElementById("metaverso-modal").style.display = "flex";
  } catch (error) {
    console.error("Erro ao abrir modal do metaverso:", error);
    showMessage("Erro ao abrir modal do metaverso.", true);
  }
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
      await clearWalletState();
    }
    
    sessionStorage.clear();
    document.getElementById("user-email").disabled = false;
    document.getElementById("user-email").value = "";
    
    document.querySelectorAll('.auth-toggle').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('[data-auth="email"]').classList.add('active');
    document.querySelector('.auth-form').style.display = 'block';
    currentAuthMethod = 'email';
    
    showMessage("Logout realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao realizar logout:", error);
    showMessage("Erro ao realizar logout.", true);
  }
});

// Fechar o modal ao clicar fora do conteúdo
window.addEventListener("click", (event) => {
  const modal = document.getElementById("metaverso-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
