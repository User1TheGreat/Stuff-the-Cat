// ==========================================
// 1. GAME STATE VARIABLES & LOCAL STORAGE
// ==========================================
let score = 0;
let maxScore = 0;
let goal = 0;
let hungerMultiplier = 1;
let tickSpeed = 1000;
let gameActive = false;
let hungerInterval = null;
let currentDifficulty = "";
let startTime;
let cpsInterval = null;

let settings = JSON.parse(localStorage.getItem("cat_settings")) || {
  music: false,
  sfx: true,
  perf: false,
  musicVol: 0.3,
  sfxVol: 0.8,
};

// ==========================================
// 2. AUDIO SYSTEM
// ==========================================
const sounds = {
  music: new Audio("Audio/BackgroundMusic.mp3"),
  win: new Audio("Audio/Win.mp3"),
  lose: new Audio("Audio/Lose.mp3"),
};

const clickPool = Array.from(
  { length: 10 },
  () => new Audio("Audio/Click.mp3"),
);
let poolIndex = 0;
sounds.music.loop = true;

function playClick() {
  if (!settings.sfx) return;
  const sound = clickPool[poolIndex];
  sound.currentTime = 0;
  sound.play();
  poolIndex = (poolIndex + 1) % clickPool.length;
}

// ==========================================
// 3. SETTINGS & MODALS
// ==========================================
function initSettings() {
  // 1. Set Volumes
  sounds.music.volume = settings.musicVol;
  clickPool.forEach((s) => (s.volume = settings.sfxVol));
  sounds.win.volume = settings.sfxVol;
  sounds.lose.volume = settings.sfxVol;

  // 2. Set Slider Values
  document.getElementById("music-volume").value = settings.musicVol;
  document.getElementById("sfx-volume").value = settings.sfxVol;

  // 3. Set Button UI (On/Off)
  ["music", "sfx", "perf"].forEach((type) => {
    const btn = document.getElementById(`${type}-toggle`);
    if (btn) {
      const isActive = settings[type];
      btn.innerText = isActive ? "ON" : "OFF";
      btn.className = `toggle-btn ${isActive ? "on" : "off"}`;
    }
  });

  // 4. Performance Mode Check
  if (settings.perf) document.body.classList.add("low-perf");

  // Load High Scores for the stats board
  loadBestRecords();
}

function saveSettings() {
  localStorage.setItem("cat_settings", JSON.stringify(settings));
}

function updateVolume(type, val) {
  const volume = parseFloat(val);
  if (type === "music") {
    settings.musicVol = volume;
    sounds.music.volume = volume;
  } else {
    settings.sfxVol = volume;
    clickPool.forEach((s) => (s.volume = volume));
    sounds.win.volume = volume;
    sounds.lose.volume = volume;
  }
  saveSettings();
}

function handleToggle(type) {
  settings[type] = !settings[type];
  const btn = document.getElementById(`${type}-toggle`);
  btn.innerText = settings[type] ? "ON" : "OFF";
  btn.className = `toggle-btn ${settings[type] ? "on" : "off"}`;

  if (type === "music" && settings.music) {
    if (sounds.music.volume === 0) sounds.music.volume = 0.3; // Default to 30% if muted
    sounds.music.play();
  }

  if (type === "music") {
    settings.music ? sounds.music.play() : sounds.music.pause();
  }
  if (type === "perf") {
    document.body.classList.toggle("low-perf", settings.perf);
  }
  saveSettings();
}

function toggleSettings(show) {
  document.getElementById("settings-modal").style.display = show
    ? "flex"
    : "none";
}

function toggleStats(show) {
  document.getElementById("stats-modal").style.display = show ? "flex" : "none";
  if (show) loadBestRecords();
}

