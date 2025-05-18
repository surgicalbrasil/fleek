/**
 * pdf-viewer.js
 * Módulo para visualização e manipulação de PDFs
 */

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Variáveis do módulo
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.5;
let pdfContainer = null;
let fileDecryptionKey = null;
let currentFileData = null;
let currentFileName = null;
let documentAccessAuthorized = false;

/**
 * Inicializa o visualizador de PDF
 * @param {string} containerId - ID do elemento container para o PDF
 * @returns {void}
 */
function initPDFViewer(containerId = 'pdf-viewer') {
  pdfContainer = document.getElementById(containerId);
  
  if (!pdfContainer) {
    console.error(`Container do PDF não encontrado: ${containerId}`);
    return;
  }
  
  console.log("Visualizador de PDF inicializado");
}

/**
 * Renderiza uma página específica do PDF
 * @param {number} num - Número da página a ser renderizada
 * @returns {Promise<void>}
 */
async function renderPage(num) {
  if (!pdfDoc) {
    console.error("Nenhum documento PDF carregado");
    return;
  }
  
  pageRendering = true;
  
  try {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });
    
    // Criar ou reusar o canvas
    let canvas = document.getElementById('pdf-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'pdf-canvas';
      pdfContainer.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Aplicar proteção contra cópia/download
    applySecurityMeasures(canvas);
    
    // Renderizar a página
    const renderContext = {
      canvasContext: ctx,
      viewport
    };
    
    await page.render(renderContext).promise;
    pageRendering = false;
    
    // Atualizar contagem de páginas
    document.getElementById('page-count').textContent = pdfDoc.numPages;
    document.getElementById('page-num').textContent = num;
    
    // Verificar se há uma página pendente
    if (pageNumPending !== null) {
      renderPage(pageNumPending);
      pageNumPending = null;
    }
  } catch (error) {
    console.error("Erro ao renderizar página:", error);
    pageRendering = false;
  }
}

/**
 * Aplica medidas de segurança ao canvas do PDF
 * @param {HTMLCanvasElement} canvas - O elemento canvas com o PDF
 * @returns {void}
 */
function applySecurityMeasures(canvas) {
  // Evitar cópia direta
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  // Adicionar marca d'água
  const ctx = canvas.getContext('2d');
  ctx.font = '20px Arial';
  ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
  ctx.textAlign = 'center';
  
  // Marca d'água com email ou endereço da carteira
  let userIdentifier = '';
  const authEvent = new CustomEvent('pdf:getUserIdentifier', {
    detail: { callback: (identifier) => userIdentifier = identifier }
  });
  window.dispatchEvent(authEvent);
  
  for (let i = 0; i < canvas.height; i += 100) {
    for (let j = 0; j < canvas.width; j += 400) {
      ctx.fillText(`CONFIDENCIAL - ${userIdentifier || 'Acesso Restrito'}`, j + 200, i + 50);
    }
  }
}

/**
 * Carrega e exibe um arquivo PDF
 * @param {ArrayBuffer} arrayBuffer - Buffer com os dados do PDF
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<void>}
 */
async function loadPDF(arrayBuffer, fileName) {
  if (!arrayBuffer) {
    console.error("Dados do PDF inválidos");
    return;
  }
  
  try {
    currentFileData = arrayBuffer;
    currentFileName = fileName;
    
    pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pageNum = 1;
    
    // Inicializar controles de navegação
    initNavigationControls();
    
    // Renderizar primeira página
    renderPage(pageNum);
    
    // Notificar que o PDF foi carregado com sucesso
    const pdfLoadedEvent = new CustomEvent('pdf:loaded', { 
      detail: { filename: fileName, pageCount: pdfDoc.numPages } 
    });
    window.dispatchEvent(pdfLoadedEvent);
    
    // Exibir controles de navegação
    document.getElementById('pdf-navigation').style.display = 'flex';
  } catch (error) {
    console.error("Erro ao carregar PDF:", error);
    const pdfErrorEvent = new CustomEvent('pdf:error', { 
      detail: { error: error.message } 
    });
    window.dispatchEvent(pdfErrorEvent);
  }
}

/**
 * Configura os controles de navegação do PDF
 * @returns {void}
 */
