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
    }
  }
});

// Função para acessar o documento
document.getElementById("acessar-arquivo").addEventListener("click", async () => {
  const authType = sessionStorage.getItem("auth-type");
  const token = sessionStorage.getItem("magic-token");
  
  if (!authType || !token) {
    alert("Sessão expirada. Faça login novamente.");
    return;
  }

  try {
    console.log("Buscando o documento PDF...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        token,
        authType,
        fileName: "Paper.pdf" 
      }),
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
  const token = sessionStorage.getItem("magic-token");
  
  if (!authType || !token) {
    alert("Sessão expirada. Faça login novamente.");
    return;
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
    await magic.user.logout();
    sessionStorage.clear();
    document.getElementById("user-email").disabled = false;
    document.getElementById("user-email").value = "";
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

// Atualizar o Wallet Connect Provider para abrir um pop-up
const walletConnectProvider = new WalletConnectProvider.default({
  rpc: {
    1: "https://eth-mainnet.alchemyapi.io/v2/rW3MzqivxqHlGZPwxSMCs0hherD2pFsH"
  },
  qrcode: false // Desativa o QR Code para abrir um pop-up
});

// Função para conectar a carteira com pop-up
async function connectWallet() {
  try {
    console.log("Conectando carteira via Wallet Connect...");
    await walletConnectProvider.enable();
    const web3 = new Web3(walletConnectProvider);

    // Obter contas conectadas
    const accounts = await web3.eth.getAccounts();
    console.log("Carteira conectada:", accounts[0]);

    // Salvar informações no sessionStorage
    sessionStorage.setItem("auth-type", "wallet");
    sessionStorage.setItem("wallet-address", accounts[0]);

    alert("Carteira conectada com sucesso!");
  } catch (error) {
    console.error("Erro ao conectar a carteira:", error);
    alert("Erro ao conectar a carteira. Tente novamente.");
  }
}

// Adicionar evento ao botão de login com Wallet
const walletLoginButton = document.querySelector('[data-auth="wallet"]');
if (walletLoginButton) {
  walletLoginButton.addEventListener("click", connectWallet);
}