// ==========================================
// 4. CORE GAMEPLAY
// ==========================================
function startGame(difficulty) {
  if (settings.music && sounds.music.paused) {
    sounds.music.play();
  }
  clearInterval(hungerInterval);
  clearInterval(cpsInterval);
  score = 5;
  maxScore = 5;
  currentDifficulty = difficulty;

  const container = document.getElementById("game-container");
  container.classList.add("shake-screen");
  setTimeout(() => container.classList.remove("shake-screen"), 100);

  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  gameActive = true;

  // Difficulty Mapping
  const config = {
    easy: { goal: 75, multi: 0.6, tick: 1000 },
    medium: { goal: 150, multi: 1.2, tick: 900 },
    hard: { goal: 300, multi: 2.0, tick: 800 },
    extreme: { goal: 600, multi: 3.2, tick: 750 },
    master: { goal: 800, multi: 3.8, tick: 700 },
    impossible: { goal: 1000, multi: 4.5, tick: 600 },
    divine: { goal: 1500, multi: 6.0, tick: 500 },
  };

  goal = config[difficulty].goal;
  hungerMultiplier = config[difficulty].multi;
  tickSpeed = config[difficulty].tick;

  startTime = Date.now();
  startCPSCounter();
  startHungerTimer();
  updateUI();
}

function eat(event) {
  if (event) event.target.blur();
  if (!gameActive) return;
  playClick();

  // Visuals
  const burstCount = Math.floor(Math.random() * 5) + 4;
  for (let i = 0; i < burstCount; i++) {
    const floatingFish = document.createElement("div");
    floatingFish.innerText = "🐟";
    floatingFish.className = "floating-fish";
    floatingFish.style.left = event.clientX + "px";
    floatingFish.style.top = event.clientY + "px";
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 160 + 80;
    floatingFish.style.setProperty(
      "--x-move",
      `${Math.cos(angle) * velocity}px`,
    );
    floatingFish.style.setProperty(
      "--y-move",
      `${Math.sin(angle) * velocity}px`,
    );
    document.body.appendChild(floatingFish);
    setTimeout(() => floatingFish.remove(), 750);
  }

  // Score Logic
  let roll = Math.floor(Math.random() * 20);
  if (roll === 19) {
    score += 10;
    document.getElementById("score").style.color = "#fed330";
    setTimeout(
      () => (document.getElementById("score").style.color = "white"),
      300,
    );
  } else if (roll >= 15) score += 5;
  else score += 1;

  if (score > maxScore) maxScore = score;

  let totalFed = parseInt(localStorage.getItem("total_fish_fed") || 0);
  localStorage.setItem("total_fish_fed", totalFed + 1);

  updateUI();
  if (score >= goal) winGame();
}

function updateUI() {
  document.getElementById("score").innerText = Number(score).toFixed(1);
  document.getElementById("goal").innerText = goal;
  const progress = score / goal;
  const pet = document.getElementById("pet-image");

  if (score < 10 && gameActive) pet.classList.add("panic");
  else pet.classList.remove("panic");

  let newWidth = Math.min(120 + score * 1.5, 380);
  pet.style.width = newWidth + "px";
}

// ==========================================
// 5. TIMERS & TRACKERS
// ==========================================
function startCPSCounter() {
  cpsInterval = setInterval(() => {
    if (gameActive) {
      let elapsed = (Date.now() - startTime) / 1000;
      let currentAverage = elapsed > 0 ? score / elapsed : 0;
      let liveDisplay = document.getElementById("live-cps");
      liveDisplay.innerText = currentAverage.toFixed(2);

      if (currentAverage >= 20) liveDisplay.style.color = "#ffffff";
      else if (currentAverage >= 13) liveDisplay.style.color = "#bf00ff";
      else if (currentAverage >= 8) liveDisplay.style.color = "#e67e22";
      else liveDisplay.style.color = "#95a5a6";
    }
  }, 100);
}

function startHungerTimer() {
  hungerInterval = setInterval(() => {
    if (gameActive && score > 0) {
      score = Math.max(0, score - hungerMultiplier);
      if (score <= 0) gameOver();
      updateUI();
    }
  }, tickSpeed);
}

function stopTimers() {
  clearInterval(hungerInterval);
  clearInterval(cpsInterval);
  hungerInterval = null;
  cpsInterval = null;
}

