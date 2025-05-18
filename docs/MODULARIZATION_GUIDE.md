# Guia de Modularização do Projeto Fleek

Este documento descreve a nova estrutura modular implementada no projeto Fleek para melhorar a manutenibilidade, testabilidade e expansão do código.

## Estrutura de Pastas

```
fleek/
├── src/
│   ├── js/
│   │   ├── modules/           # Módulos principais do aplicativo
│   │   ├── utils/             # Funções utilitárias
│   │   ├── services/          # Serviços para comunicação com APIs externas
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── app.js             # Aplicação principal
│   │   └── loader.js          # Carregador para compatibilidade com browsers antigos
│   └── css/                   # Estilos CSS (futura migração)
├── api/                       # API serverless
├── tests/                     # Testes automatizados
└── files/                     # Arquivos para acesso
```

## Arquitetura Modular

A nova arquitetura segue o padrão de Módulos ES6 para uma melhor organização do código:

### Módulos Principais

1. **auth.js**
   - Gerencia toda a lógica de autenticação
   - Integração com Magic SDK para login sem senha
   - Verificação de emails autorizados
   - Gerenciamento de estado do usuário

2. **config.js**
   - Centraliza as configurações da aplicação
   - Carrega configurações do backend
   - Provê funções para acessar configurações de forma segura
   - Detecta ambiente de execução

3. **pdf-viewer.js**
   - Componente para visualização de PDFs
   - Gerencia carregamento e renderização de documentos
   - Implementa medidas de segurança contra captura
   - Controla navegação entre páginas do PDF

4. **ui-manager.js**
   - Gerencia toda a interface do usuário
   - Manipula os elementos DOM
   - Trata eventos de UI
   - Fornece métodos para atualizar elementos visuais

5. **wallet-connector.js**
   - Gerencia conexão com carteiras Web3
   - Suporte para múltiplos provedores
   - Verificação de carteiras autorizadas
   - Obtenção de informações da conta e rede

### Utilitários

No diretório `utils/`, funções auxiliares reutilizáveis:

- Formatação de endereços de carteira
- Geração de IDs únicos
- Formatação de tamanhos de arquivo
- Funções para hash e segurança

## Sistema de Eventos

A comunicação entre módulos é feita principalmente através de Eventos Customizados, o que permite:

- Baixo acoplamento entre módulos
- Facilidade para testes unitários
- Extensibilidade das funcionalidades

### Principais Eventos

| Evento | Descrição | Origem | Destino |
|--------|-----------|--------|---------|
| `auth:login` | Usuário autenticado com sucesso | auth.js | app.js |
| `auth:logout` | Usuário fez logout | auth.js | app.js |
| `wallet:connected` | Carteira conectada | wallet-connector.js | app.js |
| `pdf:loaded` | PDF carregado com sucesso | pdf-viewer.js | app.js |
| `ui:requestLogin` | Solicitação de login | ui-manager.js | app.js |
| `ui:requestFileAccess` | Solicitação de acesso a arquivo | ui-manager.js | app.js |

## Compatibilidade com Código Antigo

Para garantir compatibilidade com a versão anterior:

1. O arquivo `loader.js` pode carregar módulos em navegadores que não suportam ES modules
2. Os módulos são estruturados para manterem a mesma API exposta pelo código antigo
3. Scripts de migração facilitam a transição entre as versões

## Como Usar os Módulos

Para importar e usar um módulo:

```javascript
// Importar módulos específicos
import { initMagicSDK, loginWithEmail } from './modules/auth.js';
import { getConfig } from './modules/config.js';

// Usar funções exportadas
const config = getConfig('apiBaseUrl');
await initMagicSDK();
```

## Vantagens da Modularização

1. **Manutenção**: Mais fácil entender e modificar partes específicas do código
2. **Testabilidade**: Módulos isolados são mais fáceis de testar unitariamente
3. **Reutilização**: Código organizado pode ser reutilizado em outros projetos
4. **Colaboração**: Desenvolvimento paralelo em diferentes módulos
5. **Escalabilidade**: Facilidade para adicionar novos recursos

## Próximos Passos

1. Migração dos estilos CSS para uma estrutura modular
2. Implementação de testes unitários para cada módulo
3. Documentação API completa para cada módulo
4. Otimização de desempenho com carregamento seletivo
5. Implementação de recursos avançados de segurança
