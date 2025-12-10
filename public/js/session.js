import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();

socket.on("connect", ()=>{
  console.log("Connected to server with ID:", socket.id);
})
//ERROR & SUCCESS MESSAGE FUNCTION
function showMessage(type, text) {
    const box = document.getElementById("msgBox");

    // Reset previous styles
    box.className = ""; 

    // Set type
    if (type === "success") {
        box.classList.add("success");
    } else if (type === "error") {
        box.classList.add("error");
    }

    box.textContent = text;
    box.style.display = "block";

    // Auto-hide after 3 sec
    setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}
// ------------------------
// Socket Elements
// ------------------------
const sessionId = sessionStorage.getItem("sessionId");
const userId = sessionStorage.getItem("userId");
const userName = sessionStorage.getItem("userName");
let userRole = null;
let timerInterval = null;
// UI Elements

//session banner
const sessionIdBanner = document.getElementById("sessionId");
const timer = document.getElementById("timer");

//players list
const playersListEl = document.getElementById("playersList");
const activeCountEl = document.getElementById("activeCount");

//question display
const questionTextEl = document.getElementById("questionText");
const systemMessagesEl = document.getElementById("systemMessages");

//chats 
const chatMessagesEl = document.getElementById("chatMessages"); //display chats 
const chatInput = document.getElementById("chatInput");//enter chat
const sendChatBtn = document.getElementById("sendChat");//send chat button


// ------------------------
// Utility functions
// ------------------------
function addSystemMessage(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  div.classList.add("systemMsg");
  systemMessagesEl.appendChild(div);
  systemMessagesEl.scrollTop = systemMessagesEl.scrollHeight;
}

function addChatMessage(user, msg) {
  const div = document.createElement("div");
  div.innerHTML = `<strong>${user}:</strong> ${msg}`;
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function renderPlayers(players) {
  playersListEl.innerHTML = "";
  players.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("player");
    if (p.role === "master") div.classList.add("master");
    if (p.topScore) div.classList.add("topScore");
    div.textContent = `${p.name} - ${p.score}`;
    playersListEl.appendChild(div);
  });
}
function applyRoleUI(role) {
    userRole = role;

    const masterControls = document.getElementById("masterControls");
    const startRound = document.getElementsByClassName("start_round")[0];
    const playerBox = document.getElementById("playerAnswerBox");
    const questionTextEl = document.getElementById("questionText");

    if (role === "master") {
        questionTextEl.textContent = "You are the Master! Control the game.";
        masterControls.style.display = "block";
        startRound.style.display = "block";
        playerBox.style.display = "none";

        const attemptsDisplay = document.getElementById("attemptsDisplay");
        attemptsDisplay.textContent = "";

        // Initialize master event listeners if not already
        initMasterControls();
    } else if (role === "player") {
        questionTextEl.textContent = "Waiting for the master to start...";
        masterControls.style.display = "none";
        startRound.style.display = "none";
        playerBox.style.display = "none"; // will show when question starts

        const attemptsDisplay = document.getElementById("attemptsDisplay");
        attemptsDisplay.textContent = "";

        // Initialize player event listeners if not already
        initPlayerControls();
    }
}

function initPlayerControls() {
  //Answer input from players 
    const submitBtn = document.getElementById("submitGuessBtn");
    const guessInput = document.getElementById("playerGuessInput");
    const attemptsDisplay = document.getElementById("attemptsDisplay");

    function updateAttempts(player) {
    attemptsDisplay.textContent = `Attempts left: ${player.attemptsLeft}`;
  }

    submitBtn.addEventListener("click", () => {
        const guess = guessInput.value.trim();
        if (!guess) return alert("Enter your guess!");
        socket.emit("submit_guess", { sessionId, guess });
        guessInput.value = "";
    });

      // Listen for your own attempts update from the server
  socket.on("guess:result", ({ correct, attemptsLeft }) => {
    attemptsDisplay.textContent = `Attempts left: ${attemptsLeft}`;
  });
}

