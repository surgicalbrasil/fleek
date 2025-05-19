# Fleek - Confidential Document Viewer

## Visão Geral

Sistema para visualização de documentos confidenciais com autenticação segura por e-mail e carteira Web3.

## Métodos de Autenticação

### Login por Email
- Autenticação via Magic Link (login sem senha)
- Verificação de emails autorizados em uma planilha Google

### Login por Carteira Web3 (Novo!)
- Suporte para conexão via WalletConnect
- Integração com a Alchemy API
- Verificação de carteiras autorizadas em uma planilha Google

## Funcionalidades

- Visualização segura de documentos PDF
- Acesso a metaverso para usuários autorizados
- Proteção de conteúdo com criptografia

## Configuração

### Requisitos
- Conta Magic Link para autenticação por email
- Chave de API Alchemy para conexão de carteiras Web3

### Variáveis de Ambiente
```
MAGIC_SECRET_KEY=chave_secreta_do_magic
GOOGLE_SHEETS_SPREADSHEET_ID=id_da_planilha_google
GOOGLE_SHEETS_CREDENTIALS=credenciais_codificadas_em_base64
GOOGLE_SHEETS_RANGE=intervalo_da_planilha
ENCRYPTION_KEY=chave_de_criptografia_hex
ENCRYPTION_IV=vetor_de_inicializacao_hex
```

## Desenvolvimento

Para executar o projeto localmente:

1. Clone o repositório
2. Abra o arquivo `index.html` no navegador
3. Para testar a conexão de carteira, utilize o arquivo de teste em `tests/wallet-tests.js`

## Atualizações Recentes

### Modos de Inicialização
- **Modo `dev`**: Inicia o ambiente de desenvolvimento, configurando dependências e inicializando o backend.
- **Modo `local`**: Configura o ambiente local, cria o arquivo `.env` automaticamente (se necessário), instala dependências e inicia o servidor local com o Vercel CLI configurado automaticamente.
- **Modo `modular`**: Verifica dependências como Node.js e `http-server`, e inicia o servidor modular na porta 8080.

### Scripts Atualizados
- `start-dev.bat`: Consolidado para suportar os modos `dev`, `local` e `modular`.
- `configure-env.bat`: Agora cria um arquivo `.env` padrão se `.env.example` não estiver presente.
- `commit-modular-structure.ps1`: Inclui verificações antes de realizar commit e push.

### Melhorias Gerais
- Scripts redundantes foram removidos.
- Modularização aplicada para reutilização de lógica em vários scripts.