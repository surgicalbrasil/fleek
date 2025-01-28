// Inicializar o Magic SDK
const magic = new Magic("pk_live_20134EF9B8F26232");

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

// Função de Login
document.getElementById("login-button").addEventListener("click", async () => {
  const emailInput = document.getElementById("user-email");
  const email = emailInput.value.trim();

  if (!email) {
    alert("Por favor, insira um e-mail válido.");
    emailInput.focus();
    return;
  }

  const isAuthorized = await isEmailAuthorized(email);
  if (!isAuthorized) {
    alert("E-mail não autorizado. Contate o administrador.");
    return;
  }

  try {
    console.log("Realizando login...");
    await magic.auth.loginWithMagicLink({ email });
    const token = await magic.user.getIdToken();
    sessionStorage.setItem("magic-token", token);
    alert("Login realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    alert("Erro ao realizar login.");
  }
});

// Função para acessar o documento
document.getElementById("acessar-arquivo").addEventListener("click", async () => {
  const token = sessionStorage.getItem("magic-token");
  if (!token) {
    alert("Sessão expirada. Faça login novamente.");
    return;
  }

  try {
    console.log("Buscando o documento PDF...");
    const response = await fetch("https://fleek-nine.vercel.app/api/get-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fileName: "Paper.pdf" }),
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
  const token = sessionStorage.getItem("magic-token");
  if (!token) {
    alert("Faça login para acessar o Metaverso.");
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
