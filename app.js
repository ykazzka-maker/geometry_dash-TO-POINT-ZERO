const STORAGE_KEY = "neon_dash_save_v1";
const SAVE_DEFAULT = {
  coins: 0,
  selectedSkin: "default",
  ownedSkins: ["default"],
};

const skinCatalog = [
  { id: "default", name: "Default", color: "#6ef2ff", price: 0, owned: true },
  { id: "sunburst", name: "Sunburst", color: "#ffbf69", price: 120, owned: false },
  { id: "void", name: "Void Core", color: "#c38dff", price: 180, owned: false },
  { id: "ember", name: "Ember Pulse", color: "#ff6d8d", price: 220, owned: false },
  { id: "lime", name: "Lime Storm", color: "#7cff8c", price: 260, owned: false },
];

const levelCatalog = [
  { id: 1, name: "Warmup", difficulty: "Easy", reward: 15, distance: 1800, speed: 360 },
  { id: 2, name: "Pulse", difficulty: "Easy", reward: 18, distance: 2000, speed: 370 },
  { id: 3, name: "Rift", difficulty: "Normal", reward: 25, distance: 2250, speed: 390 },
  { id: 4, name: "Split", difficulty: "Normal", reward: 28, distance: 2400, speed: 410 },
  { id: 5, name: "Magma", difficulty: "Hard", reward: 35, distance: 2650, speed: 430 },
  { id: 6, name: "Torque", difficulty: "Hard", reward: 38, distance: 2850, speed: 450 },
  { id: 7, name: "Afterglow", difficulty: "Hard", reward: 40, distance: 3000, speed: 470 },
  { id: 8, name: "Nova", difficulty: "Insane", reward: 50, distance: 3250, speed: 490 },
  { id: 9, name: "Echo", difficulty: "Insane", reward: 55, distance: 3500, speed: 510 },
  { id: 10, name: "Viper", difficulty: "Insane", reward: 60, distance: 3650, speed: 530 },
  { id: 11, name: "Storm", difficulty: "Hell", reward: 75, distance: 3900, speed: 550 },
  { id: 12, name: "Blitz", difficulty: "Hell", reward: 78, distance: 4050, speed: 570 },
  { id: 13, name: "Crasher", difficulty: "Hell", reward: 85, distance: 4200, speed: 590 },
  { id: 14, name: "Gravity", difficulty: "Hell", reward: 95, distance: 4400, speed: 610 },
  { id: 15, name: "Zero", difficulty: "Hell", reward: 120, distance: 4700, speed: 640 },
];

const state = {
  save: loadSave(),
  levelIndex: null,
  currentLevel: null,
  player: {
    x: 130,
    y: 0,
    width: 36,
    height: 36,
    jumpVelocity: 0,
    gravity: 1450,
    rotation: 0,
    color: "#6ef2ff",
  },
  obstacles: [],
  lastTime: 0,
  animationFrame: null,
  running: false,
  worldX: 0,
  complete: false,
  settings: {
    volume: 72,
    graphics: 78,
  },
};

const elements = {
  menuScreen: document.getElementById("menuScreen"),
  levelScreen: document.getElementById("levelScreen"),
  gameScreen: document.getElementById("gameScreen"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  closeSettings: document.getElementById("closeSettings"),
  playBtn: document.getElementById("playBtn"),
  backToMenu: document.getElementById("backToMenu"),
  levelGrid: document.getElementById("levelGrid"),
  player: document.getElementById("player"),
  gameArea: document.getElementById("gameArea"),
  coinCount: document.getElementById("coinCount"),
  currentLevel: document.getElementById("currentLevel"),
  menuCoins: document.getElementById("menuCoins"),
  skinList: document.getElementById("skinList"),
  volumeSlider: document.getElementById("volumeSlider"),
  graphicsSlider: document.getElementById("graphicsSlider"),
  volumeValue: document.getElementById("volumeValue"),
  graphicsValue: document.getElementById("graphicsValue"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText"),
  resultTag: document.getElementById("resultTag"),
  overlayBtn: document.getElementById("overlayBtn"),
  gameOverlay: document.getElementById("gameOverlay"),
};

function loadSave() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { ...SAVE_DEFAULT };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      coins: Number(parsed.coins) || 0,
      selectedSkin: parsed.selectedSkin || "default",
      ownedSkins: Array.isArray(parsed.ownedSkins) && parsed.ownedSkins.length ? parsed.ownedSkins : ["default"],
    };
  } catch (error) {
    return { ...SAVE_DEFAULT };
  }
}

