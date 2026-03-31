import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();

socket.on("connect", () => {
  console.log("Connected to server with ID:", socket.id);
});

// ------------------------
// UI Elements
// ------------------------
const sessionIdBanner = document.getElementById("sessionId");
const timerEl = document.getElementById("timer");
const playersListEl = document.getElementById("playersList");
const activeCountEl = document.getElementById("activeCount");
const questionTextEl = document.getElementById("questionText");
const systemMessagesEl = document.getElementById("systemMessages");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChat");
const masterControls = document.getElementById("masterControls");
const startQuestionBtn = document.getElementById("startQuestionBtn");
const playerAnswerBox = document.getElementById("playerAnswerBox");
const submitGuessBtn = document.getElementById("submitGuessBtn");
const playerGuessInput = document.getElementById("playerGuessInput");
const attemptsDisplay = document.getElementById("attemptsDisplay");
const questionInput = document.getElementById("questionInput");
const answerInput = document.getElementById("answerInput");
const msgBox = document.getElementById("msgBox");
const playerWaitingText = document.getElementById("playerWaitingText");

const copyInviteBtn = document.getElementById("copyInviteBtn");
const leaveSessionBtn = document.getElementById("leaveSessionBtn");
const endSessionBtn = document.getElementById("endSessionBtn");

// Sound effects using Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;

    if (type === 'correct') {
      osc.frequency.value = 523; // C5
      osc.type = 'sine';
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
      // Play second note for a "ding-ding"
      setTimeout(() => {
        const ctx2 = getAudioCtx();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2); gain2.connect(ctx2.destination);
        gain2.gain.value = 0.15;
        osc2.frequency.value = 659; // E5
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.5);
        osc2.start(); osc2.stop(ctx2.currentTime + 0.5);
      }, 150);
    } else if (type === 'wrong') {
      osc.frequency.value = 200;
      osc.type = 'sawtooth';
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'tick') {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.08;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'newround') {
      osc.frequency.value = 440;
      osc.type = 'triangle';
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(); osc.stop(ctx.currentTime + 0.6);
    }
  } catch (e) { /* audio not supported */ }
}

let sessionId = sessionStorage.getItem("sessionId");
let userId = sessionStorage.getItem("userId");
let userName = sessionStorage.getItem("userName");
let userRole = null;
let timerInterval = null;
let currentPlayerCount = 0;
let typingTimeout = null;
let chatTypingTimeout = null;
let isLocked = false;
let isCreator = false;

const MIN_PLAYERS = 3;

// ------------------------
// Helper Functions
// ------------------------
function showMessage(type, text) {
  msgBox.className = type;
  msgBox.textContent = text;
  msgBox.style.display = "block";
  setTimeout(() => (msgBox.style.display = "none"), 3000);
}

function addSystemMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.classList.add("systemMsg");
  systemMessagesEl.appendChild(div);
  systemMessagesEl.scrollTop = systemMessagesEl.scrollHeight;
}

function addChatMessage(user, msg, color, avatar) {
  const div = document.createElement("div");
  if (color) div.style.borderLeft = `3px solid ${color}`;
  const strong = document.createElement("strong");
  strong.textContent = (avatar || '') + ' ' + user + ":";
  if (color) strong.style.color = color;
  div.appendChild(strong);
  div.appendChild(document.createTextNode(" " + msg));
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function renderPlayers(players) {
  playersListEl.innerHTML = "";
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let maxScore = Math.max(...players.map(p => p.score));
  sorted.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("player");
    if (p.role === "master") div.classList.add("master");
    if (p.score === maxScore && maxScore > 0) div.classList.add("topScore");
    div.style.borderLeft = `4px solid ${p.color || '#667eea'}`;
    div.innerHTML = `<span class="player-info"><span class="player-avatar">${p.avatar || '🎮'}</span> ${escapeHtml(p.name)}</span><span class="player-score">${p.score}</span>`;
    playersListEl.appendChild(div);
  });
}

