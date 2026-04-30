/* ============================================
   FOG — Dynamic Grid Challenge — JS
   Click-based: click blue to collect, red blinks
   Moving red blocks, visually rich patterns
   ============================================ */

// --- State ---
let rows = 10, cols = 10;
let currentPattern = 1;
let baseGrid = [];
let redPositions = [];
let lives = 5;
let timeLeft = 30;
let blueRemaining = 0;
let blueTotal = 0;
let timerInterval = null;
let gameActive = false;
let pattern1Completed = false;
let moveTick = 0;
let moveInterval = null;
const RED_MOVE_SPEED = 600; // ms between red movements

// --- DOM ---
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const resultModal = document.getElementById('resultModal');
const transitionOverlay = document.getElementById('transitionOverlay');
const gridEl = document.getElementById('grid');
const heartsEl = document.getElementById('hearts');
const timerValueEl = document.getElementById('timerValue');
const scoreValueEl = document.getElementById('scoreValue');
const patternValueEl = document.getElementById('patternValue');
const startBtn = document.getElementById('startBtn');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultIcon = document.getElementById('resultIcon');
const resultStats = document.getElementById('resultStats');
const resultActionBtn = document.getElementById('resultActionBtn');
const resultRestartBtn = document.getElementById('resultRestartBtn');
const transitionCountdown = document.getElementById('transitionCountdown');
const rowsInput = document.getElementById('rowsInput');
const colsInput = document.getElementById('colsInput');
const gridContainerEl = document.getElementById('gridContainer');

// --- Input Controls ---
document.getElementById('rowsMinus').addEventListener('click', () => {
  rowsInput.value = Math.max(10, parseInt(rowsInput.value) - 1);
});
document.getElementById('rowsPlus').addEventListener('click', () => {
  rowsInput.value = Math.min(30, parseInt(rowsInput.value) + 1);
});
document.getElementById('colsMinus').addEventListener('click', () => {
  colsInput.value = Math.max(10, parseInt(colsInput.value) - 1);
});
document.getElementById('colsPlus').addEventListener('click', () => {
  colsInput.value = Math.min(30, parseInt(colsInput.value) + 1);
});
rowsInput.addEventListener('change', () => {
  rowsInput.value = Math.max(10, Math.min(30, parseInt(rowsInput.value) || 10));
});
colsInput.addEventListener('change', () => {
  colsInput.value = Math.max(10, Math.min(30, parseInt(colsInput.value) || 10));
});

// Pattern selector
document.querySelectorAll('.pattern-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pattern-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPattern = parseInt(btn.dataset.pattern);
  });
});

// --- Start ---
startBtn.addEventListener('click', () => {
  rows = Math.max(10, Math.min(30, parseInt(rowsInput.value) || 10));
  cols = Math.max(10, Math.min(30, parseInt(colsInput.value) || 10));
  pattern1Completed = false;
  startGame();
});

function startGame() {
  setupScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resultModal.classList.add('hidden');
  transitionOverlay.classList.add('hidden');

  lives = 5;
  timeLeft = 30;
  moveTick = 0;
  gameActive = true;

  patternValueEl.textContent = currentPattern;
  generateGrid();
  buildDOM();
  renderGrid();
  updateHUD();
  startTimer();
  startRedMovement();
}

// =============================================
// PATTERN GENERATION
// =============================================

function generateGrid() {
  baseGrid = [];
  for (let r = 0; r < rows; r++) {
    baseGrid[r] = [];
    for (let c = 0; c < cols; c++) {
      baseGrid[r][c] = getStaticTile(r, c, currentPattern);
    }
  }
  redPositions = getInitialRedPositions(currentPattern);

  blueRemaining = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (baseGrid[r][c] === 'blue') blueRemaining++;
  blueTotal = blueRemaining;
}

function getStaticTile(r, c, pattern) {
  return pattern === 1 ? p1Static(r, c) : p2Static(r, c);
}