function saveGame() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save));
}

function loadSkins() {
  for (const skin of skinCatalog) {
    const currentOwned = state.save.ownedSkins.includes(skin.id);
    if (currentOwned) {
      skin.owned = true;
    }
  }

  if (!state.save.ownedSkins.includes(state.save.selectedSkin)) {
    state.save.selectedSkin = "default";
  }
}

function applySkinColor() {
  const selected = skinCatalog.find((skin) => skin.id === state.save.selectedSkin) || skinCatalog[0];
  state.player.color = selected.color;
  document.documentElement.style.setProperty("--player-color", selected.color);
}

function updateCoinDisplay() {
  elements.coinCount.textContent = state.save.coins;
  elements.menuCoins.textContent = state.save.coins;
}

function renderSkinList() {
  elements.skinList.innerHTML = "";

  skinCatalog.forEach((skin) => {
    const owned = state.save.ownedSkins.includes(skin.id);
    const isSelected = state.save.selectedSkin === skin.id;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `skin-card ${isSelected ? "active" : ""}`;

    const actionText = isSelected ? "Equip" : owned ? "Use" : `Buy ${skin.price}`;
    const actionClass = isSelected || owned ? "equip" : "buy";

    card.innerHTML = `
      <div class="skin-meta">
        <span class="skin-swatch" style="background: ${skin.color};"></span>
        <div class="skin-info">
          <strong>${skin.name}</strong>
          <span>${skin.id === "default" ? "Starter" : "Exclusive"}</span>
        </div>
      </div>
      <span class="skin-action ${actionClass}">${actionText}</span>
    `;

    card.addEventListener("click", () => handleSkinAction(skin.id));
    elements.skinList.appendChild(card);
  });
}

function handleSkinAction(skinId) {
  const skin = skinCatalog.find((entry) => entry.id === skinId);
  if (!skin) return;

  const owned = state.save.ownedSkins.includes(skinId);
  if (!owned) {
    if (state.save.coins < skin.price) {
      playTone(120, 0.17, "sawtooth", 0.08);
      return;
    }

    state.save.coins -= skin.price;
    state.save.ownedSkins.push(skinId);
    saveGame();
    updateCoinDisplay();
    playTone(520, 0.12, "triangle", 0.06);
  }

  state.save.selectedSkin = skinId;
  saveGame();
  renderSkinList();
  applySkinColor();
}

function renderLevelCards() {
  elements.levelGrid.innerHTML = "";

  levelCatalog.forEach((level) => {
    const card = document.createElement("button");
    card.type = "button";
    const levelClass = level.difficulty.toLowerCase().replace(" ", "");
    card.className = `level-card ${levelClass}`;
    card.innerHTML = `
      <div class="level-topline">
        <span class="level-badge">${level.difficulty}</span>
        <span class="reward">◉ ${level.reward}</span>
      </div>
      <h3>${level.name}</h3>
      <div class="level-footer">
        <span>Lv. ${level.id}</span>
        <span class="level-btn">Play</span>
      </div>
    `;

    card.addEventListener("click", () => startLevel(level.id));
    elements.levelGrid.appendChild(card);
  });
}

function setScreen(screenName) {
  const screens = {
    menu: "menuScreen",
    levels: "levelScreen",
    game: "gameScreen",
  };

  elements.menuScreen.classList.toggle("hidden", screenName !== "menu");
  elements.levelScreen.classList.toggle("hidden", screenName !== "levels");
  elements.gameScreen.classList.toggle("hidden", screenName !== "game");

  if (screenName === "game") {
    elements.gameOverlay.classList.add("hidden");
  }
}

function openSettings() {
  elements.settingsModal.classList.remove("hidden");
  elements.settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  elements.settingsModal.classList.add("hidden");
  elements.settingsModal.setAttribute("aria-hidden", "true");
}