function showEndGameModal(players, winner) {
  const modal = document.getElementById("endGameModal");
  const titleEl = document.getElementById("endGameTitle");
  const winnerEl = document.getElementById("endGameWinner");
  const rankingsEl = document.getElementById("endGameRankings");

  titleEl.textContent = "Game Over!";
  if (winner) {
    const winnerPlayer = players.find(p => p.name === winner);
    winnerEl.innerHTML = `<div class="winner-crown">${winnerPlayer?.avatar || '🏆'}</div><div class="winner-name">${escapeHtml(winner)}</div><div class="winner-score">${winnerPlayer?.score || 0} points</div>`;
  } else {
    winnerEl.innerHTML = `<div class="winner-crown">🤝</div><div class="winner-name">It's a tie!</div>`;
  }

  const sorted = [...players].sort((a, b) => b.score - a.score);
  rankingsEl.innerHTML = sorted.map((p, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
    return `<div class="ranking-row" style="border-left: 3px solid ${p.color || '#667eea'}">
      <span class="ranking-pos">${medal}</span>
      <span class="ranking-avatar">${p.avatar || '🎮'}</span>
      <span class="ranking-name">${escapeHtml(p.name)}</span>
      <span class="ranking-score">${p.score}</span>
    </div>`;
  }).join('');

  modal.style.display = "flex";

  document.getElementById("playAgainBtn").onclick = () => {
    modal.style.display = "none";
    window.location.href = "/";
  };
  document.getElementById("goHomeBtn").onclick = () => {
    sessionStorage.clear();
    window.location.href = "/";
  };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ------------------------
// Update Start Button State
// ------------------------
function updateStartButtonState() {
  if (userRole !== "master") return;

  if (currentPlayerCount >= MIN_PLAYERS) {
    startQuestionBtn.disabled = false;
    playerWaitingText.textContent = "✅ Ready to start!";
    playerWaitingText.style.color = "#38ef7d";
  } else {
    startQuestionBtn.disabled = true;
    const needed = MIN_PLAYERS - currentPlayerCount;
    playerWaitingText.textContent = `⏳ Waiting for ${needed} more player${needed > 1 ? 's' : ''} (need ${MIN_PLAYERS})...`;
    playerWaitingText.style.color = "rgba(255,255,255,0.7)";
  }
}

// ------------------------
// Role-based UI
// ------------------------
function applyRoleUI(role) {
  userRole = role;

  if (role === "master") {
    masterControls.style.display = "flex";
    startQuestionBtn.style.display = "inline-block";
    playerWaitingText.style.display = "inline";
    playerAnswerBox.style.display = "none";
    questionTextEl.textContent = "You are the Master! Submit a question to start.";
    updateStartButtonState();
  } else {
    masterControls.style.display = "none";
    startQuestionBtn.style.display = "none";
    playerWaitingText.style.display = "none";
    playerAnswerBox.style.display = "none";
    questionTextEl.textContent = "Waiting for the master to start...";
  }
}

socket.on('message:success', (data) => {
  addSystemMessage(data.text);
  sessionIdBanner.textContent = `Session: ${data.sessionId}`;
});


// ------------------------
// Player Controls
// ------------------------
function submitGuess() {
  if (isLocked) return;
  const guess = playerGuessInput.value.trim();
  if (!guess) return alert("Enter your guess!");
  socket.emit("submit_guess", { sessionId, guess });
  socket.emit("player:stop_typing", { sessionId });
  playerGuessInput.value = "";
}

submitGuessBtn.addEventListener("click", submitGuess);

playerGuessInput.addEventListener("keydown", e => {
  if (e.key === "Enter") submitGuess();
});

// Copy session code
copyInviteBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(sessionId).then(() => {
    copyInviteBtn.textContent = "✅ Copied!";
    setTimeout(() => copyInviteBtn.textContent = "📋 Copy Code", 2000);
  }).catch(() => {
    // Fallback
    const input = document.createElement("input");
    input.value = sessionId;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    copyInviteBtn.textContent = "✅ Copied!";
    setTimeout(() => copyInviteBtn.textContent = "📋 Copy Code", 2000);
  });
});

