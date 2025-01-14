const crypto = require("crypto");
const fs = require("fs");

// Chave e IV de criptografia (gere novas para cada arquivo)
const ENCRYPTION_KEY = crypto.randomBytes(32); // 32 bytes para AES-256
const IV = crypto.randomBytes(16); // 16 bytes para AES-CBC

function encryptFile(inputPath, outputPath) {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(cipher).pipe(output);

  output.on("finish", () => {
    console.log("Arquivo criptografado com sucesso!");
    console.log("Chave de Criptografia:", ENCRYPTION_KEY.toString("hex"));
    console.log("Vetor de Inicialização (IV):", IV.toString("hex"));
  });
}

// Substitua pelos caminhos do seu arquivo
const inputFilePath = "Paper.pdf";
const outputFilePath = "Paper.encrypted";

encryptFile(inputFilePath, outputFilePath);