function updateSettingsLabels() {
  elements.volumeValue.textContent = `${state.settings.volume}%`;
  elements.graphicsValue.textContent = `${state.settings.graphics}%`;
  const blurValue = 0.3 + (state.settings.graphics / 100) * 2.2;
  elements.gameArea.style.filter = `blur(${(100 - state.settings.graphics) / 200}px)`;
  const root = document.documentElement;
  root.style.setProperty("--effect-intensity", String(state.settings.graphics / 100));
  root.style.setProperty("--game-blur", `${blurValue}px`);
}

function playTone(frequency, duration = 0.12, type = "square", gainValue = 0.06) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = state.audioContext || new AudioContextClass();
  state.audioContext = audioContext;

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gainValue * (state.settings.volume / 100);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function generateLevelPattern(level) {
  const patterns = [
    { width: 48, height: 38 },
    { width: 86, height: 52 },
    { width: 64, height: 96 },
    { width: 110, height: 44 },
  ];

  const obstacles = [];
  let x = 780;

  const count = 9 + Math.min(8, Math.floor(level.id / 2));

  for (let i = 0; i < count; i += 1) {
    const template = patterns[i % patterns.length];
    const width = template.width + (i % 2) * 18 + Math.random() * 26;
    const height = template.height + ((i + 1) % 3) * 18 + Math.random() * 20;
    const y = 470 - height;
    x += 180 + Math.random() * 120;

    obstacles.push({
      x,
      y,
      width,
      height,
      color: i % 2 === 0 ? "#8d85ff" : "#ff7cc7",
    });
  }

  return obstacles;
}

function resetPlayer() {
  const groundY = 470;
  state.player.x = 130;
  state.player.y = groundY - state.player.height;
  state.player.jumpVelocity = 0;
  state.player.rotation = 0;
  state.player.width = 36;
  state.player.height = 36;
  elements.player.style.width = `${state.player.width}px`;
  elements.player.style.height = `${state.player.height}px`;
  elements.player.style.left = `${state.player.x}px`;
  elements.player.style.top = `${state.player.y}px`;
}

function startLevel(levelId) {
  const level = levelCatalog.find((item) => item.id === levelId);
  if (!level) return;

  state.levelIndex = level.id;
  state.currentLevel = level;
  state.running = true;
  state.complete = false;
  state.worldX = 0;
  state.obstacles = generateLevelPattern(level);
  state.lastTime = 0;

  elements.currentLevel.textContent = `Lv. ${level.id}`;
  elements.coinCount.textContent = state.save.coins;
  resetPlayer();
  setScreen("game");

  elements.gameOverlay.classList.add("hidden");
  renderObstacles();
  if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
  state.animationFrame = requestAnimationFrame(gameLoop);
}

function renderObstacles() {
  const existing = elements.gameArea.querySelectorAll(".obstacle");
  existing.forEach((obstacle) => obstacle.remove());

  state.obstacles.forEach((obstacle) => {
    const element = document.createElement("div");
    element.className = "obstacle";
    element.style.left = `${obstacle.x}px`;
    element.style.top = `${obstacle.y}px`;
    element.style.width = `${obstacle.width}px`;
    element.style.height = `${obstacle.height}px`;
    element.style.background = `linear-gradient(135deg, ${obstacle.color}, rgba(255,255,255,0.8))`;
    elements.gameArea.appendChild(element);
  });
}

function updateObstacles() {
  const obstacleElements = elements.gameArea.querySelectorAll(".obstacle");
  obstacleElements.forEach((obstacleEl, index) => {
    const obstacle = state.obstacles[index];
    if (!obstacle) return;
    obstacleEl.style.left = `${obstacle.x}px`;
    obstacleEl.style.top = `${obstacle.y}px`;
  });
}

function jump() {
  if (!state.running) return;
  if (state.player.y >= 470 - state.player.height - 1) {
    state.player.jumpVelocity = -560;
    playTone(360, 0.12, "triangle", 0.06);
  }
}