// Leave session
leaveSessionBtn.addEventListener("click", () => {
  if (!confirm("Are you sure you want to leave?")) return;
  socket.emit("leave_session", { sessionId, userId });
  sessionStorage.clear();
  window.location.href = "/";
});

// End session (master only)
endSessionBtn.addEventListener("click", () => {
  if (!confirm("End the session for everyone?")) return;
  socket.emit("end_session", { sessionId, userId });
});

// Typing indicator — emit while player types in guess input
playerGuessInput.addEventListener("input", () => {
  if (isLocked) return;
  socket.emit("player:typing", { sessionId });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("player:stop_typing", { sessionId });
  }, 1500);
});

socket.on("guess:result", ({ correct, attemptsLeft }) => {
  attemptsDisplay.textContent = `💡 Attempts left: ${attemptsLeft}`;
  if (!correct) playSound('wrong');
  if (attemptsLeft <= 0) {
    isLocked = true;
    playerGuessInput.disabled = true;
    submitGuessBtn.disabled = true;
    playerGuessInput.placeholder = "No attempts left!";
    attemptsDisplay.textContent = "🔒 Locked — no attempts left";
  }
});

// ------------------------
// Master Controls
// ------------------------
startQuestionBtn.addEventListener("click", () => {
  const questionText = questionInput.value.trim();
  const answerText = answerInput.value.trim();
  if (!questionText || !answerText) return alert("Enter both question and answer");

  socket.emit("start_question", {
    sessionId,
    question: {
      questionText,
      answer: answerText,
      duration: 60
    }
  });
  startQuestionBtn.disabled = true;

  questionInput.value = "";
  answerInput.value = "";

});

// ------------------------
// Chat
// ------------------------
sendChatBtn.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit("chat:send", { sessionId, message: msg });
  socket.emit("chat:stop_typing", { sessionId });
  chatInput.value = "";
});

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendChatBtn.click();
});

chatInput.addEventListener("input", () => {
  socket.emit("chat:typing", { sessionId });
  clearTimeout(chatTypingTimeout);
  chatTypingTimeout = setTimeout(() => {
    socket.emit("chat:stop_typing", { sessionId });
  }, 1500);
});

// ------------------------
// Socket Event Handlers
// ------------------------
socket.on("role:assigned", ({ role }) => applyRoleUI(role));

socket.on("session:state", ({ connectedPlayers, connectedPlayersCount, creatorUserId }) => {
  renderPlayers(connectedPlayers);
  activeCountEl.textContent = connectedPlayersCount;
  currentPlayerCount = connectedPlayersCount;
  updateStartButtonState();

  isCreator = creatorUserId === userId;
  endSessionBtn.style.display = isCreator ? "inline-block" : "none";
});

// Typing indicator listeners
socket.on("player:typing", ({ name, avatar }) => {
  let indicator = document.getElementById("typingIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "typingIndicator";
    indicator.className = "typing-indicator";
    playerAnswerBox.parentNode.insertBefore(indicator, playerAnswerBox.nextSibling);
  }
  indicator.textContent = `${avatar || '✏️'} ${name} is typing...`;
  indicator.style.display = "block";
});

socket.on("player:stop_typing", () => {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.style.display = "none";
});

