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

## Estrutura do Projeto Final

```
fleek/
├── api/                  # Backend (serverless functions)
│   ├── get-authorized-emails.js
│   ├── get-authorized-wallets.js
│   ├── get-config.js
│   ├── get-file.js
│   ├── get-magic-key.js
│   └── package.json
├── config/               # Arquivos de configuração (.env)
├── docs/                 # Documentação
│   ├── IMPLEMENTATION_NOTES.md
│   ├── README.md
│   ├── SECURITY_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── TROUBLESHOOTING.md
├── files/                # Arquivos criptografados
│   └── Paper.encrypted
├── public/               # Arquivos estáticos (CSS, JS, HTML)
│   ├── anti-screenshot.css
│   ├── anti-screenshot.js
│   ├── index.html
│   ├── magic-sdk.js
│   ├── script.js
│   ├── styles.css
│   ├── wallet-connect.js
│   └── wallet-monitor.js
├── scripts/              # Scripts automatizados
│   ├── backups/          # Scripts de backup e rollback
│   │   ├── return-to-working-version.ps1
│   │   ├── rollback-to-working-version.bat
│   │   ├── rollback.ps1
│   │   └── simple-rollback.ps1
│   ├── commits/          # Scripts relacionados a commits
│   │   ├── checkout-commit.ps1
│   │   ├── commit-and-push.bat
│   │   ├── commit-login-fixes.ps1
│   │   ├── commit-magic-fix.bat
│   │   ├── commit-magic-simple.ps1
│   │   ├── commit-modular-structure.ps1
│   │   ├── commit-push-simple.bat
│   │   └── reset-to-previous-commit.ps1
│   ├── migrations/       # Scripts de migração
│   │   ├── migrate-to-modules.bat
│   │   ├── run-migration.bat
│   │   └── run-migration.ps1
│   ├── setup/            # Scripts de configuração
│   │   ├── configure-env.bat
│   │   ├── configure-env.ps1
│   │   ├── restore-config.bat
│   │   └── setup-github.bat
│   └── tools/            # Scripts utilitários
│       ├── check-dependencies.bat
│       ├── final-check.bat
│       ├── fix-magic-sdk.ps1
│       ├── fix-missing-icons.js
│       ├── push-changes.ps1
│       ├── quick-start.bat
│       ├── run-npm.bat
│       ├── run-npm.ps1
│       ├── start-complete-with-tests.bat
│       ├── start-dev-complete.bat
│       ├── start-dev.bat
│       ├── start-dev.ps1
│       ├── start-enhanced.bat
│       ├── start-enhanced.ps1
│       ├── start-local-dev.bat
│       ├── start-local-dev.ps1
│       ├── start-modular.bat
│       ├── start.bat
│       └── verify-modules.bat
├── tests/                # Scripts de teste
│   ├── analyze-changes.html
│   ├── apply-all-fixes.js
│   ├── automated-tests.js
│   ├── button-alert-test.html
│   ├── button-fix-test.html
│   ├── button-fix-verification.js
│   ├── button-test.html
│   ├── code-analyzer.js
│   ├── comprehensive-test.html
│   ├── comprehensive-test.js
│   ├── dom-monitor.js
│   ├── event-debugger.js
│   ├── final-verification.js
│   ├── loading-test.html
│   ├── loading-test.js
│   ├── magic-sdk-module-page.html
│   ├── magic-sdk-test.html
│   ├── script-validacao.js
│   ├── test-all-buttons.js
│   ├── test-modules.html
│   ├── test-modules.js
│   ├── verification-page.html
│   ├── verify-all-fixes.js
│   └── wallet-tests.js
└── README.md             # Documentação principal
```