// ==========================================
// 6. WIN/LOSS LOGIC & RECORDS
// ==========================================
function winGame() {
  gameActive = false;
  stopTimers();
  if (settings.sfx) sounds.win.play();

  let totalSeconds = (Date.now() - startTime) / 1000;
  let cps = (goal / totalSeconds).toFixed(2);
  let numCPS = parseFloat(cps);

  // Ranks
  let rank = "NOVICE",
    color = "#95a5a6";
  if (numCPS >= 40) {
    rank = "OMNIPOTENT";
    color = "#ffffff";
  } else if (numCPS >= 35) {
    rank = "ETERNAL";
    color = "#00d2ff";
  } else if (numCPS >= 30) {
    rank = "IMPOSSIBLE";
    color = "#ff4d4d";
  } else if (numCPS >= 25) {
    rank = "GODLIKE";
    color = "#f9ca24";
  } else if (numCPS >= 20) {
    rank = "DIVINE";
    color = "#ffffff";
  } else if (numCPS >= 13) {
    rank = "MYTHIC";
    color = "#bf00ff";
  } else if (numCPS >= 8) {
    rank = "ELITE";
    color = "#e67e22";
  } else if (numCPS >= 6) {
    rank = "ADEPT";
    color = "#2ecc71";
  }

  document.getElementById("win-speed").innerText = cps;
  const rankText = document.getElementById("win-rank");
  rankText.innerText = rank;
  rankText.style.color = color;
  rankText.style.textShadow = numCPS >= 30 ? `0 0 20px ${color}` : "none";

  document.getElementById("game-screen").style.display = "none";
  document.getElementById("win-screen").style.display = "block";

  let bestKey = "best_cps_" + currentDifficulty;
  if (numCPS > parseFloat(localStorage.getItem(bestKey) || 0)) {
    localStorage.setItem(bestKey, cps);
    localStorage.setItem(bestKey + "_rank", rank);
    localStorage.setItem(bestKey + "_color", color);
    loadBestRecords();
  }
}

function gameOver() {
  gameActive = false;
  stopTimers();
  if (settings.sfx) sounds.lose.play();
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "block";
  document.getElementById("final-score").innerText =
    Number(maxScore).toFixed(1);
}

function loadBestRecords() {
  const modes = [
    "easy",
    "medium",
    "hard",
    "extreme",
    "master",
    "impossible",
    "divine",
  ];
  let bestRankFound = "NONE",
    highestCPS = 0,
    bestColor = "#95a5a6";

  modes.forEach((mode) => {
    let savedCPS = localStorage.getItem("best_cps_" + mode);
    let savedRank = localStorage.getItem("best_cps_" + mode + "_rank");
    let savedColor = localStorage.getItem("best_cps_" + mode + "_color");

    const elements = document.querySelectorAll("#record-" + mode);
    elements.forEach((el) => {
      if (savedCPS) {
        el.innerText = `${savedRank} (${savedCPS})`;
        el.style.color = savedColor;
      }
    });

    if (savedCPS && parseFloat(savedCPS) > highestCPS) {
      highestCPS = parseFloat(savedCPS);
      bestRankFound = savedRank;
      bestColor = savedColor;
    }
  });

  document.getElementById("total-fish-count").innerText =
    localStorage.getItem("total_fish_fed") || 0;
  const bestEl = document.getElementById("all-time-best");
  if (highestCPS > 0)
    bestEl.innerText = `${bestRankFound} (${highestCPS.toFixed(2)} CPS)`;
  else bestEl.innerText = "NONE";
  bestEl.style.color = bestColor;
}

function quitToMenu() {
  // 1. Stop all game timers
  stopTimers();
  gameActive = false;

  // 2. Reset the cat's appearance
  const pet = document.getElementById("pet-image");
  pet.style.width = "120px";
  pet.classList.remove("panic");

  // 3. Switch the screens (Hide Game/Win/Over, Show Menu)
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("win-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "none";
  document.getElementById("menu-screen").style.display = "block";

  // 4. Update the high scores on the menu just in case
  loadBestRecords();
}

// ==========================================
// 7. INITIALIZATION & WINDOW EVENTS
// ==========================================
window.addEventListener("load", () => {
  const loader = document.getElementById("loading-screen");
  setTimeout(() => {
    loader.classList.add("loader-hidden");
  }, 1800);
});

window.addEventListener("load", initSettings);
