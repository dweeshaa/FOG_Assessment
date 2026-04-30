/* ============================================
   FOG — Game Selection Interface — JS
   Card carousel with swipe + video playback
   ============================================ */

// --- Game Data (using actual FOG card assets) ---
const GAMES = [
  {
    id: 1,
    name: 'Escape The Lava',
    tag: 'ADVENTURE',
    players: '2-8 Players',
    desc: 'Survive the erupting volcano! Dodge lava flows and collect diamonds to win.',
    image: 'assets/cards/escape_the_lava.png',
    accent: '#ef6c00'
  },
  {
    id: 2,
    name: 'Red Light Green Light',
    tag: 'ACTION',
    players: '2-10 Players',
    desc: 'Freeze when the light turns red! Move fast on green — but don\'t get caught.',
    image: 'assets/cards/red_light_green_light.png',
    accent: '#e53935'
  },
  {
    id: 3,
    name: 'Find The Color',
    tag: 'ARCADE',
    players: '1-6 Players',
    desc: 'Race to find and match the right colors before time runs out!',
    image: 'assets/cards/find_the_color.png',
    accent: '#e040fb'
  },
  {
    id: 4,
    name: 'Sharp Shooter',
    tag: 'SHOOTER',
    players: '2-4 Players',
    desc: 'Suit up and take aim in this futuristic laser combat arena.',
    image: 'assets/cards/sharp_shooter.png',
    accent: '#1e88e5'
  },
];

let currentIndex = 0;
let isDragging = false;
let dragStartX = 0;
let dragDelta = 0;
let wasDragging = false;

// --- DOM ---
const track = document.getElementById('carouselTrack');
const carouselContainer = document.getElementById('carouselContainer');
const dotsContainer = document.getElementById('carouselDots');
const prevBtn = document.getElementById('navPrev');
const nextBtn = document.getElementById('navNext');
const gameTitle = document.getElementById('gameTitle');
const gameDesc = document.getElementById('gameDesc');
const gameTag = document.getElementById('gameTag');
const playBtn = document.getElementById('playBtn');
const infoPanel = document.getElementById('gameInfoPanel');
const videoModal = document.getElementById('videoModal');
const videoCanvas = document.getElementById('videoCanvas');
const videoGameName = document.getElementById('videoGameName');
const videoCloseBtn = document.getElementById('videoCloseBtn');
const videoBackdrop = document.getElementById('videoModalBackdrop');
const videoProgressFill = document.getElementById('videoProgressFill');
const videoTimeEl = document.getElementById('videoTime');
const videoPauseBtn = document.getElementById('videoPauseBtn');
const bgParticles = document.getElementById('bgParticles');

