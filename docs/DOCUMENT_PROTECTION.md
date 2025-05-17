# Sistema de Proteção de Documentos

Este documento descreve o sistema de proteção implementado para garantir a segurança dos documentos confidenciais visualizados nesta plataforma.

## Recursos de Proteção Implementados

### 1. Proteção contra Capturas de Tela

O sistema detecta e bloqueia tentativas de captura de tela através de:

- Detecção da tecla PrintScreen
- Monitoramento de combinações de teclas comuns para capturas de tela (Cmd+Shift+3, Cmd+Shift+4, etc.)
- Detecção de mudanças de visibilidade do documento (troca de janelas rápida)
- Eventos de clipboard (área de transferência)
- Detecção de ferramentas de desenvolvedor abertas

### 2. Proteção contra Impressão

O sistema também previne tentativas de impressão através de:

- Sobrescrição da função `window.print()`
- Interceptação de eventos `beforeprint`
- Detecção de teclas de atalho Ctrl+P/Cmd+P
- Bloqueio do diálogo de impressão do navegador
- Proteção para iframes
- CSS específico para mídia de impressão que oculta o conteúdo confidencial

### 3. Medidas de Segurança Adicionais

- Marca d'água em documentos confidenciais
- Overlay de proteção visual
- Bloqueio de seleção de texto
- Bloqueio de menu de contexto (clique com botão direito)
- Proteção contra cópia de texto

## Comportamento do Sistema

Em caso de detecção de tentativa de impressão ou captura de tela:

1. Um alerta de segurança é exibido informando sobre a violação
2. O documento é ofuscado imediatamente
3. A sessão é encerrada automaticamente
4. Um registro de segurança é gerado para auditoria

## Compatibilidade

O sistema foi projetado para funcionar nos principais navegadores:

- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Limitações

- Algumas proteções podem ter comportamento diferente em dispositivos móveis
- Em casos de navegadores com extensões específicas, proteções adicionais podem ser necessárias
- O sistema não substitui políticas de segurança organizacionais e conscientização do usuário

## Manutenção

Recomenda-se a revisão periódica das proteções implementadas para acompanhar atualizações de navegadores e novas técnicas de captura de tela/impressão.
