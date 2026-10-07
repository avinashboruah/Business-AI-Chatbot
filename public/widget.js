/**
 * Embeddable Business Chatbot Widget
 * Compatible with any website: Plain HTML, WordPress, Wix, React, Next.js, etc.
 * Features:
 * - Animated bouncing typing indicator for low-latency feel
 * - Direct click suggested/pre-set questions
 * - Universal script embed with dynamic origin resolution
 * - Dual response compatibility (answer/response)
 */
(function() {
  'use strict';

  var clientId = null;
  var apiUrl = '';
  var chatWindow = null;
  var messageContainer = null;
  var inputField = null;
  var sendBtn = null;
  var headerTitle = null;
  var quickQuestionsContainer = null;
  var isLoading = false;
  var initialized = false;
  var customQuestions = null;

  var CHAT_ICON_SVG = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

  function injectStyles() {
    if (document.getElementById('chatbot-widget-styles')) return;
    var style = document.createElement('style');
    style.id = 'chatbot-widget-styles';
    style.textContent = [
      '@keyframes cbPulse {',
      '  0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }',
      '  40% { transform: scale(1.15); opacity: 1; }',
      '}',
      '@keyframes cbFadeIn {',
      '  from { opacity: 0; transform: translateY(6px); }',
      '  to { opacity: 1; transform: translateY(0); }',
      '}',
      '.chatbot-bubble-anim { animation: cbFadeIn 0.22s ease-out; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function findWidgetScript() {
    if (document.currentScript) {
      return document.currentScript;
    }
    var attrScript = document.querySelector('script[data-client-id]');
    if (attrScript) return attrScript;

    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      var src = s.getAttribute('src') || '';
      if (src.indexOf('widget') !== -1) {
        return s;
      }
    }
    return scripts[scripts.length - 1] || null;
  }

  function resolveApiUrl(script) {
    if (script) {
      var customUrl = script.getAttribute('data-api-url');
      if (customUrl) return customUrl.replace(/\/+$/, '');

      var src = script.getAttribute('src') || '';
      if (src.indexOf('http://') === 0 || src.indexOf('https://') === 0) {
        try {
          return new URL(src).origin;
        } catch (e) {}
      }
    }

    if (typeof window !== 'undefined' && window.location) {
      if (window.location.protocol === 'file:') {
        return 'http://localhost:3000';
      }
      if (window.location.origin && window.location.origin !== 'null') {
        return window.location.origin;
      }
    }
    return 'http://localhost:3000';
  }

  function init() {
    if (initialized) return;

    if (!document.body) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        setTimeout(init, 50);
      }
      return;
    }

    injectStyles();

    var script = findWidgetScript();
    if (script) {
      clientId = script.getAttribute('data-client-id') || clientId;
      apiUrl = resolveApiUrl(script);

      var questionsAttr = script.getAttribute('data-questions');
      if (questionsAttr) {
        customQuestions = questionsAttr.split(',').map(function(q) { return q.trim(); }).filter(Boolean);
      }
    }

    if (!clientId) {
      try {
        var urlParams = new URLSearchParams(window.location.search);
        clientId = urlParams.get('client') || 'test-client';
      } catch (e) {
        clientId = 'test-client';
      }
    }

    initialized = true;
    createChatButton();
    createChatWindow();
    attachGlobalListeners();
    fetchBusinessDetails();
  }

  function createChatButton() {
    if (document.getElementById('chatbot-button')) return;

    var button = document.createElement('button');
    button.id = 'chatbot-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open customer support chat');
    button.innerHTML = CHAT_ICON_SVG;
    button.style.cssText = [
      'position: fixed !important',
      'bottom: 24px !important',
      'right: 24px !important',
      'width: 60px !important',
      'height: 60px !important',
      'border-radius: 50% !important',
      'background-color: #2563eb !important',
      'color: #ffffff !important',
      'display: flex !important',
      'align-items: center !important',
      'justify-content: center !important',
      'cursor: pointer !important',
      'border: none !important',
      'outline: none !important',
      'z-index: 2147483647 !important',
      'box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important',
      'transition: transform 0.2s, box-shadow 0.2s !important',
      'user-select: none !important',
      'padding: 0 !important',
      'margin: 0 !important'
    ].join(';');

    button.onmouseover = function() {
      button.style.transform = 'scale(1.08)';
      button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    };
    button.onmouseout = function() {
      button.style.transform = 'scale(1.0)';
      button.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
    };

    button.onclick = function(e) {
      e.stopPropagation();
      toggleChatWindow();
    };

    document.body.appendChild(button);
  }

  function toggleChatWindow() {
    if (!chatWindow) {
      createChatWindow();
    }
    if (chatWindow.style.display === 'none' || !chatWindow.style.display) {
      chatWindow.style.display = 'flex';
      if (inputField) inputField.focus();
    } else {
      chatWindow.style.display = 'none';
    }
  }

  function createChatWindow() {
    if (document.getElementById('chatbot-window')) {
      chatWindow = document.getElementById('chatbot-window');
      return;
    }

    chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window';
    chatWindow.style.cssText = [
      'position: fixed !important',
      'bottom: 96px !important',
      'right: 24px !important',
      'width: 360px !important',
      'max-width: calc(100vw - 32px) !important',
      'height: 520px !important',
      'max-height: calc(100vh - 120px) !important',
      'background-color: #ffffff !important',
      'border-radius: 14px !important',
      'box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important',
      'display: none',
      'flex-direction: column !important',
      'overflow: hidden !important',
      'z-index: 2147483646 !important',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important',
      'box-sizing: border-box !important'
    ].join(';');

    // Header
    var header = document.createElement('div');
    header.style.cssText = [
      'padding: 14px 16px',
      'background-color: #2563eb',
      'color: white',
      'display: flex',
      'justify-content: space-between',
      'align-items: center',
      'border-top-left-radius: 14px',
      'border-top-right-radius: 14px'
    ].join(';');

    headerTitle = document.createElement('span');
    headerTitle.style.cssText = 'font-weight: 600; font-size: 15px;';
    headerTitle.textContent = clientId === 'second-client' ? 'Apex Auto Repair Support' : 'Bella Italia Chatbot';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close chat');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = [
      'background: none',
      'border: none',
      'color: white',
      'font-size: 22px',
      'cursor: pointer',
      'line-height: 1',
      'padding: 0 4px',
      'opacity: 0.9'
    ].join(';');
    closeBtn.onclick = function() {
      chatWindow.style.display = 'none';
    };

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    // Messages Container
    messageContainer = document.createElement('div');
    messageContainer.style.cssText = [
      'flex: 1',
      'padding: 16px',
      'overflow-y: auto',
      'display: flex',
      'flex-direction: column',
      'gap: 10px',
      'background-color: #f8fafc'
    ].join(';');

    // Input Area
    var inputArea = document.createElement('div');
    inputArea.style.cssText = [
      'padding: 12px 14px',
      'border-top: 1px solid #e2e8f0',
      'display: flex',
      'gap: 8px',
      'background-color: #ffffff'
    ].join(';');

    inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Ask a question...';
    inputField.style.cssText = [
      'flex: 1',
      'padding: 10px 14px',
      'border: 1px solid #cbd5e1',
      'border-radius: 20px',
      'outline: none',
      'font-size: 14px',
      'box-sizing: border-box'
    ].join(';');

    inputField.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });

    sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.textContent = 'Send';
    sendBtn.style.cssText = [
      'padding: 0 16px',
      'background-color: #2563eb',
      'color: white',
      'border: none',
      'border-radius: 20px',
      'cursor: pointer',
      'font-size: 14px',
      'font-weight: 500',
      'transition: opacity 0.2s'
    ].join(';');
    sendBtn.onclick = function() {
      sendMessage();
    };

    inputArea.appendChild(inputField);
    inputArea.appendChild(sendBtn);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messageContainer);
    chatWindow.appendChild(inputArea);
    document.body.appendChild(chatWindow);

    // Initial greeting
    addMessage('Hi! Welcome to ' + (headerTitle ? headerTitle.textContent : 'our business') + '. How can I help you today?', 'bot');

    // Render default suggested questions
    renderSuggestedQuestions(getDefaultQuestions());
  }

  function getDefaultQuestions() {
    if (customQuestions && customQuestions.length > 0) {
      return customQuestions;
    }
    if (clientId === 'second-client') {
      return [
        'What are your opening hours?',
        'How much is an oil change?',
        'Do you provide loaner cars?',
        'Where are you located?'
      ];
    }
    return [
      'What are your opening hours?',
      "What's on the menu?",
      'Do you have vegetarian options?',
      'Where are you located?'
    ];
  }

  function fetchBusinessDetails() {
    var targetUrl = (apiUrl ? apiUrl : '') + '/api/client/' + encodeURIComponent(clientId);

    fetch(targetUrl)
      .then(function(res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function(data) {
        var client = data.client || {};
        if (client.name && headerTitle) {
          headerTitle.textContent = client.name;
        }

        var questions = customQuestions || data.quickQuestions || client.quickQuestions;
        if (questions && questions.length > 0) {
          renderSuggestedQuestions(questions);
        }
      })
      .catch(function(err) {});
  }

  function renderSuggestedQuestions(questions) {
    if (!messageContainer || !questions || questions.length === 0) return;

    var existing = document.getElementById('chatbot-quick-questions');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    quickQuestionsContainer = document.createElement('div');
    quickQuestionsContainer.id = 'chatbot-quick-questions';
    quickQuestionsContainer.style.cssText = [
      'display: flex',
      'flex-direction: column',
      'gap: 6px',
      'margin: 6px 0 10px 0',
      'align-self: flex-start',
      'max-width: 90%'
    ].join(';');

    var label = document.createElement('span');
    label.style.cssText = 'font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;';
    label.textContent = 'Popular questions:';
    quickQuestionsContainer.appendChild(label);

    var chipsRow = document.createElement('div');
    chipsRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

    questions.forEach(function(q) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = q;
      chip.style.cssText = [
        'background-color: #eff6ff',
        'color: #1d4ed8',
        'border: 1px solid #bfdbfe',
        'border-radius: 16px',
        'padding: 6px 12px',
        'font-size: 12.5px',
        'font-weight: 500',
        'cursor: pointer',
        'text-align: left',
        'transition: all 0.15s ease',
        'outline: none',
        'line-height: 1.3',
        'box-shadow: 0 1px 2px rgba(0,0,0,0.03)'
      ].join(';');

      chip.onmouseover = function() {
        chip.style.backgroundColor = '#dbeafe';
        chip.style.borderColor = '#93c5fd';
        chip.style.transform = 'translateY(-1px)';
      };
      chip.onmouseout = function() {
        chip.style.backgroundColor = '#eff6ff';
        chip.style.borderColor = '#bfdbfe';
        chip.style.transform = 'translateY(0)';
      };

      chip.onclick = function(e) {
        e.stopPropagation();
        sendMessage(q);
      };

      chipsRow.appendChild(chip);
    });

    quickQuestionsContainer.appendChild(chipsRow);
    messageContainer.appendChild(quickQuestionsContainer);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  function showTypingIndicator() {
    var indicator = document.createElement('div');
    indicator.className = 'chatbot-typing-bubble chatbot-bubble-anim';
    indicator.style.cssText = [
      'display: flex',
      'align-items: center',
      'gap: 5px',
      'padding: 12px 16px',
      'background-color: #ffffff',
      'border: 1px solid #e2e8f0',
      'border-radius: 14px',
      'border-bottom-left-radius: 4px',
      'box-shadow: 0 1px 3px rgba(0,0,0,0.06)',
      'align-self: flex-start',
      'width: fit-content',
      'margin-bottom: 4px'
    ].join(';');

    indicator.innerHTML =
      '<span style="width: 7px; height: 7px; border-radius: 50%; background-color: #2563eb; display: inline-block; animation: cbPulse 1.2s infinite ease-in-out; animation-delay: 0s;"></span>' +
      '<span style="width: 7px; height: 7px; border-radius: 50%; background-color: #2563eb; display: inline-block; animation: cbPulse 1.2s infinite ease-in-out; animation-delay: 0.2s;"></span>' +
      '<span style="width: 7px; height: 7px; border-radius: 50%; background-color: #2563eb; display: inline-block; animation: cbPulse 1.2s infinite ease-in-out; animation-delay: 0.4s;"></span>';

    messageContainer.appendChild(indicator);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    return indicator;
  }

  function addMessage(text, sender) {
    if (!messageContainer) return null;

    var msgDiv = document.createElement('div');
    msgDiv.className = 'chatbot-bubble-anim';
    msgDiv.style.cssText = [
      'padding: 10px 14px',
      'border-radius: 12px',
      'max-width: 82%',
      'font-size: 14px',
      'line-height: 1.45',
      'word-break: break-word',
      'white-space: pre-wrap'
    ].join(';');

    if (sender === 'user') {
      msgDiv.style.backgroundColor = '#2563eb';
      msgDiv.style.color = '#ffffff';
      msgDiv.style.alignSelf = 'flex-end';
      msgDiv.style.borderBottomRightRadius = '4px';
    } else {
      msgDiv.style.backgroundColor = '#ffffff';
      msgDiv.style.color = '#1e293b';
      msgDiv.style.alignSelf = 'flex-start';
      msgDiv.style.borderBottomLeftRadius = '4px';
      msgDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      msgDiv.style.border = '1px solid #e2e8f0';
    }

    msgDiv.textContent = text;
    messageContainer.appendChild(msgDiv);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    return msgDiv;
  }

  function sendMessage(textOverride) {
    if (isLoading) return;
    var message = (textOverride || (inputField ? inputField.value : '')).trim();
    if (!message) return;

    if (quickQuestionsContainer && quickQuestionsContainer.parentNode) {
      quickQuestionsContainer.style.opacity = '0.5';
      quickQuestionsContainer.style.pointerEvents = 'none';
    }

    addMessage(message, 'user');
    if (inputField) inputField.value = '';

    isLoading = true;
    if (sendBtn) sendBtn.disabled = true;

    // Show pulsing 3-dot typing indicator
    var typingIndicator = showTypingIndicator();

    var targetUrl = (apiUrl ? apiUrl : '') + '/api/chat';

    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: clientId,
        message: message
      })
    })
    .then(function(res) {
      if (!res.ok) {
        throw new Error('Server returned ' + res.status);
      }
      return res.json();
    })
    .then(function(data) {
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }

      var botResponse = data.answer || data.response || "I'm not sure based on the information I have. You can contact the business directly to confirm.";
      addMessage(botResponse, 'bot');

      if (data.businessName && headerTitle) {
        headerTitle.textContent = data.businessName;
      }
    })
    .catch(function(err) {
      console.error('Chat error:', err);
      if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
      }
      addMessage("I'm having trouble connecting to the chatbot server right now. Make sure the backend is running at " + apiUrl, 'bot');
    })
    .finally(function() {
      isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputField) inputField.focus();
    });
  }

  function attachGlobalListeners() {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && chatWindow && chatWindow.style.display !== 'none') {
        chatWindow.style.display = 'none';
      }
    });
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('load', function() {
    if (!initialized) init();
  });

  // Public API
  window.chatbot = {
    init: init,
    toggle: toggleChatWindow,
    setClientId: function(id) {
      clientId = id;
      fetchBusinessDetails();
    },
    setQuestions: function(questions) {
      renderSuggestedQuestions(questions);
    }
  };
})();