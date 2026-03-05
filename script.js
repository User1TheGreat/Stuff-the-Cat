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
    score = 5;
    goal = 25;
    hungerMultiplier = 0.8;
    tickSpeed = 1000;
  } else if (difficulty === "medium") {
    score = 5;
    goal = 75;
    hungerMultiplier = 1.3;
    tickSpeed = 900;
  } else if (difficulty === "hard") {
    score = 5;
    goal = 100;
    hungerMultiplier = 1.7;
    tickSpeed = 700;
  } else if (difficulty === "impossible") {
    score = 5;
    goal = 150;
    hungerMultiplier = 2.5;
    tickSpeed = 600;
  }

  startHungerTimer();
  updateUI();
}

function eat(event) {
  if (event) event.target.blur(); // THE ANTI-CHEAT
  if (!gameActive) return;

  const floatingFish = document.createElement("div");
  floatingFish.innerText = "🐟";
  floatingFish.className = "floating-fish";

  floatingFish.style.left = event.clientX + "px";
  floatingFish.style.top = event.clientY + "px";

  const randomSize = Math.random() * (35 - 15) + 15;
  const randomRotation = Math.floor(Math.random() * 60) - 30;

  floatingFish.style.fontSize = randomSize + "px";
  floatingFish.style.transform = `rotate(${randomRotation}deg)`;

  document.body.appendChild(floatingFish);
  setTimeout(() => {
    floatingFish.remove();
  }, 800);

  let roll = Math.floor(Math.random() * 5);
  if (roll === 3) {
    score += 3;
    currentWidth += 30;
  } else {
    score += 1;
    currentWidth += 10;
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
  // Inside your updateUI() function
  if (score < goal * 0.2) {
    document.getElementById("pet-image").style.filter =
      "sepia(1) saturate(5) hue-rotate(-50deg)";
  } else {
    document.getElementById("pet-image").style.filter = "none";
  }
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