function initNavigationControls() {
  // Verificar se os controles já existem
  if (document.getElementById('pdf-navigation')) {
    return;
  }
  
  // Criar controles de navegação
  const navDiv = document.createElement('div');
  navDiv.id = 'pdf-navigation';
  navDiv.className = 'pdf-navigation';
  navDiv.innerHTML = `
    <button id="prev" class="nav-btn">Anterior</button>
    <div class="page-info">
      <span>Página</span>
      <span id="page-num">${pageNum}</span>
      <span>de</span>
      <span id="page-count">...</span>
    </div>
    <button id="next" class="nav-btn">Próxima</button>
    <div class="scale-controls">
      <button id="zoom-in" class="zoom-btn">+</button>
      <button id="zoom-out" class="zoom-btn">-</button>
    </div>
  `;
  
  // Adicionar ao container
  pdfContainer.insertBefore(navDiv, pdfContainer.firstChild);
  
  // Adicionar listeners
  document.getElementById('prev').addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
  });
  
  document.getElementById('next').addEventListener('click', () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
  });
  
  document.getElementById('zoom-in').addEventListener('click', () => {
    scale += 0.2;
    queueRenderPage(pageNum);
  });
  
  document.getElementById('zoom-out').addEventListener('click', () => {
    if (scale <= 0.5) return;
    scale -= 0.2;
    queueRenderPage(pageNum);
  });
}

/**
 * Coloca uma página na fila para renderização
 * @param {number} num - Número da página
 * @returns {void}
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Carrega um arquivo criptografado do servidor
 * @param {string} fileName - Nome do arquivo a ser carregado
 * @param {string} decryptionKey - Chave para descriptografar o arquivo
 * @returns {Promise<void>}
 */
async function loadEncryptedFile(fileName, decryptionKey) {
  try {
    fileDecryptionKey = decryptionKey;
    
    console.log(`Buscando arquivo: ${fileName}`);
    
    // Obter método de autenticação atual e dados de autenticação
    const authMethodEvent = new CustomEvent('auth:getAuthMethod', {
      detail: { callback: (method) => {} }
    });
    
    let authMethod = '';
    authMethodEvent.detail.callback = (method) => {
      authMethod = method;
    };
    window.dispatchEvent(authMethodEvent);
    
    // Obter token ou wallet baseado no método de autenticação
    let token = null;
    let walletAddress = null;
    
    if (authMethod === 'email') {
      const tokenEvent = new CustomEvent('auth:getToken', {
        detail: { callback: (t) => { token = t; } }
      });
      window.dispatchEvent(tokenEvent);
    } else {
      // Obter endereço da wallet
      const walletEvent = new CustomEvent('wallet:getAddress', {
        detail: { callback: (addr) => { walletAddress = addr; } }
      });
      window.dispatchEvent(walletEvent);
    }
    
    // Configuração do request
    const requestData = {
      fileName: fileName,
      authType: authMethod,
      token: token,
      walletAddress: walletAddress
    };
    
    console.log("Enviando requisição para obter arquivo:", requestData);
    
    const response = await fetch(`/api/get-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
    }
    
    const encryptedData = await response.arrayBuffer();
    
    // Descriptografar dados
    const decryptedData = await decryptFileData(encryptedData, decryptionKey);
    
    // Carregar PDF
    await loadPDF(decryptedData, fileName);
    
    documentAccessAuthorized = true;
    
  } catch (error) {
    console.error("Erro ao carregar arquivo criptografado:", error);
    const fileErrorEvent = new CustomEvent('pdf:loadError', { 
      detail: { error: error.message } 
    });
    window.dispatchEvent(fileErrorEvent);
    documentAccessAuthorized = false;
  }
}

/**
 * Descriptografa os dados do arquivo
 * @param {ArrayBuffer} encryptedData - Dados criptografados
 * @param {string} key - Chave de descriptografia
 * @returns {Promise<ArrayBuffer>}
 */
async function decryptFileData(encryptedData, key) {
  // Simulação de descriptografia - em produção, implementar algoritmo real
  console.log("Descriptografando dados do arquivo...");
  
  // Em um cenário real, aqui seria implementada a descriptografia
  // Por enquanto, apenas retornamos os dados originais
  return encryptedData;
}

/**
 * Verifica se o acesso ao documento está autorizado
 * @returns {boolean}
 */
function isDocumentAccessAuthorized() {
  return documentAccessAuthorized;
}

// Exportar funções do módulo
export {
  initPDFViewer,
  loadPDF,
  loadEncryptedFile,
  renderPage,
  queueRenderPage,
  isDocumentAccessAuthorized
};
