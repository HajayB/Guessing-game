import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

const socket = io();
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

// Input + buttons
const nameInput = document.querySelector("input[placeholder='Enter Name']");
const createBtn = document.getElementById("createSessionBtn");
const joinBtn = document.getElementById("joinSessionBtn");

// Modal elements
const modal = document.getElementById("sessionModal");
const closeModal = document.getElementById("closeModal");
const confirmJoin = document.getElementById("confirmJoin");
const sessionIdInput = document.getElementById("sessionIdInput");

// ---------------------------------------
// Create Session
// ---------------------------------------
createBtn.onclick = () => {
  const userName = nameInput.value.trim();
  if (!userName) return alert("Enter your name first");

  const sessionId = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
  const userId = crypto.randomUUID().slice(0, 8);

  socket.emit("create_session", { sessionId, userName, userId });

  sessionStorage.setItem("userName", userName);
  sessionStorage.setItem("sessionId", sessionId);
  sessionStorage.setItem("userId", userId);

  window.location.href = `/session/${sessionId}`;
};

// ---------------------------------------
// Join Session → open modal
// ---------------------------------------
joinBtn.onclick = () => {
  if (!nameInput.value.trim()) return alert("Enter your name first");
  modal.style.display = "flex";
};

// Confirm join
confirmJoin.onclick = () => {
  const sessionId = sessionIdInput.value.trim();
  const userName = nameInput.value.trim();
  let userId = sessionStorage.getItem("userId");
  if (!userId) userId = crypto.randomUUID(); // persistent userId for join

  if (!sessionId || !userName) return alert("Enter your name and session ID");  

  const sessionIdPattern = /^[A-Za-z0-9]{6}$/;
  if (!sessionIdPattern.test(sessionId)) {
    showMessage("error", "Invalid session ID. Must be 6 letters/numbers.");
    return;
  }
  sessionStorage.setItem("userName", userName);
  sessionStorage.setItem("sessionId", sessionId);
  sessionStorage.setItem("userId", userId);
  socket.emit("join_session", { sessionId, userName, userId });
}  

// Global socket listeners
socket.on("message:success", () => {
  const userName = sessionStorage.getItem("userName");
  const sessionId = sessionStorage.getItem("sessionId");
  window.location.href = `/session/${sessionId}`;
});

socket.on("message:error", (msg) => {
  showMessage("error", msg.text);
});

// ---------------------------------------
// Close modal
// ---------------------------------------
closeModal.onclick = () => {
  modal.style.display = "none";
};