// ---- PATTERN 1: "Diamond Wave" ----
// Blue tiles in a diamond/zigzag wave, green borders, dark background
function p1Static(r, c) {
  // Keep rectangular board with a safe base strip.
  if (r >= rows - 1) return 'green';
  if (r === rows - 2 && c > 0 && c < cols - 1) return 'green';

  const mid = (cols - 1) / 2;
  const d = Math.abs(c - mid);
  const t = rows > 1 ? r / (rows - 1) : 0;

  // Two mirrored hourglass loops, similar to the reference pattern.
  const centerA = 0.22 + 0.22 * Math.cos(t * Math.PI * 2);
  const centerB = 0.78 + 0.22 * Math.cos(t * Math.PI * 2 + Math.PI);
  const targetA = centerA * mid;
  const targetB = centerB * mid;
  // Keep track dark so moving red locks can animate on top.
  if (Math.abs(d - targetA) <= 0.65 || Math.abs(d - targetB) <= 0.65) return 'dark';

  // Blue checkpoint locks near loop edges.
  if ((r % 4 === 0 || r % 4 === 1) && (Math.abs(d - (targetA + 1.5)) < 0.55 || Math.abs(d - (targetB + 1.5)) < 0.55)) {
    return 'blue';
  }

  return 'dark';
}

// ---- PATTERN 2: "Spiral Rings" ----
// Concentric rings with blue checkpoints, green center & edges
function p2Static(r, c) {
  // Outer green frame like the screenshot.
  if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) return 'green';
  if (r === 1 || r === rows - 2 || c === 1 || c === cols - 2) return 'green';

  const centerR = Math.floor(rows / 2);
  const centerC = Math.floor(cols / 2);
  const dr = Math.abs(r - centerR);
  const dc = Math.abs(c - centerC);

  // Keep center dark so moving red locks can animate on top.
  if (dr <= 1 && dc <= 1) return 'dark';

  // Keep right lane dark so moving red locks can animate on top.
  if (c === cols - 3 && r > 2 && r < rows - 3 && r % 5 < 3) return 'dark';

  // Blue accents near borders and center lanes.
  if ((c === 2 || c === cols - 3) && r % 3 !== 0) return 'blue';
  if ((r === 2 || r === rows - 3) && c % 3 !== 0) return 'blue';
  if ((dc === 2 || dr === 2) && (r + c) % 2 === 0) return 'blue';

  return 'dark';
}

// ---- PATTERN 1 RED TILES: Horizontal scrolling blocks ----
function p1Reds() {
  const reds = [];
  const innerLeft = 1;
  const innerRight = cols - 2;
  for (let r = 2; r < rows - 2; r++) {
    if (r % 2 !== 0) continue;
    const mid = (cols - 1) / 2;
    const t = rows > 1 ? r / (rows - 1) : 0;
    const offset = Math.round((0.22 + 0.22 * Math.cos(t * Math.PI * 2)) * mid);
    const leftStart = Math.max(innerLeft, Math.round(mid - offset) - 1);
    const rightStart = Math.min(innerRight - 1, Math.round(mid + offset));
    reds.push({ r, c: leftStart, dir: 1, type: 'horizontal' });
    reds.push({ r, c: leftStart + 1, dir: 1, type: 'horizontal' });
    reds.push({ r, c: rightStart, dir: -1, type: 'horizontal' });
    reds.push({ r, c: rightStart - 1, dir: -1, type: 'horizontal' });
  }
  return reds;
}

// ---- PATTERN 2 RED TILES: Static center + orbiting outer ----
function p2Reds() {
  const reds = [];
  const cr = Math.floor(rows / 2);
  const cc = Math.floor(cols / 2);

  // Orbiting center cluster.
  const orbitRadii = [1.5, 2.5];
  orbitRadii.forEach((radius, idx) => {
    const count = idx === 0 ? 6 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      reds.push({
        r: cr,
        c: cc,
        type: 'orbit',
        centerR: cr,
        centerC: cc,
        radius,
        angle,
        speed: idx === 0 ? 0.16 : -0.11
      });
    }
  });

  // Right-side moving red lane.
  const laneC = Math.max(2, cols - 3);
  for (let r = 3; r < rows - 3; r += 3) {
    reds.push({ r, c: laneC, dir: 1, type: 'vertical' });
  }
  return reds;
}

