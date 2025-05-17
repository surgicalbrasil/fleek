# Guia de Segurança e Boas Práticas

## Gerenciamento de Variáveis de Ambiente

Todas as credenciais e chaves sensíveis devem ser armazenadas como variáveis de ambiente no servidor de produção. Nunca armazene informações sensíveis diretamente no código.

### Variáveis de Ambiente Necessárias

- `MAGIC_PUBLIC_KEY`: Chave pública para o Magic SDK
- `MAGIC_SECRET_KEY`: Chave secreta para o Magic SDK
- `API_KEY`: API key para autenticação
- `GOOGLE_SHEETS_CREDENTIALS`: Credenciais do Google Sheets (codificadas em base64)
- `GOOGLE_SHEETS_SPREADSHEET_ID`: ID da planilha Google
- `GOOGLE_SHEETS_RANGE`: Intervalo da planilha (opcional)
- `ENCRYPTED_FILE_URL`: URL do arquivo criptografado
- `ENCRYPTION_KEY`: Chave de criptografia (hex)
- `ENCRYPTION_IV`: Vetor de inicialização (hex)

## Boas Práticas de Segurança

1. **Não exponha API Keys no frontend**:
   - Sempre use um endpoint de backend para operações que requerem chaves de API
   - Se necessário enviar uma chave para o frontend, use um hash ou uma versão truncada

2. **Mantenha o código limpo**:
   - Remova arquivos e código de depuração antes da implantação
   - Mantenha apenas arquivos necessários para produção no repositório

3. **Criptografia**:
   - Nunca armazene chaves de criptografia no código
   - Gere novas chaves e vetores de inicialização para cada uso crítico
   - Armazene chaves de criptografia apenas em variáveis de ambiente no servidor

4. **Autenticação**:
   - Valide sempre as credenciais do usuário no backend
   - Implemente políticas de segurança para senhas fortes
   - Utilize autenticação de múltiplos fatores quando possível

5. **CORS (Cross-Origin Resource Sharing)**:
   - Configure o CORS para permitir apenas domínios confiáveis
   - Especifique os métodos HTTP permitidos
   - Limite os cabeçalhos que podem ser usados

## Procedimento de Auditoria de Segurança

Realize auditorias de segurança regulares no código seguindo estas etapas:

1. Verificar se há chaves ou credenciais expostas no código
2. Garantir que todas as chamadas de API usem HTTPS
3. Confirmar que todos os endpoints da API validam adequadamente a autenticação
4. Verificar se há vulnerabilidades em dependências usando ferramentas como `npm audit`
5. Testar o funcionamento correto das políticas de CORS

## Checklist de Implantação Segura

- [ ] Todas as variáveis de ambiente estão configuradas no servidor
- [ ] Nenhuma chave ou credencial está exposta no código
- [ ] O arquivo `.gitignore` está configurado para excluir arquivos sensíveis
- [ ] Os arquivos de depuração foram removidos
- [ ] A política de CORS está configurada corretamente
- [ ] Todas as dependências estão atualizadas e sem vulnerabilidades conhecidas
