let score = 0;
let maxScore = 0;
let goal = 0;
let currentWidth = 120;
let hungerMultiplier = 1;
let tickSpeed = 1000;
let gameActive = false;
let hungerInterval;

function startGame(difficulty) {
  document.getElementById("menu-screen").style.display = "none";
  document.getElementById("game-screen").style.display = "block";
  gameActive = true;

  if (difficulty === "easy") {
    score = 3;
    goal = 15;
    hungerMultiplier = 0.5;
    tickSpeed = 2000;
  } else if (difficulty === "medium") {
    score = 5;
    goal = 25;
    hungerMultiplier = 1.0;
    tickSpeed = 1000;
  } else if (difficulty === "hard") {
    score = 0;
    goal = 50;
    hungerMultiplier = 2.0;
    tickSpeed = 600;
  }

  startHungerTimer();
  updateUI();
}

function eat(event) {
  if (event) event.target.blur(); // THE ANTI-CHEAT
  if (!gameActive) return;

  let roll = Math.floor(Math.random() * 4);
  if (roll === 3) {
    score += 3;
    currentWidth += 40;
  } else {
    score += 1;
    currentWidth += 15;
  }

  if (score > maxScore) maxScore = score; // RECORD PEAK SCORE

  updateUI();
  if (score >= goal) winGame();
}

function startHungerTimer() {
  clearInterval(hungerInterval);
  hungerInterval = setInterval(function () {
    if (gameActive && score > 0) {
      currentWidth -= 8 * hungerMultiplier;
      score -= 1;
      if (currentWidth < 120) currentWidth = 120;
      if (score <= 0) {
        score = 0;
        gameOver();
      }
      updateUI();
    }
  }, tickSpeed);
}

function updateUI() {
  document.getElementById("score").innerText = score;
  document.getElementById("goal").innerText = goal;
  document.getElementById("pet-image").style.width = currentWidth + "px";
}

function gameOver() {
  gameActive = false;
  clearInterval(hungerInterval);
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("game-over-screen").style.display = "block";
  document.getElementById("final-score").innerText = maxScore;
}

function winGame() {
  gameActive = false;
  clearInterval(hungerInterval);
  document.getElementById("game-screen").style.display = "none";
  document.getElementById("win-screen").style.display = "block";
  document.getElementById("win-score").innerText = score;
}