function getInitialRedPositions(pattern) {
  return pattern === 1 ? p1Reds() : p2Reds();
}

// =============================================
// RED TILE MOVEMENT
// =============================================
function startRedMovement() {
  clearInterval(moveInterval);
  moveInterval = setInterval(() => {
    if (!gameActive) return;
    moveTick++;
    moveRedTiles();
    renderGrid();
  }, RED_MOVE_SPEED);
}

function moveRedTiles() {
  redPositions.forEach(red => {
    if (red.type === 'static') return;

    if (red.type === 'horizontal') {
      red.c += red.dir;
      if (red.c >= cols - 1) red.c = 1;
      if (red.c < 1) red.c = cols - 2;
    }

    if (red.type === 'orbit') {
      red.angle += red.speed;
      red.r = Math.round(red.centerR + Math.sin(red.angle) * red.radius);
      red.c = Math.round(red.centerC + Math.cos(red.angle) * red.radius);
      red.r = Math.max(2, Math.min(rows - 3, red.r));
      red.c = Math.max(1, Math.min(cols - 2, red.c));
    }

    if (red.type === 'vertical') {
      red.r += red.dir;
      if (red.r >= rows - 3) red.r = 2;
      if (red.r < 2) red.r = rows - 4;
    }
  });
}

// =============================================
// RENDERING
// =============================================
function getTileAt(r, c) {
  if (redPositions.some(red => red.r === r && red.c === c)) return 'red';
  return baseGrid[r][c];
}

function buildDOM() {
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  gridEl.classList.remove('pattern-1', 'pattern-2');
  gridEl.classList.add(currentPattern === 1 ? 'pattern-1' : 'pattern-2');
  gridEl.innerHTML = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.id = `cell-${r}-${c}`;
      cell.style.setProperty('--tile-r', r);
      cell.style.setProperty('--tile-c', c);
      cell.dataset.num = String(r * cols + c + 1);
      cell.addEventListener('click', () => handleTileClick(r, c));
      gridEl.appendChild(cell);
    }
  }
  fitGridToContainer();
}

function fitGridToContainer() {
  if (!gridContainerEl) return;
  const rect = gridContainerEl.getBoundingClientRect();
  const gap = 3;
  const gridPadding = 6; // 3px on each side
  const availableW = Math.max(120, rect.width - 20);
  const availableH = Math.max(120, rect.height - 20);
  const cellSize = Math.floor(Math.min(
    (availableW - gridPadding - gap * (cols - 1)) / cols,
    (availableH - gridPadding - gap * (rows - 1)) / rows
  ));
  const safeCellSize = Math.max(8, cellSize);
  const finalW = safeCellSize * cols + gap * (cols - 1) + gridPadding;
  const finalH = safeCellSize * rows + gap * (rows - 1) + gridPadding;
  gridEl.style.width = `${finalW}px`;
  gridEl.style.height = `${finalH}px`;
}

function renderGrid() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.getElementById(`cell-${r}-${c}`);
      if (!cell) continue;
      const tile = getTileAt(r, c);
      let cls = 'cell ' + tile;
      // Preserve blink
      if (cell.classList.contains('blink')) cls += ' blink';
      if (cell.classList.contains('collected')) cls += ' collected';
      cell.className = cls;
    }
  }
}

// =============================================
// CLICK HANDLING (core gameplay)
// =============================================
function handleTileClick(r, c) {
  if (!gameActive) return;

  const tile = getTileAt(r, c);

  if (tile === 'blue') {
    // ✅ Correct — collect the blue tile
    baseGrid[r][c] = 'dark';
    blueRemaining--;
    scoreValueEl.textContent = blueRemaining;

    const cell = document.getElementById(`cell-${r}-${c}`);
    if (cell) {
      cell.className = 'cell blue collected';
      setTimeout(() => {
        cell.className = 'cell dark';
      }, 400);
    }

    if (blueRemaining <= 0) {
      handleWin();
    }

  } else if (tile === 'red') {
    // ❌ Wrong — blink white/red, lose a life
    lives--;

    const cell = document.getElementById(`cell-${r}-${c}`);
    if (cell) {
      cell.classList.add('blink');
      setTimeout(() => cell.classList.remove('blink'), 1000);
    }

    updateHearts();
    if (lives <= 0) {
      handleLose('All lives lost!');
    }
  }
  // green & dark = nothing happens
}

