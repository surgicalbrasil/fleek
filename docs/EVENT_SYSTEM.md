# Sistema de Eventos no Projeto Fleek

Este documento descreve o sistema de eventos usado para comunicação entre módulos no projeto Fleek.

## Visão Geral

O projeto Fleek utiliza dois mecanismos de eventos para comunicação entre módulos:

1. **Eventos DOM nativos** - Usados para a comunicação entre módulos não diretamente conectados
2. **Event Bus customizado** - Um mecanismo mais leve e modular para comunicação interna

## Tipos de Eventos

### Eventos de Autenticação

| Nome do Evento | Descrição | Dados | Fonte |
|---------------|-----------|-------|-------|
| `auth:login` | Usuário autenticado com sucesso | `{ method: 'email'/'wallet', user: {...} }` | `auth.js` |
| `auth:loginFailed` | Falha na autenticação | `{ method: 'email'/'wallet', error: 'mensagem' }` | `auth.js` |
| `auth:logout` | Usuário fez logout | - | `auth.js` |
| `auth:sessionRestored` | Sessão restaurada | `{ user: {...} }` | `auth.js` |
| `auth:getUserEmail` | Solicita email do usuário | `{ callback: Function }` | `app.js` |

### Eventos de Carteira

| Nome do Evento | Descrição | Dados | Fonte |
|---------------|-----------|-------|-------|
| `wallet:connected` | Carteira conectada | `{ address: '0x...', balance: '0.1', chainId: '0x1' }` | `wallet-connector.js` |
| `wallet:disconnected` | Carteira desconectada | - | `wallet-connector.js` |
| `wallet:chainChanged` | Rede da carteira alterada | `{ chainId: 1 }` | `wallet-connector.js` |
| `wallet:connectionFailed` | Falha ao conectar carteira | `{ error: 'mensagem' }` | `wallet-connector.js` |
| `wallet:unauthorized` | Carteira não autorizada | `{ error: 'mensagem' }` | `wallet-connector.js` |

### Eventos de PDF/Documentos

| Nome do Evento | Descrição | Dados | Fonte |
|---------------|-----------|-------|-------|
| `pdf:loaded` | PDF carregado com sucesso | `{ filename: 'arquivo.pdf', pageCount: 10 }` | `pdf-viewer.js` |
| `pdf:error` | Erro ao carregar PDF | `{ error: 'mensagem' }` | `pdf-viewer.js` |
| `pdf:loadError` | Erro ao carregar arquivo | `{ error: 'mensagem' }` | `pdf-viewer.js` |
| `pdf:getUserIdentifier` | Solicita identificador para marca d'água | `{ callback: Function }` | `pdf-viewer.js` |

### Eventos de Interface do Usuário

| Nome do Evento | Descrição | Dados | Fonte |
|---------------|-----------|-------|-------|
| `ui:requestLogin` | Solicitação de login | `{ method: 'email'/'wallet', email: 'user@example.com' }` | `ui-manager.js` |
| `ui:requestLogout` | Solicitação de logout | - | `ui-manager.js` |
| `ui:requestFileAccess` | Solicitação de acesso a arquivo | - | `ui-manager.js` |
| `ui:getUserIdentifier` | Solicita identificador do usuário | `{ callback: Function }` | `ui-manager.js` |

## Utilização do Event Bus

O EventBus é uma implementação leve de PubSub que permite comunicação desacoplada entre módulos.

### Exemplo de Uso

```javascript
// Importar Event Bus
import { on, emit, off } from '../utils/event-bus.js';

// Registrar um ouvinte
const unsubscribe = on('minhaApp:dataLoaded', (data) => {
  console.log('Dados carregados:', data);
});

// Emitir um evento
emit('minhaApp:dataLoaded', { count: 5, status: 'ok' });

// Remover o ouvinte quando não for mais necessário
unsubscribe();
// ou
off('minhaApp:dataLoaded', minhaFuncaoCallback);
```

### Eventos de Execução Única

Para um evento que deve ser processado apenas uma vez:

```javascript
import { once } from '../utils/event-bus.js';

once('minhaApp:inicializado', () => {
  console.log('Aplicação inicializada!');
});
```

### Integração com Eventos DOM

O EventBus também oferece métodos para trabalhar com eventos DOM:

```javascript
import { emitDOM, onDOM } from '../utils/event-bus.js';

// Emitir evento DOM
emitDOM('minhaApp:globalEvent', { 
  data: 'valor', 
  timestamp: Date.now() 
});

// Escutar evento DOM com capacidade de desregistro fácil
const removeListener = onDOM('minhaApp:globalEvent', (event) => {
  console.log('Evento recebido:', event.detail);
});

// Remover ouvinte quando necessário
removeListener();
```

## Convenções de Nomenclatura

Para manter os eventos organizados, seguimos estas convenções:

1. Use prefixos de namespace para eventos: `modulo:acao`
2. Use camelCase para nomes de eventos
3. Para eventos relacionados a erros, use o sufixo `Failed` ou `Error`
4. Use verbos no passado para eventos que representam ações concluídas

## Boas Práticas

1. **Sempre remova os listeners** quando não forem mais necessários para evitar memory leaks
2. **Documente novos eventos** neste guia quando forem adicionados
3. **Evite dependências circulares** entre módulos usando eventos
4. **Verifique se um evento tem listeners** antes de realizar cálculos pesados
5. **Use tratamento de erros** ao processar eventos para evitar que exceções interrompam o fluxo
