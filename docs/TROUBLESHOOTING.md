# Manual de Solução de Problemas - Fleek

Este guia descreve como resolver os problemas comuns encontrados após a restauração do repositório.

## 1. Problemas de Login com Email

### Sintomas:
- Botão de login não responde
- Erro "Magic SDK não inicializado"
- Popup do Magic não aparece

### Soluções:
1. **Verifique as variáveis de ambiente:**
   - Abra o arquivo `.env` e confirme se a chave `MAGIC_PUBLIC_KEY` está corretamente configurada
   - A chave deve começar com `pk_live_` ou `pk_test_`

2. **Verifique se o Magic SDK está carregado:**
   - Abra o console do navegador (F12)
   - Execute `typeof Magic !== 'undefined'` - deve retornar `true`

3. **Reinstale as dependências:**
   - Execute o script `check-dependencies.bat`

## 2. Problemas de Login com Wallet

### Sintomas:
- Botão "Conectar Carteira" não responde
- MetaMask não abre
- Erro "Web3 não está disponível"

### Soluções:
1. **Verifique se a extensão MetaMask está instalada:**
   - Instale a extensão MetaMask no Chrome/Firefox

2. **Teste a conexão da Wallet:**
   - Abra o arquivo `index.html` no navegador
   - Use o botão de teste de wallet (canto inferior direito) para diagnosticar problemas

3. **Verifique a biblioteca Web3:**
   - Abra o console do navegador (F12)
   - Execute `typeof Web3 !== 'undefined' || typeof web3 !== 'undefined'` - deve retornar `true`

## 3. Problemas com Alertas dos Botões

### Sintomas:
- Clique nos botões não exibe alertas
- Mensagens de erro no console relacionadas a eventos

### Soluções:
1. **Solução rápida para alertas:**
   - Edite `script.js` e substitua todas as ocorrências de `alert(` por `window.alert(`

2. **Restaure os event listeners:**
   - Recarregue a página
   - Se persistir, execute no console: `document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => console.log(b.id + ' clicked')))`

## 4. Problemas de Layout do Site

### Sintomas:
- Elementos desalinhados
- Ícones ausentes
- Estilos não aplicados

### Soluções:
1. **Restaure os ícones:**
   - Verifique se o arquivo `fix-missing-icons.js` está sendo carregado
   - Execute o script no console: `document.querySelectorAll('.icon').forEach(icon => icon.style.display = 'inline-block')`

2. **Redefina o CSS:**
   - Limpe o cache do navegador (Ctrl+F5)
   - Verifique se `styles.css` está sendo carregado corretamente

## 5. Problemas com Acesso ao Documento Criptografado

### Sintomas:
- Erro "Falha ao carregar documento"
- Documento em branco
- Erro 500 ou 404 do servidor

### Soluções:
1. **Verifique as variáveis de ambiente:**
   - Confirme se `ENCRYPTED_FILE_URL`, `ENCRYPTION_KEY` e `ENCRYPTION_IV` estão configurados no `.env`

2. **Teste a API:**
   - Execute `start.bat` para iniciar o servidor local
   - Teste a API com: `curl -X POST -H "Content-Type: application/json" -d "{\"authType\":\"email\",\"token\":\"test\"}" http://localhost:3000/api/get-file`

3. **Verifique as permissões:**
   - Certifique-se de que o usuário está autenticado antes de tentar acessar o documento
   - Verifique se o email ou wallet está na lista autorizada do Google Sheets

## Dicas Adicionais

1. **Limpe e reinstale tudo:**
   - Execute `step2-clean-reinstall.bat` para reinstalar todas as dependências

2. **Inicie com modo de depuração:**
   - Adicione `?debug=true` à URL para ativar o modo de depuração
   - Exemplo: `file:///C:/Users/beelink/Desktop/fleek/index.html?debug=true`

3. **Teste com o servidor local:**
   - Use sempre o servidor local (execute `start.bat`) para testar as funcionalidades que requerem API

## Contato para Suporte

Se os problemas persistirem após tentar todas as soluções acima, entre em contato com o administrador do sistema.
