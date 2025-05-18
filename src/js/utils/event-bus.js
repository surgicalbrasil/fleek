/**
 * event-bus.js
 * Sistema centralizado de eventos para comunicação entre módulos
 */

// Armazenar callbacks para eventos
const listeners = {};

/**
 * Registra um ouvinte para um evento específico
 * @param {string} eventName - Nome do evento
 * @param {Function} callback - Função a ser chamada quando o evento ocorrer
 * @param {boolean} once - Se true, o listener é removido após a primeira chamada
 * @returns {Function} - Função para remover o listener
 */
function on(eventName, callback, once = false) {
  if (!eventName || typeof callback !== 'function') {
    throw new Error('EventBus.on requer um nome de evento válido e uma função callback');
  }

  if (!listeners[eventName]) {
    listeners[eventName] = [];
  }

  const listener = { callback, once };
  listeners[eventName].push(listener);

  // Retornar função para remoção do listener
  return () => {
    off(eventName, callback);
  };
}

/**
 * Registra um ouvinte que será chamado apenas uma vez
 * @param {string} eventName - Nome do evento
 * @param {Function} callback - Função a ser chamada quando o evento ocorrer
 * @returns {Function} - Função para remover o listener
 */
function once(eventName, callback) {
  return on(eventName, callback, true);
}

/**
 * Remove um ouvinte específico de um evento
 * @param {string} eventName - Nome do evento
 * @param {Function} callback - Função a ser removida
 * @returns {boolean} - Verdadeiro se o listener foi removido
 */
function off(eventName, callback) {
  if (!listeners[eventName]) {
    return false;
  }

  const index = listeners[eventName].findIndex(listener => listener.callback === callback);
  
  if (index !== -1) {
    listeners[eventName].splice(index, 1);
    
    // Remover o array se não houver mais listeners
    if (listeners[eventName].length === 0) {
      delete listeners[eventName];
    }
    
    return true;
  }
  
  return false;
}

/**
 * Remove todos os ouvintes de um evento específico
 * @param {string} eventName - Nome do evento
 * @returns {boolean} - Verdadeiro se os listeners foram removidos
 */
function offAll(eventName) {
  if (eventName) {
    if (listeners[eventName]) {
      delete listeners[eventName];
      return true;
    }
    return false;
  }
  
  // Remover todos os listeners de todos os eventos
  Object.keys(listeners).forEach(key => {
    delete listeners[key];
  });
  
  return true;
}

/**
 * Emite um evento com dados opcionais
 * @param {string} eventName - Nome do evento
 * @param {*} data - Dados a serem passados para os listeners
 * @returns {boolean} - Verdadeiro se o evento tinha listeners
 */
function emit(eventName, data) {
  if (!listeners[eventName]) {
    return false;
  }

  const eventListeners = [...listeners[eventName]];
  
  // Remover listeners "once" após executá-los
  listeners[eventName] = listeners[eventName].filter(listener => !listener.once);
  
  // Se não restaram listeners, limpar o array
  if (listeners[eventName].length === 0) {
    delete listeners[eventName];
  }

  // Executar callbacks
  eventListeners.forEach(listener => {
    try {
      listener.callback(data);
    } catch (error) {
      console.error(`Erro ao executar listener para evento "${eventName}":`, error);
    }
  });
  
  return true;
}

/**
 * Verifica se um evento tem listeners
 * @param {string} eventName - Nome do evento
 * @returns {boolean} - Verdadeiro se o evento tem listeners
 */
function hasListeners(eventName) {
  return !!(listeners[eventName] && listeners[eventName].length > 0);
}

/**
 * Emite um evento no DOM para comunicação entre módulos externos
 * @param {string} eventName - Nome do evento
 * @param {*} detail - Dados a serem passados para os listeners
 * @returns {CustomEvent} - O evento criado
 */
function emitDOM(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
  return event;
}

/**
 * Registro de listeners para eventos DOM com possibilidade de desregistro fácil
 * @param {string} eventName - Nome do evento
 * @param {Function} callback - Função a ser chamada quando o evento ocorrer
 * @returns {Function} - Função para remover o listener
 */
function onDOM(eventName, callback) {
  window.addEventListener(eventName, callback);
  
  // Retornar função para remover o listener
  return () => {
    window.removeEventListener(eventName, callback);
  };
}

// Exportar funções do módulo
export {
  on,
  once,
  off,
  offAll,
  emit,
  hasListeners,
  emitDOM,
  onDOM
};
