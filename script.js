// ============================================
//  Nexus Assistant — Aura AI Chatbot Script
// ============================================

const API_ENDPOINT = "/chat";

// --- Unique conversation ID banao ---
// Har baar jab page load hota hai, ek naya conversation shuru hota hai
// "conv_" + Date.now() se ek unique ID banti hai (jaise "conv_1719999999999")
// Ye ID har message ke saath backend ko bhejenge taake bot ko pata rahe
// ke ye messages ek hi conversation ke hain
const conversationId = "conv_" + Date.now();

// --- DOM Elements ---
const chatContainer = document.getElementById("chat-container");
const chatMessages = document.getElementById("chat-messages");
const welcomeScreen = document.getElementById("welcome-screen");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const suggestionChips = document.getElementById("suggestion-chips");

// --- State ---
let isWaiting = false;

// ============================
//  Initialize
// ============================
function init() {
  sendBtn.addEventListener("click", handleSend);

  // Textarea auto-resize logic
  messageInput.addEventListener("input", function() {
    this.style.height = "auto";
    const newHeight = Math.min(this.scrollHeight, 120);
    this.style.height = newHeight + "px";
    this.style.overflowY = this.scrollHeight > 120 ? "auto" : "hidden";
  });

  messageInput.addEventListener("keydown", (e) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
      return;
    }
    // Shift + Enter -> Allow new line
    if (e.key === "Enter" && e.shiftKey) {
      return;
    }
    // Plain Enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Suggestion chip clicks
  suggestionChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    const msg = chip.dataset.message;
    if (msg) {
      messageInput.value = msg;
      handleSend();
    }
  });

  // Focus input on load
  messageInput.focus();
}

// ============================
//  Send Message Handler
// ============================
async function handleSend() {
  const text = messageInput.value.trim();
  if (!text || isWaiting) return;

  // Hide welcome screen on first message
  if (!welcomeScreen.classList.contains("hidden")) {
    welcomeScreen.classList.add("hidden");
  }

  // Add user message
  appendMessage("user", text);
  messageInput.value = "";
  messageInput.style.height = "auto"; // Reset height
  messageInput.focus();

  // Show typing indicator
  isWaiting = true;
  updateSendButton();
  const typingEl = showTypingIndicator();

  // Scroll to bottom
  scrollToBottom();

  try {
    const reply = await sendToAPI(text);
    removeTypingIndicator(typingEl);
    appendMessage("bot", reply);
  } catch (error) {
    removeTypingIndicator(typingEl);
    appendMessage("bot", "Sorry, something went wrong. Please try again.");
    console.error("Chat API error:", error);
  } finally {
    isWaiting = false;
    updateSendButton();
  }
}

// ============================
//  API Call
// ============================
async function sendToAPI(message) {
  // --- Backend ko message aur conversationId dono bhejo ---
  // conversationId se backend samajhta hai ke ye message kis conversation ka hai
  // Taake wo sahi history fetch kar sake aur bot ko context de sake
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.reply || "No response received.";
}

// ============================
//  Append Message to Chat
// ============================
function appendMessage(role, text) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const time = getCurrentTime();

  // Bot messages mein markdown render karo, user messages plain text
  const renderedContent = role === "bot" ? parseMarkdown(text) : escapeHTML(text);

  if (role === "bot") {
    row.innerHTML = `
      <div class="msg-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="14" rx="3"/>
          <circle cx="9" cy="11" r="1.5"/>
          <circle cx="15" cy="11" r="1.5"/>
          <path d="M8 15h8"/>
          <line x1="9" y1="1" x2="9" y2="4"/>
          <line x1="15" y1="1" x2="15" y2="4"/>
        </svg>
      </div>
      <div>
        <div class="message-bubble md-content">${renderedContent}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  } else {
    row.innerHTML = `
      <div>
        <div class="message-bubble">${escapeHTML(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    `;
  }

  chatMessages.appendChild(row);
  
  if (role === "user") {
    scrollToBottom();
  } else {
    // Scroll to the start of the bot's reply so the user can read from the top
    setTimeout(() => {
      chatContainer.scrollTo({
        top: row.offsetTop - 20,
        behavior: "smooth"
      });
    }, 50);
  }
}

// ============================
//  Typing Indicator
// ============================
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typing-indicator";
  indicator.innerHTML = `
    <div class="msg-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="3"/>
        <circle cx="9" cy="11" r="1.5"/>
        <circle cx="15" cy="11" r="1.5"/>
        <path d="M8 15h8"/>
        <line x1="9" y1="1" x2="9" y2="4"/>
        <line x1="15" y1="1" x2="15" y2="4"/>
      </svg>
    </div>
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;

  chatMessages.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

// ============================
//  Utilities
// ============================
function scrollToBottom() {
  requestAnimationFrame(() => {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ============================
//  Markdown Parser
//  Bot ke response ko sahi format mein dikhane ke liye
// ============================
function parseMarkdown(text) {
  // Pehle text ko safe karo (XSS se bachao)
  let html = escapeHTML(text);

  // --- Code blocks (```) ---
  // Triple backtick ke andar ka code block mein wrap karo
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`;
  });

  // --- Inline code (`code`) ---
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // --- Headings (### ## #) ---
  // Line start pe # ka count check karo — zyada # = chhota heading
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // --- Heading with === underline ---
  html = html.replace(/^(.+)\n=+$/gm, '<h1>$1</h1>');
  // --- Heading with --- underline ---
  html = html.replace(/^(.+)\n-{3,}$/gm, '<h2>$1</h2>');

  // --- Horizontal rule (--- or ***) ---
  html = html.replace(/^[-*]{3,}$/gm, '<hr>');

  // --- Bold + Italic (***text***) ---
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // --- Bold (**text**) ---
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // --- Italic (*text*) ---
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // --- Unordered list items (- item ya * item) ---
  // Pehle list items ko detect karo, phir unko <ul> mein wrap karo
  html = html.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');

  // --- Ordered list items (1. item) ---
  html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li class="ol-item">$1</li>');

  // Consecutive <li> items ko <ul> ya <ol> mein wrap karo
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/((?:<li class="ol-item">.*<\/li>\n?)+)/g, (match) => {
    const cleaned = match.replace(/ class="ol-item"/g, '');
    return `<ol>${cleaned}</ol>`;
  });

  // --- Links [text](url) ---
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // --- Line breaks ---
  // Double newline = paragraph break, single newline = <br>
  // Pehle double newlines handle karo
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph tags (agar pehle se koi block element nahi hai)
  html = `<p>${html}</p>`;

  // Empty <p> tags hatao
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Block elements ko <p> se bahar nikalo (nesting fix)
  html = html.replace(/<p>(<(?:h[1-4]|ul|ol|pre|hr|blockquote)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[1-4]|ul|ol|pre|hr|blockquote)>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

  return html;
}

function updateSendButton() {
  sendBtn.disabled = isWaiting;
}

// --- Start ---
init();