socket.on("game:question", ({ question, players, duration }) => {
  playSound('newround');
  questionTextEl.textContent = question;

  // Reset answer lock
  isLocked = false;
  playerGuessInput.disabled = false;
  submitGuessBtn.disabled = false;
  playerGuessInput.placeholder = "Type your answer...";

  // Remove previous answer reveal if any
  const oldReveal = document.querySelector('.answer-reveal');
  if (oldReveal) oldReveal.remove();

  if (userRole === "player") playerAnswerBox.style.display = "flex";

  // Hide master controls and waiting text during active question
  if (userRole === "master") {
    masterControls.style.display = "none";
    startQuestionBtn.style.display = "none";
    playerWaitingText.style.display = "none";
  }

  const me = players.find(p => p.userId === userId);
  if (me) attemptsDisplay.textContent = `💡 Attempts left: ${me.attemptsLeft}`;

  if (timerInterval) clearInterval(timerInterval);
  let timeLeft = duration;
  timerEl.textContent = `⏱️ ${timeLeft}s`;

  timerEl.classList.remove("timer-warning");
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱️ ${timeLeft}s`;
    if (timeLeft <= 5 && timeLeft > 0) {
      playSound('tick');
      timerEl.classList.add("timer-warning");
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerEl.classList.remove("timer-warning");
    }
  }, 1000);
});

socket.on("question:ended", ({ winner, answer, message }) => {
  if (winner) playSound('correct');
  addSystemMessage(message || "Time's up!");
  if (userRole === "player") playerAnswerBox.style.display = "none";
  if (timerInterval) clearInterval(timerInterval);
  timerEl.textContent = "⏱️ 00:00";

  // Show answer reveal
  const revealDiv = document.createElement("div");
  revealDiv.className = "answer-reveal";
  revealDiv.innerHTML = `<span class="answer-label">Answer:</span> <span class="answer-text">${escapeHtml(answer)}</span>`;
  questionTextEl.parentNode.insertBefore(revealDiv, questionTextEl.nextSibling);
  setTimeout(() => revealDiv.remove(), 8000);
});

socket.on("game:ended", ({ players, winner }) => {
  addSystemMessage(`Game over! Winner: ${winner || "No one"}`);
  renderPlayers(players);
  showEndGameModal(players, winner);
});

socket.on("session:ended_by_master", () => {
  sessionStorage.clear();
  alert("The session has been ended by the host.");
  window.location.href = "/";
});

socket.on("master:changed", ({ newMaster, players }) => {
  addSystemMessage(`👑 New master: ${newMaster}`);
  renderPlayers(players);
  const masterPlayer = players.find(p => p.userId === userId);
  if (masterPlayer?.role === "master") {
    startQuestionBtn.disabled = false;
    applyRoleUI("master");
  }

  else applyRoleUI("player");
});

socket.on("round:awaiting_question", ({ nextMaster, message }) => {
  addSystemMessage(message || `Waiting for ${nextMaster} to submit a question.`);
});

socket.on("chat:typing", ({ name, avatar }) => {
  let indicator = document.getElementById("chatTypingIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "chatTypingIndicator";
    indicator.className = "typing-indicator";
    chatMessagesEl.appendChild(indicator);
  }
  indicator.textContent = `${avatar || '✏️'} ${name} is typing...`;
  indicator.style.display = "block";
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
});

socket.on("chat:stop_typing", () => {
  const indicator = document.getElementById("chatTypingIndicator");
  if (indicator) indicator.style.display = "none";
});

socket.on("chat:new", ({ user, message, color, avatar }) => addChatMessage(user, message, color, avatar));
socket.on("message:new", ({ text }) => addSystemMessage(text));
socket.on("message:error", ({ text }) => {
  addSystemMessage(`❌ Error: ${text}`);
  showMessage("error", text);
});

// ------------------------
// Connection status handling
socket.on("disconnect", () => {
  showMessage("error", "Connection lost — reconnecting...");
  const banner = document.getElementById("sessionBanner");
  banner.style.background = "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)";
});

socket.on("connect", () => {
  const banner = document.getElementById("sessionBanner");
  banner.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  // Re-join session after reconnection
  if (sessionId && userId) {
    socket.emit("player_rejoined", { userId, sessionId });
  }
});

// Join session on load
// ------------------------
if (sessionId && userId) {
  sessionIdBanner.textContent = `Session: ${sessionId}`;
  socket.emit("join_session", { sessionId, userName, userId });
} else {
  // No session data — redirect to home page
  window.location.href = "/";
}