function detectCollision(player, obstacle) {
  const a = {
    x: player.x + 4,
    y: player.y + 4,
    w: player.width - 8,
    h: player.height - 8,
  };

  const b = {
    x: obstacle.x + 4,
    y: obstacle.y + 4,
    w: obstacle.width - 8,
    h: obstacle.height - 8,
  };

  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function finishLevel(success, message) {
  state.running = false;
  elements.gameOverlay.classList.remove("hidden");
  elements.resultTag.textContent = success ? "LEVEL COMPLETE" : "TRY AGAIN";
  elements.resultTitle.textContent = success ? "Perfect run" : "Crash";
  elements.resultText.textContent = message;
  elements.overlayBtn.textContent = success ? "Continue" : "Retry";

  if (success) {
    const reward = state.currentLevel.reward;
    state.save.coins += reward;
    updateCoinDisplay();
    saveGame();
    playTone(620, 0.12, "triangle", 0.06);
    playTone(780, 0.12, "triangle", 0.05);
    playTone(960, 0.22, "triangle", 0.045);
  } else {
    playTone(150, 0.2, "sawtooth", 0.08);
  }
}

function endCurrentRun() {
  if (state.running) {
    state.running = false;
    cancelAnimationFrame(state.animationFrame);
    elements.gameOverlay.classList.add("hidden");
  }
  setScreen("levels");
}

function gameLoop(time) {
  if (!state.running) return;

  const delta = state.lastTime ? (time - state.lastTime) / 1000 : 0.016;
  state.lastTime = time;

  const level = state.currentLevel;
  const groundY = 470;

  state.player.jumpVelocity += state.player.gravity * delta;
  state.player.y += state.player.jumpVelocity * delta;
  state.player.rotation += (Math.abs(state.player.jumpVelocity) * delta * 0.33) + 2;

  if (state.player.y >= groundY - state.player.height) {
    state.player.y = groundY - state.player.height;
    state.player.jumpVelocity = 0;
    state.player.rotation = 0;
  }

  state.worldX += level.speed * delta;

  state.obstacles.forEach((obstacle) => {
    obstacle.x -= level.speed * delta;
  });

  const visibleObstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -40);
  state.obstacles = visibleObstacles;

  if (state.worldX >= level.distance) {
    finishLevel(true, `You cleared ${level.name} and earned ${level.reward} coins.`);
    return;
  }

  const collided = state.obstacles.some((obstacle) => detectCollision(state.player, obstacle));
  if (collided) {
    finishLevel(false, `You crashed on ${level.name}. Try again and hit the rhythm.`);
    return;
  }

  elements.player.style.left = `${state.player.x}px`;
  elements.player.style.top = `${state.player.y}px`;
  elements.player.style.transform = `rotate(${state.player.rotation}deg)`;

  updateObstacles();
  state.animationFrame = requestAnimationFrame(gameLoop);
}

function initEventListeners() {
  elements.playBtn.addEventListener("click", () => setScreen("levels"));
  elements.backToMenu.addEventListener("click", () => {
    if (state.running) {
      cancelAnimationFrame(state.animationFrame);
      state.running = false;
    }
    setScreen("menu");
  });
  elements.settingsBtn.addEventListener("click", openSettings);
  elements.closeSettings.addEventListener("click", closeSettings);

  elements.overlayBtn.addEventListener("click", () => {
    const success = elements.resultTag.textContent === "LEVEL COMPLETE";
    if (success) {
      setScreen("levels");
    } else {
      startLevel(state.levelIndex);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (state.running) {
        jump();
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (state.running && event.target.closest("#gameArea")) {
      jump();
    }
  });

  elements.volumeSlider.addEventListener("input", (event) => {
    state.settings.volume = Number(event.target.value);
    updateSettingsLabels();
  });

  elements.graphicsSlider.addEventListener("input", (event) => {
    state.settings.graphics = Number(event.target.value);
    updateSettingsLabels();
  });

  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) {
      closeSettings();
    }
  });
}

function bootstrap() {
  loadSkins();
  applySkinColor();
  renderLevelCards();
  renderSkinList();
  updateCoinDisplay();
  updateSettingsLabels();
  setScreen("menu");
  initEventListeners();
}

bootstrap();