function initMasterControls() {
  //Question and answer input for master
    const addQuestionBtn = document.getElementById("add_question");
    const startBtn = document.getElementById("startQuestionBtn");
    const questionInput = document.getElementById("questionInput");
    const answerInput = document.getElementById("answerInput");


// Add question button
addQuestionBtn.addEventListener("click", () => {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  if (!question || !answer) return alert("Enter both question and answer");

  // Send each question directly to backend
  socket.emit("add_questions", { 
    sessionId, 
    questions: [{ questionText: question, answer: answer, duration: 60 }] 
  });

  addSystemMessage(`Question added: "${question}"`);
  questionInput.value = "";
  answerInput.value = "";
});

// Start game button
startBtn.addEventListener("click", () => {
  // Just tell the backend to start the game
  socket.emit("start_game", { sessionId });
  startBtn.disabled = true;
});

}

// ------------------------
// Rejoin session on load
// ------------------------
// Only display your own success message
  socket.on('message:success', (data) => {
    addSystemMessage(data.text); // e.g., "You joined 6ae20c"
    sessionIdBanner.textContent = `Session ID: ${data.sessionId}`;
  });

  // Messages about others joining
  socket.on('message:new', (data) => {
    addSystemMessage(data.text); // e.g., "JB joined the session"
  });

    //user role assign 
document.addEventListener("DOMContentLoaded", () => {
  socket.on("role:assigned", ({ role }) => {
    userRole = role;
    console.log("User role is: ", userRole);
    applyRoleUI(role);
  });
});


socket.on("session:state", (state) => {
  const { connectedPlayers, connectedPlayersCount, masterName } = state;

  // Determine top scorer
  let maxScore = 0;
  connectedPlayers.forEach(p => { if (p.score > maxScore) maxScore = p.score; });
  connectedPlayers.forEach(p => p.topScore = (p.score === maxScore));

  renderPlayers(connectedPlayers);

  activeCountEl.textContent = connectedPlayersCount;


});

// ------------------------
// Socket events
// ------------------------

//start game 

socket.on("game:question", ({ question, questionIndex, totalQuestions, duration, players }) => {
  questionTextEl.textContent = `Q${questionIndex}/${totalQuestions}: ${question}`;
  addSystemMessage("New question started!");

  if (userRole === "player") {
      playerAnswerBox.style.display = "flex"; 
  }
  const me = players.find(p => p.userId === userId);
  if (me) {
      const attemptsDisplay = document.getElementById("attemptsDisplay");
      attemptsDisplay.textContent = `Attempts left: ${me.attemptsLeft}`;
  }
  
  // reset previous interval
  if (timerInterval) clearInterval(timerInterval);

  let timeLeft = duration;

  timer.textContent = `${timeLeft}s`;

  timerInterval = setInterval(() => {
    timeLeft--;
    timer.textContent = `${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
});

socket.on("question:ended", ({ winner, answer, message }) => {
  addSystemMessage(message || `Answer: ${answer}`);
  if (userRole === "player") {
      playerAnswerBox.style.display = "none";
  }
   if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Reset timer display
  timer.textContent = "0s";

});

socket.on("game:ended", ({ players, winner }) => {
  addSystemMessage(`Game over! Winner: ${winner || "No one"}`);
  renderPlayers(players);

});

socket.on("master:changed", ({ newMaster, players }) => {
  addSystemMessage(`New master: ${newMaster}`);
  renderPlayers(players);

  if (userName === newMaster) {
    // You are the new master
    applyRoleUI("master");
  } else if (userRole !== "player") {
    // You were master but now are a player
    applyRoleUI("player");
  }
});

socket.on("chat:new", ({ user, message }) => {
  addChatMessage(user, message);
});


socket.on("message:error", ({ text }) => {
  addSystemMessage(`Error: ${text}`);
});


// ------------------------
// Chat submission
// ------------------------
sendChatBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (!msg) return;
  socket.emit("chat:send", { sessionId, message: msg });
  chatInput.value = "";
};

// Optionally allow Enter key to send chat
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChatBtn.click();
});

// Join session
if (sessionId && userId) {
  socket.emit('join_session', { sessionId, userName, userId });
}

