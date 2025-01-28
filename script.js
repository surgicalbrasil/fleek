console.log("Inicializando Magic.Link...");
const magic = new Magic("pk_live_20134EF9B8F26232");
console.log("Magic.Link inicializado com sucesso.");

async function fetchAuthorizedEmails() {
  try {
    const response = await fetch("https://fleek-nine.vercel.app/api/get-authorized-emails");
    if (!response.ok) {
      throw new Error(`Erro ao buscar e-mails: ${response.statusText}`);
    }
    const data = await response.json();
    return data.success ? data.emails || [] : [];
  } catch (err) {
    console.error("Erro ao buscar e-mails autorizados:", err);
    return [];
  }
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

document.getElementById("login-button").onclick = async function () {
  const email = document.getElementById("user-email").value.trim();
  if (!isValidEmail(email)) {
    alert("Por favor, insira um e-mail válido.");
    return;
  }
  const authorizedEmails = await fetchAuthorizedEmails();
  if (!authorizedEmails.includes(email.toLowerCase())) {
    alert("E-mail não autorizado para acesso.");
    return;
  }
  try {
    await magic.auth.loginWithMagicLink({ email });
    const token = await magic.user.getIdToken();
    sessionStorage.setItem("magic-token", token);
    alert("Login realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar link mágico:", error);
  }
};

// Outras funções relacionadas ao logout, acesso ao arquivo e modal são mantidas.
