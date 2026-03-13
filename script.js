let score = 0;
let maxScore = 0;
let goal = 0;
let hungerMultiplier = 1;
let tickSpeed = 1000;
let gameActive = false;
let hungerInterval = null;
let currentDifficulty = "";
let startTime;

function startGame(difficulty) {
  clearInterval(hungerInterval);
  score = 5;
  maxScore = 5;
  currentDifficulty = difficulty;
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  gameActive = true;

  // Exact Fair Values
  if (difficulty === "easy") {
    score = 5;
    goal = 75;
    hungerMultiplier = 0.6;
    tickSpeed = 1000;
  } else if (difficulty === "medium") {
    score = 5;
    goal = 150;
    hungerMultiplier = 1.2;
    tickSpeed = 900;
  } else if (difficulty === "hard") {
    score = 5;
    goal = 300;
    hungerMultiplier = 2.0;
    tickSpeed = 800;
  } else if (difficulty === "extreme") {
    score = 5;
    goal = 600;
    hungerMultiplier = 3.2;
    tickSpeed = 700;
  } else if (difficulty === "master") {
    score = 5;
    goal = 800;
    hungerMultiplier: 3.8;
    tickSpeed = 500;
  } else if (difficulty === "impossible") {
    score = 5;
    goal = 1000;
    hungerMultiplier = 4.5;
    tickSpeed = 600;
  } else if (difficulty === "divine") {
    score = 5;
    goal = 1500;
    hungerMultiplier = 6.0;
    tickSpeed = 500;
  }

  startTime = Date.now();
  startHungerTimer();
  updateUI();
}

function eat(event) {
  if (event) event.target.blur();
  if (!gameActive) return;

  // Spawn Fish Explosion
  const burstCount = Math.floor(Math.random() * 5) + 4;
  for (let i = 0; i < burstCount; i++) {
    const floatingFish = document.createElement("div");
    floatingFish.innerText = "🐟";
    floatingFish.className = "floating-fish";
    floatingFish.style.left = event.clientX + "px";
    floatingFish.style.top = event.clientY + "px";

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 160 + 80;
    const xMove = Math.cos(angle) * velocity;
    const yMove = Math.sin(angle) * velocity;

    floatingFish.style.setProperty("--x-move", `${xMove}px`);
    floatingFish.style.setProperty("--y-move", `${yMove}px`);
    floatingFish.style.fontSize = (Math.random() * 14 + 18).toFixed(2) + "px";

    document.body.appendChild(floatingFish);
    setTimeout(() => {
      floatingFish.remove();
    }, 750);
  }

  // Jackpot Logic
  let roll = Math.floor(Math.random() * 20);
  if (roll === 19) {
    score += 10;
    document.getElementById("score").style.color = "#fed330";
    setTimeout(() => {
      document.getElementById("score").style.color = "white";
    }, 300);
  } else if (roll >= 15) {
    score += 5;
  } else {
    score += 1;
  }

  if (score > maxScore) maxScore = score;

  updateUI();

  // Win Check
  if (score >= goal) {
    winGame();
  }
}

function startHungerTimer() {
  clearInterval(hungerInterval);
  hungerInterval = setInterval(function () {
    if (gameActive && score > 0) {
      // Subtract hunger and stay above 0
      score = Math.max(0, parseFloat(score) - hungerMultiplier);
      if (score <= 0) {
        score = 0;
        updateUI();
        gameOver();
      } else {
        updateUI();
      }
    }
  }, tickSpeed);
}

function updateUI() {
  // Fix: Ensure score is a number before fixing decimals
  let displayScore = Number(score).toFixed(1);

  document.getElementById("score").innerText = displayScore;
  document.getElementById("goal").innerText = goal;

  const pet = document.getElementById("pet-image");
  if (score < 10 && gameActive) {
    pet.classList.add("panic");
  } else {
    pet.classList.remove("panic");
  }

  let progress = score / goal;
  let scoreElement = document.getElementById("score");

  if (progress < 0.2)
    scoreElement.style.color = "#ff4d4d"; // Danger Red
  else if (progress < 0.6)
    scoreElement.style.color = "#fed330"; // Warning Yellow
  else scoreElement.style.color = "#26de81"; // Success Green

  // Fix: Force math calculation so the cat grows
  let newWidth = Math.min(120 + score * 1.5, 380);
  document.getElementById("pet-image").style.width = newWidth + "px";
}

function gameOver() {
  gameActive = false;
  clearInterval(hungerInterval);
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "block";
  // Fix: Clean decimal on final screen
  document.getElementById("final-score").innerText =
    Number(maxScore).toFixed(1);
}

// 1. UPDATED WIN FUNCTION
function winGame() {
  gameActive = false;
  clearInterval(hungerInterval);

  let totalSeconds = (Date.now() - startTime) / 1000;
  let cps = (goal / totalSeconds).toFixed(2);
  let numCPS = parseFloat(cps);

  // THE 7 ELITE RANKS
  let rank = "NOVICE";
  let color = "#95a5a6";

  if (numCPS >= 20.0) {
    rank = "DIVINE";
    color = "#ffffff";
  } else if (numCPS >= 16.0) {
    rank = "ASCENDED";
    color = "#00fbff";
  } else if (numCPS >= 13.0) {
    rank = "MYTHIC";
    color = "#bf00ff";
  } else if (numCPS >= 10.0) {
    rank = "LEGEND";
    color = "#f1c40f";
  } else if (numCPS >= 8.0) {
    rank = "ELITE";
    color = "#e67e22";
  } else if (numCPS >= 6.0) {
    rank = "ADEPT";
    color = "#2ecc71";
  }

  // Update the Win Screen
  document.getElementById("win-speed").innerText = cps;
  const rankText = document.getElementById("win-rank");
  rankText.innerText = rank;
  rankText.style.color = color;

  document.getElementById("game-screen").style.display = "none";
  document.getElementById("win-screen").style.display = "block";

  // SAVE TO LOCAL STORAGE
  let bestKey = "best_cps_" + currentDifficulty;
  let currentBest = localStorage.getItem(bestKey) || 0;

  if (numCPS > parseFloat(currentBest)) {
    localStorage.setItem(bestKey, cps);
    localStorage.setItem(bestKey + "_rank", rank);
    localStorage.setItem(bestKey + "_color", color);
    loadBestRecords(); // Update the menu instantly
  }
}

// 2. LOAD RECORDS FUNCTION (Call this on window.onload)
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
  modes.forEach((mode) => {
    let savedCPS = localStorage.getItem("best_cps_" + mode);
    let savedRank = localStorage.getItem("best_cps_" + mode + "_rank");
    let savedColor = localStorage.getItem("best_cps_" + mode + "_color");

    if (savedCPS) {
      const element = document.getElementById("record-" + mode);
      if (element) {
        element.innerText = `${savedRank} (${savedCPS})`;
        element.style.color = savedColor;
      }
    }
  });
}

// Ensure this runs when the game starts
window.onload = loadBestRecords;