// --- Create Cards (using actual image assets) ---
function createCards() {
  track.innerHTML = '';
  GAMES.forEach((game, i) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="card-inner">
        <img class="card-image" src="${game.image}" alt="${game.name}" loading="eager" />
        <div class="card-gradient"></div>
        <div class="card-content">
          <span class="card-tag">${game.tag}</span>
          <div class="card-name">${game.name}</div>
          <div class="card-players">${game.players}</div>
        </div>
        <button class="card-play-icon" aria-label="Play ${game.name}">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
    `;
    const playIcon = card.querySelector('.card-play-icon');
    playIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (i !== currentIndex) goTo(i);
      // Keep triangle behavior identical to "Play Now"
      openVideo(GAMES[i]);
    });
    card.addEventListener('click', () => handleCardClick(i));
    track.appendChild(card);
  });
}

// --- Create Dots ---
function createDots() {
  dotsContainer.innerHTML = '';
  GAMES.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === currentIndex ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });
}

// --- Position Cards ---
const CARD_GAP = 240; // spacing between card centers

function positionCards(dragOffset = 0) {
  const cards = track.querySelectorAll('.game-card');
  cards.forEach((card, i) => {
    const offset = i - currentIndex;
    const absOffset = Math.abs(offset);

    // Calculate the fractional offset from drag
    const fractionalShift = dragOffset / CARD_GAP;
    const effectiveOffset = offset + fractionalShift * -1;
    const absEffective = Math.abs(effectiveOffset);

    let scale = 1 - absEffective * 0.13;
    let z = -absEffective * 60;
    let opacity = 1 - absEffective * 0.28;
    let rotateY = effectiveOffset * -4;

    if (absEffective > 3) { opacity = 0; scale = 0.5; }
    scale = Math.max(scale, 0.5);
    opacity = Math.max(opacity, 0);

    // Cards follow the drag 1:1
    const translateX = offset * CARD_GAP + dragOffset;

    card.style.transform = `translateX(${translateX}px) translateZ(${z}px) scale(${scale}) rotateY(${rotateY}deg)`;
    card.style.opacity = opacity;
    card.style.zIndex = 100 - Math.round(absEffective * 10);

    // Active class for styling
    if (absEffective < 0.5) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// --- Update Info ---
function updateInfo() {
  const game = GAMES[currentIndex];
  const panel = document.getElementById('gameInfoPanel');

  // Re-trigger animation
  const content = panel.querySelector('.game-info-content');
  content.style.animation = 'none';
  content.offsetHeight; // trigger reflow
  content.style.animation = '';

  gameTag.textContent = game.tag;
  gameTag.style.background = game.accent || '';
  gameTitle.textContent = game.name;
  gameDesc.textContent = game.desc;
}

// --- Go to card ---
function goTo(index) {
  currentIndex = Math.max(0, Math.min(GAMES.length - 1, index));
  positionCards();
  updateInfo();
  updateDots();
}

function updateDots() {
  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
}

// --- Card Click ---
function handleCardClick(index) {
  if (wasDragging) {
    wasDragging = false;
    return;
  }
  if (index !== currentIndex) goTo(index);
  openVideo(GAMES[index]);
}

// Fallback delegated click handling so card/triangle always works
track.addEventListener('click', (e) => {
  const card = e.target.closest('.game-card');
  if (!card) return;
  const index = Number(card.dataset.index);
  if (Number.isNaN(index)) return;
  if (isDragging || animatingSnap) return;
  if (index !== currentIndex) goTo(index);
  openVideo(GAMES[index]);
});

// --- Navigation ---
prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

// Keyboard
document.addEventListener('keydown', (e) => {
  if (videoModal.classList.contains('open')) {
    if (e.key === 'Escape') closeVideo();
    return;
  }
  if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
  if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  if (e.key === 'Enter') openVideo(GAMES[currentIndex]);
});

// --- Mobile-Style Swipe/Drag System ---
// Tracks velocity for flick gestures and provides smooth card-following
let lastPointerX = 0;
let lastPointerTime = 0;
let velocity = 0;
let animatingSnap = false;

function onPointerDown(e) {
  if (e.target.closest('.card-play-icon')) return;
  // Stop any ongoing snap animation
  animatingSnap = false;

  isDragging = true;
  wasDragging = false;
  dragStartX = e.clientX;
  lastPointerX = e.clientX;
  lastPointerTime = Date.now();
  dragDelta = 0;
  velocity = 0;

  // Disable CSS transitions during drag for instant response
  track.querySelectorAll('.game-card').forEach(c => {
    c.style.transition = 'none';
  });

  track.setPointerCapture(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e) {
  if (!isDragging) return;

  const now = Date.now();
  const dt = now - lastPointerTime;

  dragDelta = e.clientX - dragStartX;

  // Track velocity (pixels per millisecond)
  if (dt > 0) {
    const instantVelocity = (e.clientX - lastPointerX) / dt;
    velocity = velocity * 0.6 + instantVelocity * 0.4; // smoothed
  }

  lastPointerX = e.clientX;
  lastPointerTime = now;

  // Mark as dragging if moved more than 5px (to distinguish from clicks)
  if (Math.abs(dragDelta) > 5) wasDragging = true;

  // Cards follow the finger/mouse in real-time
  positionCards(dragDelta);
}

function onPointerUp() {
  if (!isDragging) return;
  isDragging = false;

  // Re-enable CSS transitions for smooth snap
  track.querySelectorAll('.game-card').forEach(c => {
    c.style.transition = '';
  });

  // Determine navigation based on distance OR velocity (flick gesture)
  const distanceThreshold = 40;  // px — how far you need to drag
  const velocityThreshold = 0.3; // px/ms — how fast you need to flick

  let targetIndex = currentIndex;

  if (dragDelta < -distanceThreshold || velocity < -velocityThreshold) {
    // Swiped left → go next
    targetIndex = Math.min(GAMES.length - 1, currentIndex + 1);
  } else if (dragDelta > distanceThreshold || velocity > velocityThreshold) {
    // Swiped right → go prev
    targetIndex = Math.max(0, currentIndex - 1);
  }

  // Animate snap to target
  animateSnapTo(targetIndex, dragDelta);
  dragDelta = 0;
  velocity = 0;
}

track.addEventListener('pointerdown', onPointerDown, { passive: false });
track.addEventListener('pointermove', onPointerMove);
track.addEventListener('pointerup', onPointerUp);
track.addEventListener('pointerleave', onPointerUp);

carouselContainer.addEventListener('wheel', (e) => {
  if (Math.abs(e.deltaX) < 10 && Math.abs(e.deltaY) < 10) return;
  e.preventDefault();
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    if (e.deltaX > 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  } else {
    if (e.deltaY > 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  }
}, { passive: false });

track.addEventListener('pointercancel', () => {
  isDragging = false;
  track.querySelectorAll('.game-card').forEach(c => {
    c.style.transition = '';
  });
  goTo(currentIndex);
});

// Prevent default touch behavior so swipe works smoothly on mobile
track.addEventListener('touchstart', (e) => {
  // Allow vertical scroll, prevent horizontal default
  // The pointerdown handler already manages the swipe
}, { passive: true });

// --- Smooth Snap Animation ---
// Animates from the current drag offset to the target card position
function animateSnapTo(targetIndex, fromOffset) {
  animatingSnap = true;
  currentIndex = targetIndex;
  updateDots();
  updateInfo();

  const startTime = performance.now();
  const duration = 300; // ms
  const startOffset = fromOffset;

  function tick(now) {
    if (!animatingSnap) return;

    let progress = (now - startTime) / duration;
    if (progress >= 1) {
      progress = 1;
      animatingSnap = false;
    }

    // Ease-out cubic for natural deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentOffset = startOffset * (1 - eased);

    positionCards(currentOffset);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

// --- Video Modal ---
let videoAnimFrame = null;
let videoStartTime = 0;
let videoPaused = false;
const VIDEO_DURATION = 30; // seconds

function openVideo(game) {
  videoModal.classList.add('open');
  videoGameName.textContent = game.name;
  videoPaused = false;
  videoStartTime = performance.now();
  videoProgressFill.style.width = '0%';
  updatePauseIcon();
  renderVideoFrame(game);
  document.body.style.overflow = 'hidden';
}

function closeVideo() {
  videoModal.classList.remove('open');
  if (videoAnimFrame) cancelAnimationFrame(videoAnimFrame);
  videoAnimFrame = null;
  document.body.style.overflow = '';
}

function renderVideoFrame(game) {
  const ctx = videoCanvas.getContext('2d');
  const w = videoCanvas.width;
  const h = videoCanvas.height;

  // Load the card image to use in the video
  const cardImg = new Image();
  cardImg.src = game.image;

  let pauseOffset = 0;
  let lastElapsed = 0;

  function draw(timestamp) {
    if (videoPaused) {
      pauseOffset += timestamp - (videoStartTime + lastElapsed * 1000 + pauseOffset);
      videoAnimFrame = requestAnimationFrame(draw);
      return;
    }

    const elapsed = (timestamp - videoStartTime - pauseOffset) / 1000;
    lastElapsed = elapsed;
    if (elapsed > VIDEO_DURATION) return;

    const t = elapsed / VIDEO_DURATION;

    // Parse accent color for theming
    const accent = game.accent || '#7c3aed';

    // Animated gradient background
    const hue1 = (elapsed * 15) % 360;
    const hue2 = (hue1 + 45) % 360;
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `hsl(${hue1}, 50%, 8%)`);
    grad.addColorStop(0.5, `hsl(${hue2}, 40%, 12%)`);
    grad.addColorStop(1, `hsl(${(hue1 + 90) % 360}, 50%, 6%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Animated grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const scrollOffset = elapsed * 20;
    for (let x = -gridSize + (scrollOffset % gridSize); x < w + gridSize; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = -gridSize + (scrollOffset * 0.3 % gridSize); y < h + gridSize; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Floating orbs matching game accent
    for (let i = 0; i < 6; i++) {
      const ox = w * 0.5 + Math.sin(elapsed * 0.4 + i * 1.1) * w * 0.35;
      const oy = h * 0.5 + Math.cos(elapsed * 0.6 + i * 1.5) * h * 0.3;
      const r = 40 + Math.sin(elapsed * 0.8 + i) * 20;
      const orbGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
      orbGrad.addColorStop(0, accent + '44');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
    }

    // Draw card image in center (with bobbing animation)
    if (cardImg.complete && cardImg.naturalWidth > 0) {
      const imgW = 480;
      const imgH = imgW * (cardImg.naturalHeight / cardImg.naturalWidth);
      const imgX = (w - imgW) / 2;
      const imgY = (h - imgH) / 2 + Math.sin(elapsed * 1.5) * 8 - 30;

      ctx.save();
      // Glow behind card
      ctx.shadowColor = accent;
      ctx.shadowBlur = 40;
      ctx.drawImage(cardImg, imgX, imgY, imgW, imgH);
      ctx.restore();
    }

    // Game name overlay
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.name, w / 2, h - 80);

    // "Gameplay Preview" subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillText('Gameplay Preview — ' + game.tag, w / 2, h - 50);

    // Progress bar & time
    videoProgressFill.style.width = (t * 100) + '%';
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    videoTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')} / 0:30`;

    if (elapsed < VIDEO_DURATION) {
      videoAnimFrame = requestAnimationFrame(draw);
    }
  }

  if (videoAnimFrame) cancelAnimationFrame(videoAnimFrame);
  videoAnimFrame = requestAnimationFrame(draw);
}

function updatePauseIcon() {
  videoPauseBtn.innerHTML = videoPaused
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
}

videoCloseBtn.addEventListener('click', closeVideo);
videoBackdrop.addEventListener('click', closeVideo);
videoPauseBtn.addEventListener('click', () => {
  videoPaused = !videoPaused;
  updatePauseIcon();
});

playBtn.addEventListener('click', () => openVideo(GAMES[currentIndex]));

// --- Particles ---
function createParticles() {
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    const colors = ['#7c3aed', '#22d3ee', '#ec4899', '#a78bfa'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    bgParticles.appendChild(p);
  }
}

// --- Init ---
function init() {
  createCards();
  createDots();
  positionCards();
  updateInfo();
  createParticles();
}

init();