// =============================================
// TIMER
// =============================================
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameActive) return;
    timeLeft--;
    timerValueEl.textContent = timeLeft;
    if (timeLeft <= 10) timerValueEl.classList.add('urgent');
    else timerValueEl.classList.remove('urgent');
    if (timeLeft <= 0) handleLose("Time's up!");
  }, 1000);
}

// =============================================
// HUD
// =============================================
function updateHUD() {
  timerValueEl.textContent = timeLeft;
  timerValueEl.classList.remove('urgent');
  scoreValueEl.textContent = blueRemaining;
  patternValueEl.textContent = currentPattern;
  resetHearts();
}

function resetHearts() {
  heartsEl.querySelectorAll('.heart').forEach(h => {
    h.classList.remove('lost', 'hit');
  });
}

function updateHearts() {
  heartsEl.querySelectorAll('.heart').forEach((h, i) => {
    if (i >= lives) {
      if (!h.classList.contains('lost')) {
        h.classList.add('hit');
        setTimeout(() => h.classList.remove('hit'), 500);
      }
      h.classList.add('lost');
    } else {
      h.classList.remove('lost');
    }
  });
}

// =============================================
// WIN / LOSE
// =============================================
function handleWin() {
  gameActive = false;
  clearInterval(timerInterval);
  clearInterval(moveInterval);

  if (currentPattern === 1 && !pattern1Completed) {
    pattern1Completed = true;
    showTransition();
  } else {
    showResult(true);
  }
}

function handleLose(reason) {
  gameActive = false;
  clearInterval(timerInterval);
  clearInterval(moveInterval);
  showResult(false, reason);
}

function showResult(isWin, reason) {
  resultModal.classList.remove('hidden');
  const collected = blueTotal - blueRemaining;

  if (isWin) {
    resultIcon.textContent = '🏆';
    resultTitle.textContent = 'You Win!';
    resultTitle.className = 'result-title win';
    resultMessage.textContent = currentPattern === 2
      ? 'Both patterns completed! Amazing!' : 'All blue tiles collected!';
    resultActionBtn.textContent = 'Play Again';
    resultActionBtn.onclick = goToSetup;
  } else {
    resultIcon.textContent = '💀';
    resultTitle.textContent = 'You Lose!';
    resultTitle.className = 'result-title lose';
    resultMessage.textContent = reason || 'Better luck next time!';
    resultActionBtn.textContent = 'Try Again';
    resultActionBtn.onclick = () => { resultModal.classList.add('hidden'); startGame(); };
  }

  resultStats.innerHTML = `
    <div class="result-stat"><div class="result-stat-val">${5 - lives}</div><div class="result-stat-label">Lives Lost</div></div>
    <div class="result-stat"><div class="result-stat-val">${30 - timeLeft}s</div><div class="result-stat-label">Time Used</div></div>
    <div class="result-stat"><div class="result-stat-val">${collected}/${blueTotal}</div><div class="result-stat-label">Collected</div></div>
  `;
  resultRestartBtn.onclick = goToSetup;
}

function goToSetup() {
  resultModal.classList.add('hidden');
  gameScreen.classList.add('hidden');
  setupScreen.classList.remove('hidden');
  clearInterval(timerInterval);
  clearInterval(moveInterval);
  currentPattern = 1;
  pattern1Completed = false;
}

function showTransition() {
  transitionOverlay.classList.remove('hidden');
  let count = 3;
  transitionCountdown.textContent = count;
  const ci = setInterval(() => {
    count--;
    if (count <= 0) {
      clearInterval(ci);
      transitionOverlay.classList.add('hidden');
      currentPattern = 2;
      startGame();
    } else {
      transitionCountdown.textContent = count;
    }
  }, 1000);
}

resultRestartBtn.addEventListener('click', goToSetup);
window.addEventListener('resize', fitGridToContainer);
