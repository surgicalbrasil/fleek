# Fleek - Confidential Document Viewer

Sistema para visualização de documentos confidenciais com autenticação segura via email e carteira Web3.

## Funcionalidades Principais

- **Login com Email**: Autenticação segura via Magic Link (sem senha)
- **Login com Carteira Web3**: Suporte para MetaMask
- **Visualização Segura**: PDF com proteção anti-captura
- **Acesso ao Metaverso**: Interface para cadastro no metaverso

## Requisitos

- Node.js (v14+)
- Navegador Web moderno (Chrome ou Firefox recomendados)
- Extensão MetaMask (para autenticação via carteira)

## Configuração Rápida

1. **Clone o repositório**:
   ```
   git clone https://github.com/surgicalbrasil/fleek.git
   cd fleek
   ```

2. **Configure as variáveis de ambiente**:
   ```
   configure-env.bat
   ```
   Edite os arquivos `.env` e `.env.local` com suas chaves.

3. **Instale as dependências**:
   ```
   cd api
   npm install
   cd ..
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```
   start.bat
   ```

## Scripts Úteis

- `start.bat` - Inicia o servidor de desenvolvimento
- `start-complete-with-tests.bat` - Inicia com verificações e testes automáticos
- `check-dependencies.bat` - Verifica e instala dependências necessárias
- `restore-config.bat` - Restaura configurações para o estado inicial
- `final-check.bat` - Executa verificação final antes de commit
- `commit-and-push.bat` - Prepara e envia alterações para o GitHub

## Solução de Problemas

Consulte o guia de solução de problemas em `docs/TROUBLESHOOTING.md`.

## Estrutura do Projeto

```
fleek/
├── api/                  # Backend (serverless functions)
│   ├── get-file.js       # Endpoint para obter documentos
│   └── ...
├── docs/                 # Documentação
├── tests/                # Scripts de teste
├── files/                # Arquivos criptografados
├── index.html            # Interface principal
├── script.js             # Lógica principal do frontend
├── wallet-connect.js     # Conexão com carteiras Web3
└── styles.css            # Estilos da aplicação
```
