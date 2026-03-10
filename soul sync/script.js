// ========== Section Navigation ==========
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ========== Chat logic ==========
const sendBtn = document.getElementById("sendBtn");
const voiceBtn = document.getElementById("voiceBtn");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");

function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "user" ? "text-right" : "text-left";
  msgDiv.innerHTML = `<span class="inline-block p-2 rounded-lg ${sender === "user" ? "bg-blue-400 text-white" : "bg-blue-100 text-blue-900"}">${text}</span>`;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

async function sendMessage(message) {
  appendMessage("user", message);
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message })
    });
    const data = await res.json();
    const aiText = data?.completion || "Hmm... I’m thinking.";
    appendMessage("ai", aiText);
    speak(aiText);
    highlightAvatarWhileSpeaking();
  } catch (e) {
    appendMessage("ai", "⚠️ Could not reach AI (Ollama).");
  }
}

sendBtn.addEventListener("click", () => {
  const msg = userInput.value.trim();
  if (!msg) return;
  userInput.value = "";
  sendMessage(msg);
});

voiceBtn.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    userInput.value = speechText;
    sendMessage(speechText);
  };
});

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
}

// ========== Avatar 3D with Three.js ==========
let scene, camera, renderer, avatarModel;
let avatarContainer = document.getElementById("avatarContainer");

function initAvatar() {
  // Create scene & camera
  scene = new THREE.Scene();
  const width = avatarContainer.clientWidth;
  const height = avatarContainer.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.5, 3);

  // Renderer
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  avatarContainer.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.6);
  directional.position.set(1, 2, 1);
  scene.add(directional);

  // Load GLB model
  const loader = new THREE.GLTFLoader();
  loader.load(
    "https://models.readyplayer.me/68e272e7fedc24530086367a.glb",
    (gltf) => {
      avatarModel = gltf.scene;
      avatarModel.scale.set(0.8, 0.8, 0.8);
      avatarModel.rotation.y = Math.PI;  // turn it to face front
      scene.add(avatarModel);
    },
    (xhr) => {
      // optional: progress
    },
    (error) => {
      console.error("Error loading avatar:", error);
    }
  );

  // Start render loop
  animateAvatar();
}

function animateAvatar() {
  requestAnimationFrame(animateAvatar);
  if (avatarModel) {
    // slowly rotate
    avatarModel.rotation.y += 0.005;
  }
  renderer.render(scene, camera);
}

// Glow/highlight effect while speaking
function highlightAvatarWhileSpeaking() {
  if (!avatarModel) return;
  const origColor = avatarModel.material?.color?.clone?.() || null;

  // Simple scale-up effect
  avatarModel.scale.set(0.9, 0.9, 0.9);
  setTimeout(() => {
    avatarModel.scale.set(0.8, 0.8, 0.8);
  }, 300);
}

// ========== Mood Tracker ==========
function saveMood(emoji) {
  localStorage.setItem("mood", emoji);
  document.getElementById("moodMessage").innerText = `Mood saved: ${emoji}`;
}

// ========== Journal ==========
function saveJournal() {
  const text = document.getElementById("journalInput").value.trim();
  if (!text) return;
  const entries = JSON.parse(localStorage.getItem("journal") || "[]");
  entries.push({ text, date: new Date().toLocaleString() });
  localStorage.setItem("journal", JSON.stringify(entries));
  document.getElementById("journalInput").value = "";
  loadJournal();
}

function loadJournal() {
  const list = document.getElementById("journalList");
  list.innerHTML = "";
  const entries = JSON.parse(localStorage.getItem("journal") || "[]");
  entries.forEach(e => {
    const div = document.createElement("div");
    div.className = "bg-blue-100 p-2 rounded";
    div.innerText = `${e.date}: ${e.text}`;
    list.appendChild(div);
  });
}
loadJournal();

// ========== Toolkit ==========
function breathingExercise() {
  document.getElementById("toolkitMessage").innerText = "🌬️ Inhale... Exhale slowly... Repeat 5 times.";
}
function affirmation() {
  const affirmations = [
    "You are enough.",
    "You’re doing your best, and that’s okay.",
    "Peace begins with a single breath.",
    "You are stronger than you think."
  ];
  const msg = affirmations[Math.floor(Math.random() * affirmations.length)];
  document.getElementById("toolkitMessage").innerText = msg;
  speak(msg);
}
function mindfulnessTip() {
  document.getElementById("toolkitMessage").innerText = "🧘 Focus on your surroundings. What do you see, hear, and feel?";
}

// ========== Profile ==========
function saveProfile() {
  const name = document.getElementById("userName").value.trim();
  if (!name) return;
  localStorage.setItem("name", name);
  document.getElementById("profileMessage").innerText = `Saved! Welcome, ${name}.`;
}

// ========== When page loads ==========
window.addEventListener("load", () => {
  showSection("homeScreen");
  initAvatar();
});
