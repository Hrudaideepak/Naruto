// Web Audio Context setup
let audioCtx = null;

// Audio sources references
let activeAudioSources = {
    rasengan: null,
    fire: null,
    chidoriInterval: null
};

// Particles collection
let particles = [];
const MAX_PARTICLES = 120; // Hard limit to prevent rendering lag

// Screen flash/glow triggers
const flashScreen = document.getElementById('flash-screen');
const fireGlow = document.getElementById('fire-glow');
const lightningFlash = document.getElementById('lightning-flash');

// UI Elements
const statusOverlay = document.getElementById('status-overlay');
const chakraMeterFill = document.querySelector('.chakra-meter-fill');
const speedVal = document.getElementById('speed-val');
const levelVal = document.getElementById('level-val');
const activeJutsuVal = document.getElementById('active-jutsu-val');
const logConsole = document.getElementById('log-console');
const galleryGrid = document.getElementById('gallery-grid');


const comboHud = document.getElementById('combo-hud');
const comboSteps = document.getElementById('combo-steps');

// Exhaustion elements
const exhaustionOverlay = document.getElementById('exhaustion-overlay');
const gatheredSparksCount = document.getElementById('gathered-sparks-count');
const chakraMeterBox = document.getElementById('chakra-meter-box');

// XP & Profile Elements
const lockedNameBadge = document.getElementById('locked-name-badge');
const lockedNatureBadge = document.getElementById('locked-nature-badge');
const rankBadge = document.getElementById('rank-badge');
const xpValEl = document.getElementById('xp-val');
const xpBarFill = document.getElementById('xp-bar-fill');
const costBadge = document.getElementById('cost-badge');

// Library search elements
const libSearch = document.getElementById('lib-search');
const libResults = document.getElementById('lib-results');
const libDetails = document.getElementById('lib-details');
const libDetailsName = document.getElementById('lib-details-name');
const libDetailsType = document.getElementById('lib-details-type');
const libDetailsDesc = document.getElementById('lib-details-desc');

// Virtual Cursor DOM cache
const virtualCursor = document.getElementById('virtual-cursor');
const virtualCursorProgress = document.getElementById('virtual-cursor-progress');

// Game States
let shinobiXP = 0;
let nextRankXP = 50;
let shinobiRank = 1; // 1: Academy Student, 2: Genin, 3: Chunin, 4: Jonin, 5: Kage
let currentChakraCost = 35; // default 35% cost

let chakraLevel = 100;
let handVelocity = 0;
let lastWristPos = { x: 0.5, y: 0.5 };
let lastFrameTime = performance.now();

let isExhausted = false;
let sparks = [];
let gatheredSparks = 0;
let isVideoMirrored = false; // default false to correct user's camera handedness, togglable via button

// Virtual Pinch & Scroll Cursor States
let currentHoveredElement = null;
let wasPinching = false;
let lastReleaseTime = 0;
let isScrollMode = false;
let lastScrollHandY = 0;
let singleTapTimeout = null;

// Audio Blow Detector States
let isBlowing = false;
let audioContext = null;
let audioAnalyser = null;


let activeJutsu = 'NONE';
let jutsuHoldFrames = 0;
let cloneData = null;

// Combo Engine States
const JUTSU_COMBOS = {
    'RASENGAN': ['RASENGAN', 'SHADOW_CLONE', 'RASENGAN'],
    'CHIDORI': ['CHIDORI', 'FIREBALL', 'CHIDORI'],
    'FIREBALL': ['FIREBALL', 'CHIDORI', 'FIREBALL'],
    'SHADOW_CLONE': ['SHADOW_CLONE', 'RASENGAN', 'SHADOW_CLONE']
};
const GESTURE_EMOJIS = {
    'RASENGAN': '🤙',
    'CHIDORI': '🤘',
    'FIREBALL': '🖐️',
    'SHADOW_CLONE': '✌️'
};
let activeComboJutsu = 'NONE';
let activeComboProgress = 0; // 0 to 3
let comboStartTime = 0;
let lastComboStepTime = 0;
let comboSyncScore = 100;
let lastDetectedSeal = 'NONE';
let sealStableFrames = 0;
let incorrectSealFrames = 0;
let isComboSupercharged = false;
const COMBO_WINDOW_MS = 5000; // 5.0 seconds to complete

let currentAffinity = 'wind'; // wind, lightning, fire, shadow
let lockedJutsu = 'RASENGAN'; // mapped based on affinity
let lockedName = 'Naruto';
let lastKnownHandPos = { x: 0.5, y: 0.5 };
let allJutsus = []; // Complete database of 2,900+ Jutsus from jutsus.json

// Progression & Equipped Jutsus Cycle
const AFFINITY_CYCLE = ['wind', 'lightning', 'shadow', 'fire'];
const ZODIAC_SEALS = ['Rat 🐀', 'Ox 🐂', 'Tiger 🐯', 'Hare 🐇', 'Dragon 🐉', 'Snake 🐍', 'Horse 🐎', 'Ram 🐑', 'Monkey 🐒', 'Bird 🐦', 'Dog 🐶', 'Boar 🐗'];

let equippedJutsuDisplayNames = {
    wind: 'RASENGAN',
    lightning: 'CHIDORI',
    fire: 'FIREBALL',
    shadow: 'SHADOW_CLONE'
};

// MediaPipe variables
let handsDetector = null;
let faceDetector = null;
let cameraManager = null;
let isCameraRunning = false;

// Jutsu Tutor and Hand Calibration Guide States
let trainingTargetJutsu = 'RASENGAN';
let castMode = 'instant'; // 'combo' (requires 3-step sequence) or 'instant' (instant trigger on single seal)

const GESTURE_TEMPLATES = {
    'FIREBALL': [
        {x: 0.0, y: 0.25},
        {x: -0.15, y: 0.12}, {x: -0.24, y: 0.04}, {x: -0.30, y: -0.02}, {x: -0.36, y: -0.08}, // thumb
        {x: -0.14, y: -0.02}, {x: -0.17, y: -0.16}, {x: -0.19, y: -0.28}, {x: -0.21, y: -0.40}, // index
        {x: -0.02, y: -0.04}, {x: -0.03, y: -0.20}, {x: -0.04, y: -0.32}, {x: -0.05, y: -0.44}, // middle
        {x: 0.09, y: -0.02}, {x: 0.10, y: -0.16}, {x: 0.11, y: -0.28}, {x: 0.12, y: -0.40}, // ring
        {x: 0.20, y: 0.03}, {x: 0.24, y: -0.10}, {x: 0.27, y: -0.20}, {x: 0.30, y: -0.30}  // pinky
    ],
    'SHADOW_CLONE': [
        {x: 0.0, y: 0.25},
        {x: -0.08, y: 0.12}, {x: -0.12, y: 0.08}, {x: -0.10, y: 0.04}, {x: -0.06, y: 0.06}, // thumb curled
        {x: -0.12, y: -0.02}, {x: -0.15, y: -0.16}, {x: -0.17, y: -0.28}, {x: -0.19, y: -0.40}, // index extended
        {x: -0.02, y: -0.04}, {x: -0.03, y: -0.20}, {x: -0.04, y: -0.32}, {x: -0.05, y: -0.44}, // middle extended
        {x: 0.08, y: 0.04}, {x: 0.10, y: 0.10}, {x: 0.07, y: 0.14}, {x: 0.04, y: 0.12}, // ring curled
        {x: 0.16, y: 0.08}, {x: 0.18, y: 0.14}, {x: 0.14, y: 0.18}, {x: 0.10, y: 0.16}  // pinky curled
    ],
    'CHIDORI': [
        {x: 0.0, y: 0.25},
        {x: -0.08, y: 0.12}, {x: -0.12, y: 0.08}, {x: -0.10, y: 0.04}, {x: -0.06, y: 0.06}, // thumb curled
        {x: -0.12, y: -0.02}, {x: -0.15, y: -0.16}, {x: -0.17, y: -0.28}, {x: -0.19, y: -0.40}, // index extended
        {x: -0.02, y: 0.04}, {x: -0.03, y: 0.10}, {x: -0.01, y: 0.14}, {x: 0.02, y: 0.12}, // middle curled
        {x: 0.08, y: 0.04}, {x: 0.10, y: 0.10}, {x: 0.07, y: 0.14}, {x: 0.04, y: 0.12}, // ring curled
        {x: 0.16, y: 0.06}, {x: 0.20, y: -0.08}, {x: 0.23, y: -0.18}, {x: 0.26, y: -0.28}  // pinky extended
    ],
    'RASENGAN': [
        {x: 0.0, y: 0.25},
        {x: -0.10, y: 0.12}, {x: -0.18, y: 0.08}, {x: -0.25, y: 0.04}, {x: -0.32, y: 0.02}, // thumb extended
        {x: -0.10, y: 0.04}, {x: -0.12, y: 0.10}, {x: -0.09, y: 0.14}, {x: -0.06, y: 0.12}, // index curled
        {x: -0.02, y: 0.04}, {x: -0.03, y: 0.10}, {x: -0.01, y: 0.14}, {x: 0.02, y: 0.12}, // middle curled
        {x: 0.06, y: 0.04}, {x: 0.08, y: 0.10}, {x: 0.05, y: 0.14}, {x: 0.02, y: 0.12}, // ring curled
        {x: 0.14, y: 0.06}, {x: 0.19, y: -0.04}, {x: 0.22, y: -0.12}, {x: 0.25, y: -0.22}  // pinky extended
    ]
};


// Face Tracking & Visual Target Lock States
let latestFaceResults = null;
let physicalMouthPos = null; // {x, y} relative coordinates
let targetLockPos = { x: 0.5, y: 0.5 }; // target coordinates in canvas space
let faceDetected = false;

// DOM Cache and Rendering states
let canvasElement = null;
let canvasCtx = null;
let videoElement = null;
let lastRenderedVelocity = -1;
let lastRenderedChakra = -1;
let latestResults = null;
let isDrawLoopRunning = false;

// Audio Synthesizer Functions
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function createNoiseBuffer(duration = 1.0) {
    if (!audioCtx) return null;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

function playPoofSound() {
    if (!audioCtx) return;
    const noise = audioCtx.createBufferSource();
    const buffer = createNoiseBuffer(0.45);
    if (!buffer) return;
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.45);
    filter.Q.setValueAtTime(3.5, audioCtx.currentTime);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
}

function startRasenganSound() {
    if (!audioCtx || activeAudioSources.rasengan) return;
    
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, audioCtx.currentTime);
    
    // LFO for core rotation hum
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 18;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    // High wind whistle
    const whistle = audioCtx.createOscillator();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1000, audioCtx.currentTime);
    
    const whistleLfo = audioCtx.createOscillator();
    whistleLfo.frequency.value = 24;
    const whistleLfoGain = audioCtx.createGain();
    whistleLfoGain.gain.value = 250;
    whistleLfo.connect(whistleLfoGain);
    whistleLfoGain.connect(whistle.frequency);
    
    // Air friction noise
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer(3.0);
    if (noise.buffer) noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 750;
    filter.Q.value = 4;
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.5);
    
    osc.connect(gain);
    whistle.connect(gain);
    if (noise.buffer) {
        noise.connect(filter);
        filter.connect(gain);
    }
    gain.connect(audioCtx.destination);
    
    osc.start();
    lfo.start();
    whistle.start();
    whistleLfo.start();
    if (noise.buffer) noise.start();
    
    activeAudioSources.rasengan = {
        osc: osc,
        gain: gain,
        stop: () => {
            try { osc.stop(); } catch(e){}
            try { lfo.stop(); } catch(e){}
            try { whistle.stop(); } catch(e){}
            try { whistleLfo.stop(); } catch(e){}
            try { noise.stop(); } catch(e){}
        }
    };
}

function updateRasenganSound(level) {
    if (!activeAudioSources.rasengan) return;
    const targetFreq = 90 + level * 130;
    activeAudioSources.rasengan.osc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
}

function stopRasenganSound() {
    const src = activeAudioSources.rasengan;
    if (src) {
        src.gain.gain.setValueAtTime(src.gain.gain.value, audioCtx.currentTime);
        src.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        setTimeout(() => { src.stop(); }, 300);
        activeAudioSources.rasengan = null;
    }
}

function startChidoriSound() {
    if (!audioCtx || activeAudioSources.chidoriInterval) return;
    
    activeAudioSources.chidoriInterval = setInterval(() => {
        const osc = audioCtx.createOscillator();
        osc.type = Math.random() > 0.4 ? 'square' : 'sawtooth';
        
        const baseFreq = 900 + Math.random() * 2200;
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.07);
        
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
    }, 45);
}

function stopChidoriSound() {
    if (activeAudioSources.chidoriInterval) {
        clearInterval(activeAudioSources.chidoriInterval);
        activeAudioSources.chidoriInterval = null;
    }
}

function startFireSound() {
    if (!audioCtx || activeAudioSources.fire) return;
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = createNoiseBuffer(4.0);
    if (!noise.buffer) return;
    noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, audioCtx.currentTime);
    
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 90;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, audioCtx.currentTime + 0.4);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
    lfo.start();
    
    activeAudioSources.fire = {
        gain: gain,
        stop: () => {
            try { noise.stop(); } catch(e){}
            try { lfo.stop(); } catch(e){}
        }
    };
}

function stopFireSound() {
    const src = activeAudioSources.fire;
    if (src) {
        src.gain.gain.setValueAtTime(src.gain.gain.value, audioCtx.currentTime);
        src.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        setTimeout(() => { src.stop(); }, 400);
        activeAudioSources.fire = null;
    }
}

function playSparkSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550 + Math.random() * 350, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.14);
}

function playLevelUpSound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
    });
}

function playVictorySound() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const freqs = [329.63, 415.30, 493.88, 659.25];
    freqs.forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq * 1.4, now + 0.45);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(now + 0.45);
    });
}

// ==========================================
// TEMPORAL COMBO ENGINE HELPER FUNCTIONS
// ==========================================

function resetCombo() {
    activeComboJutsu = 'NONE';
    activeComboProgress = 0;
    comboSyncScore = 100;
    incorrectSealFrames = 0;
    isComboSupercharged = false;
    updateComboHUD('NONE', 0);
}

function updateComboHUD(jutsuName, progress) {
    if (!comboHud || !comboSteps) return;
    
    if (jutsuName === 'NONE' || progress === 0) {
        comboHud.classList.remove('active');
        return;
    }
    
    const affinity = getJutsuAffinity(jutsuName);
    comboHud.style.setProperty('--combo-color', `var(--chakra-${affinity})`);
    comboHud.style.setProperty('--combo-glow', `var(--chakra-${affinity}-glow)`);
    comboHud.classList.add('active');
    
    const sequence = JUTSU_COMBOS[jutsuName];
    const displayName = equippedJutsuDisplayNames[affinity] || jutsuName;
    
    let html = `<span class="combo-label">${displayName}</span>`;
    
    for (let i = 0; i < 3; i++) {
        const sealName = sequence[i];
        const emoji = GESTURE_EMOJIS[sealName] || '❓';
        let statusClass = '';
        if (i < progress) {
            statusClass = 'completed';
        } else if (i === progress) {
            statusClass = 'active';
        }
        
        html += `<div class="combo-step-circle ${statusClass}" title="${sealName}">${emoji}</div>`;
        if (i < 2) {
            const connectorActive = (i < progress - 1) ? 'active' : '';
            html += `<div class="combo-connector ${connectorActive}"></div>`;
        }
    }
    
    html += `<span class="combo-sync-rate">SYNC: ${Math.round(comboSyncScore)}%</span>`;
    
    // Add timer container
    html += `<div style="width: 60px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; position: relative; overflow: hidden; margin-left: 10px; border: 1px solid rgba(255,255,255,0.05); display: inline-block;">
                <div id="combo-timer-fill" style="height: 100%; width: 100%; background: var(--combo-color); box-shadow: 0 0 5px var(--combo-glow); transition: width 0.05s linear;"></div>
             </div>`;
             
    comboSteps.innerHTML = html;
}

function playComboStepSound(step, jutsuName) {
    if (!audioCtx) return;
    initAudio();
    
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    const affinity = getJutsuAffinity(jutsuName);
    
    // Procedural synthesis based on elemental affinity
    if (affinity === 'wind') {
        osc.type = 'sine';
    } else if (affinity === 'lightning') {
        osc.type = 'sawtooth';
    } else if (affinity === 'fire') {
        osc.type = 'triangle';
    } else {
        osc.type = 'square';
    }
    
    let startFreq = 220;
    let endFreq = 440;
    let duration = 0.25;
    
    if (step === 1) {
        startFreq = 220;
        endFreq = 330;
    } else if (step === 2) {
        startFreq = 330;
        endFreq = 495;
    } else if (step === 3) {
        startFreq = 495;
        endFreq = 880;
        duration = 0.4;
    }
    
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    const filter = audioCtx.createBiquadFilter();
    if (affinity === 'wind') {
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(10, now);
        filter.frequency.setValueAtTime(startFreq * 2, now);
        filter.frequency.exponentialRampToValueAtTime(endFreq * 2, now + duration);
    } else if (affinity === 'lightning') {
        filter.type = 'peaking';
        filter.Q.setValueAtTime(5, now);
        filter.frequency.setValueAtTime(2000, now);
    } else if (affinity === 'fire') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
    } else {
        filter.type = 'allpass';
    }
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(now + duration);
}

function emitComboStepParticles(x, y, jutsuName, stepNumber) {
    const affinity = getJutsuAffinity(jutsuName);
    const count = 15 + stepNumber * 10;
    
    let colors = [];
    let particleType = 'aura';
    
    if (affinity === 'wind') {
        colors = ['#ffcc00', '#ffffff', '#ffeebb'];
        particleType = 'rasengan';
    } else if (affinity === 'lightning') {
        colors = ['#00d2ff', '#ffffff', '#aaeedd'];
        particleType = 'lightning';
    } else if (affinity === 'fire') {
        colors = ['#ff3333', '#ffaa00', '#ff5500'];
        particleType = 'fire';
    } else if (affinity === 'shadow') {
        colors = ['#b500ff', '#8800cc', '#ffffff'];
        particleType = 'smoke';
    }
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = 3 + Math.random() * 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particles.push(new Particle(x, y, particleType, color, size, vx, vy, 20 + Math.random() * 20));
    }
    limitParticles();
}

function triggerScreenShake() {
    const workspace = document.querySelector('.canvas-workspace');
    if (workspace) {
        workspace.classList.add('shake-canvas');
        setTimeout(() => {
            workspace.classList.remove('shake-canvas');
        }, 400);
    }
}

// Log Jutsu Events to Console
function addLogEntry(text, isJutsu = false) {
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (isJutsu ? ' jutsu-cast' : '');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerText = `[${timeStr}] ${text}`;
    logConsole.appendChild(entry);
    logConsole.scrollTop = logConsole.scrollHeight;
    
    while (logConsole.childNodes.length > 50) {
        logConsole.removeChild(logConsole.firstChild);
    }
}

// Color Utility Map
const THEMES = {
    wind: { color: '#ffaa00', glow: 'rgba(255,170,0,0.45)' },
    lightning: { color: '#00d2ff', glow: 'rgba(0,210,255,0.45)' },
    fire: { color: '#ff3333', glow: 'rgba(255,51,51,0.45)' },
    shadow: { color: '#b500ff', glow: 'rgba(181,0,255,0.45)' }
};

const RANK_NAMES = {
    1: "ACADEMY STUDENT",
    2: "GENIN",
    3: "CHUNIN",
    4: "JONIN",
    5: "KAGE (INFINITE)"
};

const CHAKRA_COSTS = {
    1: 35,
    2: 25,
    3: 15,
    4: 8,
    5: 0
};

const RANK_LIMITS = {
    1: 50,
    2: 100,
    3: 180,
    4: 300,
    5: Infinity
};

function selectAffinity(affinityName) {
    if (!THEMES[affinityName]) return;
    currentAffinity = affinityName;
    const theme = THEMES[affinityName];
    
    // Set custom CSS variables
    document.documentElement.style.setProperty('--active-chakra', theme.color);
    document.documentElement.style.setProperty('--active-glow', theme.glow);
    
    // Set matching Jutsu
    if (currentAffinity === 'wind') lockedJutsu = 'RASENGAN';
    else if (currentAffinity === 'lightning') lockedJutsu = 'CHIDORI';
    else if (currentAffinity === 'fire') lockedJutsu = 'FIREBALL';
    else if (currentAffinity === 'shadow') lockedJutsu = 'SHADOW_CLONE';
    
    trainingTargetJutsu = lockedJutsu;
    updateScrollLocks();
}

// Helper to determine element affinity for standard Jutsus
function getJutsuAffinity(jutsuName) {
    const name = jutsuName.toUpperCase();
    if (name === 'RASENGAN' || name.includes('RASENGAN')) return 'wind';
    if (name === 'CHIDORI' || name.includes('CHIDORI')) return 'lightning';
    if (name === 'FIREBALL' || name.includes('FIREBALL')) return 'fire';
    if (name === 'SHADOW_CLONE' || name.includes('SHADOW_CLONE') || name.includes('CLONE')) return 'shadow';
    return 'wind'; // fallback
}

// Get distance between elements on the chakra cycle: Fire <-> Wind <-> Lightning <-> Shadow <-> Fire
function getAffinityDistance(aff1, aff2) {
    const idx1 = AFFINITY_CYCLE.indexOf(aff1);
    const idx2 = AFFINITY_CYCLE.indexOf(aff2);
    if (idx1 === -1 || idx2 === -1) return 2;
    
    const diff = Math.abs(idx1 - idx2);
    return diff > 2 ? AFFINITY_CYCLE.length - diff : diff;
}

// Check if a Jutsu is unlocked based on chakra nature distance and ninja rank
function isJutsuUnlocked(jutsuName) {
    const jutsuAffinity = getJutsuAffinity(jutsuName);
    const dist = getAffinityDistance(currentAffinity, jutsuAffinity);
    
    if (dist === 0) return shinobiRank >= 1; // Same nature: Academy Student
    if (dist === 1) return shinobiRank >= 2; // Neighboring nature: Genin
    if (dist === 2) return shinobiRank >= 4; // Opposite nature: Jonin
    return false;
}


// Draw a webcam/model sensor diagnostics card
function drawDiagnosticsPanel(ctx, handDetected) {
    const canvas = ctx.canvas;
    const px = 15;
    const py = canvas.height - 100;
    const pw = 175;
    const ph = 70;
    
    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 8);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = "bold 8px 'Share Tech Mono', monospace";
    ctx.fillText("SENSOR DIAGNOSTICS", px + 12, py + 16);
    
    // Camera status dot
    ctx.fillStyle = isCameraRunning ? '#28dc50' : '#ff3c3c';
    ctx.beginPath();
    ctx.arc(px + 16, py + 32, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = "9px 'Share Tech Mono', monospace";
    ctx.fillText("CAMERA: " + (isCameraRunning ? "CONNECTED (640x480)" : "OFFLINE"), px + 26, py + 35);
    
    // Hand status dot
    ctx.fillStyle = handDetected ? '#28dc50' : (isCameraRunning ? '#ffaa00' : '#ff3c3c');
    ctx.beginPath();
    ctx.arc(px + 16, py + 50, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText("HANDS: " + (handDetected ? "TRACKING ACTIVE" : (isCameraRunning ? "SEARCHING HAND..." : "OFFLINE")), px + 26, py + 53);
    
    ctx.restore();
}

// Refresh scroll card locked/unlocked states in the HUD
function updateScrollLocks() {
    document.querySelectorAll('.scroll-card').forEach(card => {
        const cardJutsu = card.getAttribute('data-jutsu');
        const unlocked = isJutsuUnlocked(cardJutsu);
        
        // Highlight card if it is the active training target
        if (cardJutsu === trainingTargetJutsu) {
            card.classList.add('training-target');
        } else {
            card.classList.remove('training-target');
        }
        
        if (!unlocked) {
            card.classList.add('locked');
            card.classList.remove('unlocked-card');
            
            const jutsuAffinity = getJutsuAffinity(cardJutsu);
            const dist = getAffinityDistance(currentAffinity, jutsuAffinity);
            let neededRankName = "GENIN (Rank 2)";
            if (dist === 2) {
                neededRankName = "JONIN (Rank 4)";
            }
            
            let lockLbl = card.querySelector('.locked-label');
            if (!lockLbl) {
                lockLbl = document.createElement('div');
                lockLbl.className = 'locked-label';
                card.appendChild(lockLbl);
            }
            lockLbl.innerText = `🔒 Unlocks at ${neededRankName}`;
        } else {
            card.classList.remove('locked');
            card.classList.add('unlocked-card');
            const lockLbl = card.querySelector('.locked-label');
            if (lockLbl) {
                card.removeChild(lockLbl);
            }
        }
    });
}

// Refresh title text and combo sequence on scroll cards based on equipped custom Jutsus
function updateScrollCardNames() {
    const comboSequences = {
        'RASENGAN': 'Combo: Shaka 🤙 ➔ Peace ✌️ ➔ Shaka 🤙',
        'CHIDORI': 'Combo: Rock 🤘 ➔ Palm 🖐️ ➔ Rock 🤘',
        'FIREBALL': 'Combo: Palm 🖐️ ➔ Rock 🤘 ➔ Palm 🖐️',
        'SHADOW_CLONE': 'Combo: Peace ✌️ ➔ Shaka 🤙 ➔ Peace ✌️'
    };
    
    document.querySelectorAll('.scroll-card').forEach(card => {
        const cardJutsu = card.getAttribute('data-jutsu');
        const nature = getJutsuAffinity(cardJutsu);
        const displayName = equippedJutsuDisplayNames[nature];
        
        const titleEl = card.querySelector('.scroll-card-title');
        if (titleEl) {
            let emoji = '🖐️';
            if (nature === 'wind') emoji = '🤙';
            else if (nature === 'lightning') emoji = '🤘';
            else if (nature === 'shadow') emoji = '✌️';
            
            titleEl.innerText = `${displayName.replace('_', ' ')} ${emoji}`;
        }
        
        const sealEl = card.querySelector('.scroll-card-seal');
        if (sealEl) {
            sealEl.innerText = comboSequences[cardJutsu] || 'Seal: Special Combo';
        }
    });
}

// Parse Nature affinity of library database Jutsus
function getJutsuNature(jutsu) {
    const name = jutsu.jutsu_name.toLowerCase();
    const desc = jutsu.jutsu_description.toLowerCase();
    const type = jutsu.jutsu_type ? jutsu.jutsu_type.toLowerCase() : '';
    
    if (name.includes('fire') || desc.includes('fire release') || desc.includes('katon') || name.includes('flame') || desc.includes('flame') || name.includes('amaterasu')) {
        return 'fire';
    }
    if (name.includes('wind') || desc.includes('wind release') || desc.includes('fūton') || name.includes('gale') || desc.includes('gale') || name.includes('rasengan')) {
        return 'wind';
    }
    if (name.includes('lightning') || desc.includes('lightning release') || desc.includes('raiton') || name.includes('chidori') || desc.includes('chidori') || name.includes('thunder') || desc.includes('thunder') || desc.includes('electricity') || name.includes('kirin')) {
        return 'lightning';
    }
    if (name.includes('shadow') || desc.includes('shadow clone') || desc.includes('kage bunshin') || name.includes('clone') || desc.includes('yin-yang') || desc.includes('confrontation seal') || desc.includes('shadow imitation')) {
        return 'shadow';
    }
    return null;
}

// Generate deterministic sequence of zodiac seals ending with the Dojo's simplified seal
function getJutsuSeals(jutsuName, nature) {
    let hash = 0;
    for (let i = 0; i < jutsuName.length; i++) {
        hash = jutsuName.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const len = 2 + (hash % 2); // 2 or 3 animal seals
    const sequence = [];
    for (let i = 0; i < len; i++) {
        const sealIdx = (hash + i * 7) % ZODIAC_SEALS.length;
        sequence.push(ZODIAC_SEALS[sealIdx]);
    }
    
    let dojoSeal = '';
    if (nature === 'wind') dojoSeal = 'Shaka Sign (🤙)';
    else if (nature === 'lightning') dojoSeal = 'Rock-on Sign (🤘)';
    else if (nature === 'fire') dojoSeal = 'Open Palm (🖐️)';
    else if (nature === 'shadow') dojoSeal = 'Peace Sign (✌️)';
    
    sequence.push(`Dojo seal: ${dojoSeal}`);
    return sequence.join(' → ');
}

// XP Progression Logic
function addXP(amount) {
    if (shinobiRank >= 5) {
        shinobiXP = 0;
        return;
    }
    
    shinobiXP += amount;
    addLogEntry(`Earned +${amount} XP.`);
    
    if (shinobiXP >= nextRankXP) {
        shinobiXP -= nextRankXP;
        shinobiRank++;
        nextRankXP = RANK_LIMITS[shinobiRank];
        currentChakraCost = CHAKRA_COSTS[shinobiRank];
        
        playLevelUpSound();
        addLogEntry(`LEVEL UP! Promoted to ${RANK_NAMES[shinobiRank]}!`, true);
        
        // Update UI
        rankBadge.innerText = RANK_NAMES[shinobiRank];
        costBadge.innerText = `Cost: ${currentChakraCost}% / cast`;
        if (shinobiRank === 5) {
            costBadge.innerText = `Cost: 0% (KAGE)`;
            rankBadge.style.color = '#b500ff';
            rankBadge.style.textShadow = '0 0 10px rgba(181,0,255,0.6)';
        }
        
        // Refresh locked scrolls state based on new rank
        updateScrollLocks();
    }
    
    // Update XP Bar UI
    if (shinobiRank < 5) {
        const pct = (shinobiXP / nextRankXP) * 100;
        xpBarFill.style.width = `${pct}%`;
        xpValEl.innerText = `${Math.round(shinobiXP)} / ${nextRankXP}`;
    } else {
        xpBarFill.style.width = `100%`;
        xpValEl.innerText = `MAX LEVEL (KAGE)`;
    }
    
    // Save progress automatically when XP changes
    saveShinobiProgress();
}

// Save Shinobi progress to LocalStorage
function saveShinobiProgress() {
    const progress = {
        lockedName: lockedName,
        currentAffinity: currentAffinity,
        shinobiRank: shinobiRank,
        shinobiXP: shinobiXP,
        equippedJutsuDisplayNames: equippedJutsuDisplayNames
    };
    localStorage.setItem('shinobi_scroll_progress', JSON.stringify(progress));
    updateSavedProfileUI();
}

// Load Shinobi progress from LocalStorage
function loadShinobiProgress() {
    const saved = localStorage.getItem('shinobi_scroll_progress');
    if (!saved) return false;
    
    try {
        const progress = JSON.parse(saved);
        if (!progress.lockedName || !progress.currentAffinity) return false;
        
        lockedName = progress.lockedName;
        currentAffinity = progress.currentAffinity;
        shinobiRank = progress.shinobiRank || 1;
        shinobiXP = progress.shinobiXP || 0;
        if (progress.equippedJutsuDisplayNames) {
            equippedJutsuDisplayNames = progress.equippedJutsuDisplayNames;
        }
        
        // Re-calculate derived values
        nextRankXP = RANK_LIMITS[shinobiRank];
        currentChakraCost = CHAKRA_COSTS[shinobiRank];
        
        // Update UI Badges
        if (lockedNameBadge) lockedNameBadge.innerText = lockedName.toUpperCase();
        if (lockedNatureBadge) lockedNatureBadge.innerText = `${currentAffinity.toUpperCase()} NATURE (LOCKED)`;
        if (rankBadge) rankBadge.innerText = RANK_NAMES[shinobiRank];
        if (costBadge) {
            costBadge.innerText = shinobiRank === 5 ? `Cost: 0% (KAGE)` : `Cost: ${currentChakraCost}% / cast`;
        }
        if (shinobiRank === 5 && rankBadge) {
            rankBadge.style.color = '#b500ff';
            rankBadge.style.textShadow = '0 0 10px rgba(181,0,255,0.6)';
        }
        
        // Update XP Bar UI
        if (shinobiRank < 5) {
            const pct = (shinobiXP / nextRankXP) * 100;
            if (xpBarFill) xpBarFill.style.width = `${pct}%`;
            if (xpValEl) xpValEl.innerText = `${Math.round(shinobiXP)} / ${nextRankXP}`;
        } else {
            if (xpBarFill) xpBarFill.style.width = `100%`;
            if (xpValEl) xpValEl.innerText = `MAX LEVEL (KAGE)`;
        }
        
        // Apply Element Affinity Theme
        selectAffinity(currentAffinity);
        
        // Hide Affinity Circular Selector
        const affSelector = document.querySelector('.affinity-circle-selector');
        if (affSelector) affSelector.style.display = 'none';
        
        const affinityEl = document.querySelector('.panel-content')?.querySelector('[data-affinity]');
        if (affinityEl?.parentElement) affinityEl.parentElement.remove();
        
        // Refresh locked scrolls and titles
        updateScrollLocks();
        updateScrollCardNames();
        resetCombo();
        
        return true;
    } catch (e) {
        console.error("Failed to load shinobi scroll:", e);
        return false;
    }
}

// Update the load scroll UI preview
function updateSavedProfileUI() {
    const saved = localStorage.getItem('shinobi_scroll_progress');
    const savedBox = document.getElementById('saved-profile-box');
    const noSavedMsg = document.getElementById('no-saved-profile-msg');
    const btnLoadDojo = document.getElementById('btn-load-dojo');
    
    if (!savedBox || !noSavedMsg || !btnLoadDojo) return;
    
    if (saved) {
        try {
            const progress = JSON.parse(saved);
            const savedName = document.getElementById('saved-profile-name');
            const savedNature = document.getElementById('saved-profile-nature');
            const savedRank = document.getElementById('saved-profile-rank');
            const savedXP = document.getElementById('saved-profile-xp');
            
            if (savedName) savedName.innerText = progress.lockedName;
            if (savedNature) savedNature.innerText = `${progress.currentAffinity.toUpperCase()} NATURE`;
            if (savedRank) savedRank.innerText = RANK_NAMES[progress.shinobiRank || 1];
            
            const nextXP = RANK_LIMITS[progress.shinobiRank || 1];
            if (savedXP) {
                if ((progress.shinobiRank || 1) < 5) {
                    savedXP.innerText = `${Math.round(progress.shinobiXP || 0)} / ${nextXP}`;
                } else {
                    savedXP.innerText = `MAX (KAGE)`;
                }
            }
            
            savedBox.style.display = 'flex';
            noSavedMsg.style.display = 'none';
            btnLoadDojo.style.display = 'block';
        } catch (e) {
            console.error("Error updating saved profile UI:", e);
            savedBox.style.display = 'none';
            noSavedMsg.style.display = 'block';
            btnLoadDojo.style.display = 'none';
        }
    } else {
        savedBox.style.display = 'none';
        noSavedMsg.style.display = 'block';
        btnLoadDojo.style.display = 'none';
    }
}

// Update Virtual Pinch & Scroll Cursor via index finger and thumb pinch gesture
function updateVirtualCursor(hand) {
    if (!virtualCursor || !virtualCursorProgress) return;
    
    if (!hand || isExhausted) {
        // Hide virtual cursor if no hand is detected or if we are in the sparks gathering game
        virtualCursor.style.display = 'none';
        
        // Reset scroll mode if hand is lost
        if (isScrollMode) {
            isScrollMode = false;
            tapCount = 0;
            addLogEntry("Scroll mode exited - hand lost.");
        }
        
        // Clear pending timeouts
        if (singleTapTimeout) {
            clearTimeout(singleTapTimeout);
            singleTapTimeout = null;
        }
        
        resetDwellProgress();
        wasPinching = false;
        return;
    }
    
    const indexTip = hand[8];
    const thumbTip = hand[4];
    
    // Position tracking using indexTip
    let screenX = 0;
    if (isVideoMirrored) {
        screenX = (1 - indexTip.x) * window.innerWidth;
    } else {
        screenX = indexTip.x * window.innerWidth;
    }
    const screenY = indexTip.y * window.innerHeight;
    
    virtualCursor.style.display = 'block';
    virtualCursor.style.left = `${screenX}px`;
    virtualCursor.style.top = `${screenY}px`;
    
    // Calculate scale-invariant pinch distance ratio
    const palmSize = getDist(hand[0], hand[9]);
    if (palmSize < 0.01) return;
    
    const tipDist = getDist(thumbTip, indexTip);
    const pinchRatio = tipDist / palmSize;
    const isPinching = pinchRatio < 0.35;
    
    // Update circular gauge based on pinch closeness (Visual indicator of pinch progress)
    let progressPct = 0;
    if (isPinching) {
        progressPct = 1.0;
    } else if (pinchRatio >= 0.85) {
        progressPct = 0.0;
    } else {
        progressPct = 1.0 - (pinchRatio - 0.35) / (0.85 - 0.35);
    }
    const strokeOffset = 76 - (progressPct * 76);
    virtualCursorProgress.style.strokeDashoffset = strokeOffset.toString();
    
    // Find the element at this point
    let hovered = document.elementFromPoint(screenX, screenY);
    let clickable = null;
    if (hovered) {
        clickable = hovered.closest('button, .scroll-card, .tab-btn, .chakra-btn-select, .lib-result-item, input');
    }
    currentHoveredElement = clickable;
    
    const now = performance.now();
    
    // Scroll Mode Logic
    if (isScrollMode) {
        if (!isPinching) {
            // Exit Scroll Mode
            isScrollMode = false;
            tapCount = 0;
            virtualCursor.style.transform = 'translate(-50%, -50%) scale(1)';
            virtualCursor.style.borderColor = 'var(--active-chakra)';
            addLogEntry("Scroll mode completed.");
        } else {
            // Actively Scrolling
            const deltaY = indexTip.y - lastScrollHandY;
            lastScrollHandY = indexTip.y;
            
            // Scroll intensity maps to index tip displacement
            window.scrollBy(0, deltaY * window.innerHeight * 1.6);
            
            // Set scroll visual feedback style
            virtualCursor.style.transform = 'translate(-50%, -50%) scale(1.4)';
            virtualCursor.style.borderColor = '#b500ff'; // Purple scroll theme
        }
    } else {
        // Normal Mode: Tap / Click detection
        
        // Pinch Down Transition (Press)
        if (isPinching && !wasPinching) {
            if (now - lastReleaseTime < 400) {
                // Clear any pending single tap click to prevent double clicks
                if (singleTapTimeout) {
                    clearTimeout(singleTapTimeout);
                    singleTapTimeout = null;
                }
                
                // Double tap detected: Enter scroll mode
                isScrollMode = true;
                lastScrollHandY = indexTip.y;
                addLogEntry("Scroll mode activated ↕️ (Drag hand to scroll)");
            }
        }
        
        // Pinch Up Transition (Release)
        if (!isPinching && wasPinching) {
            // A single pinch release triggers click if not in scroll mode
            lastReleaseTime = now;
            
            if (singleTapTimeout) {
                clearTimeout(singleTapTimeout);
            }
            
            singleTapTimeout = setTimeout(() => {
                if (currentHoveredElement) {
                    currentHoveredElement.click();
                    playSparkSound();
                    
                    // Flash cursor green on click
                    virtualCursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
                    virtualCursor.style.borderColor = '#00ff66';
                    
                    setTimeout(() => {
                        if (virtualCursor) {
                            virtualCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                            virtualCursor.style.borderColor = 'var(--active-chakra)';
                        }
                    }, 200);
                }
                singleTapTimeout = null;
            }, 250);
        }
        
        // Dynamic Cursor Styling based on hover and pinch states
        if (!isScrollMode) {
            if (isPinching) {
                virtualCursor.style.transform = 'translate(-50%, -50%) scale(1.2)';
                virtualCursor.style.borderColor = '#ffaa00'; // Orange pinch down
            } else if (clickable) {
                virtualCursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
                virtualCursor.style.borderColor = 'var(--active-chakra)';
            } else {
                virtualCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                virtualCursor.style.borderColor = 'var(--active-chakra)';
            }
        }
    }
    
    wasPinching = isPinching;
}

function resetDwellProgress() {
    currentHoveredElement = null;
    if (virtualCursor && virtualCursorProgress) {
        virtualCursor.style.transform = 'translate(-50%, -50%) scale(1)';
        virtualCursor.style.borderColor = 'var(--active-chakra)';
        virtualCursorProgress.style.strokeDashoffset = '76';
    }
}

// Initialize Microphone Blow Detector
// Initialize Microphone Blow & Spell-Cry Detector
function initBlowDetector() {
    if (audioContext) return;
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        audioAnalyser = audioContext.createAnalyser();
        audioAnalyser.fftSize = 512; // 256 frequency bins
        source.connect(audioAnalyser);
        
        const bufferLength = audioAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const micIndicator = document.getElementById('audio-mic-indicator');
        if (micIndicator) {
            micIndicator.classList.add('active');
        }
        
        function checkBlow() {
            if (!audioAnalyser) return;
            audioAnalyser.getByteFrequencyData(dataArray);
            
            // Compute average volume amplitude
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // DSP Frequency Breakdown
            let voiceEnergy = 0;
            let blowEnergy = 0;
            
            // Bins 0 to 10 (approx 0 - 900 Hz, covering voiced fundamentals)
            for (let i = 0; i <= 10; i++) {
                voiceEnergy += dataArray[i];
            }
            // Bins 11 to 45 (approx 1000 - 4000 Hz, covering breath friction frequencies)
            for (let i = 11; i <= 45; i++) {
                blowEnergy += dataArray[i];
            }
            
            // HF-to-LF Spectral Energy Ratio
            const hfRatio = blowEnergy / (voiceEnergy + 1);
            
            // Spectral Flatness (Wiener Entropy) over first 45 bins
            let logSum = 0;
            let linearSum = 0;
            const numFlatnessBins = 45;
            for (let i = 0; i < numFlatnessBins; i++) {
                const val = dataArray[i];
                logSum += Math.log(val + 1);
                linearSum += val;
            }
            const geomMean = Math.exp(logSum / numFlatnessBins);
            const arithMean = (linearSum / numFlatnessBins) + 1;
            const flatness = geomMean / arithMean;
            
            // Multi-dimensional Classification State Machine
            let state = 'SILENT';
            if (average < 10) {
                state = 'SILENT';
            } else if (hfRatio > 1.2 && flatness > 0.35) {
                state = 'BLOWING 💨';
            } else if (flatness < 0.22 && average > 20) {
                state = 'SPELL CRY 🗣️';
            } else {
                state = 'SPEAKING';
            }
            
            // Handle Fireball invocation triggers
            if (activeJutsu === 'FIREBALL') {
                if (state === 'BLOWING 💨') {
                    isBlowing = true;
                    triggerFireballBlast(false);
                } else if (state === 'SPELL CRY 🗣️') {
                    isBlowing = true;
                    triggerFireballBlast(true);
                } else {
                    isBlowing = false;
                }
            } else {
                isBlowing = false;
            }
            
            // Update Spectrogram GUI Card
            const stateEl = document.getElementById('spec-state');
            const volEl = document.getElementById('spec-volume');
            const hfEl = document.getElementById('spec-hfratio');
            const flatEl = document.getElementById('spec-flatness');
            const canvas = document.getElementById('spec-canvas');
            
            if (stateEl) {
                stateEl.innerText = state;
                if (state === 'BLOWING 💨') stateEl.style.color = '#ff5500';
                else if (state === 'SPELL CRY 🗣️') stateEl.style.color = '#b500ff';
                else if (state === 'SPEAKING') stateEl.style.color = '#00e676';
                else stateEl.style.color = '#888888';
            }
            if (volEl) volEl.innerText = `${Math.round((average / 255) * 100)}%`;
            if (hfEl) hfEl.innerText = hfRatio.toFixed(2);
            if (flatEl) flatEl.innerText = flatness.toFixed(2);
            
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                for (let x = 30; x < canvas.width; x += 30) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                
                // Draw frequency bins (first 40 bins)
                const barWidth = canvas.width / 40;
                for (let i = 0; i < 40; i++) {
                    const val = dataArray[i];
                    const pct = val / 255;
                    const h = canvas.height * pct;
                    
                    const grad = ctx.createLinearGradient(0, canvas.height - h, 0, canvas.height);
                    if (state === 'BLOWING 💨') {
                        grad.addColorStop(0, '#ff5500');
                        grad.addColorStop(1, '#ffaa00');
                    } else if (state === 'SPELL CRY 🗣️') {
                        grad.addColorStop(0, '#b500ff');
                        grad.addColorStop(1, '#00d2ff');
                    } else if (state === 'SPEAKING') {
                        grad.addColorStop(0, '#00e676');
                        grad.addColorStop(1, '#aaeedd');
                    } else {
                        grad.addColorStop(0, 'rgba(0, 210, 255, 0.6)');
                        grad.addColorStop(1, 'rgba(0, 210, 255, 0.2)');
                    }
                    
                    ctx.fillStyle = grad;
                    ctx.fillRect(i * barWidth, canvas.height - h, barWidth - 1, h);
                }
            }
            
            requestAnimationFrame(checkBlow);
        }
        checkBlow();
    }).catch(err => {
        console.warn("Microphone not available or permission denied for blow detection:", err);
        addLogEntry("Mic blow detection unavailable. Use SPACEBAR to blow fireball.");
        const stateEl = document.getElementById('spec-state');
        if (stateEl) stateEl.innerText = "DENIED/OFFLINE";
    });
}

// Spawn fireball blast particles that expand and travel forward in 3D perspective
function triggerFireballBlast(isVoiceActivated = false) {
    const handX = lastKnownHandPos.x * canvasElement.width;
    const handY = lastKnownHandPos.y * canvasElement.height;
    
    // Estimated mouth coordinate (center-top screen) or physical mouth coordinate if detected
    let mouthX = canvasElement.width / 2;
    let mouthY = canvasElement.height * 0.38;
    
    if (physicalMouthPos) {
        mouthX = physicalMouthPos.x * canvasElement.width;
        mouthY = physicalMouthPos.y * canvasElement.height;
    }
    
    // Use dynamic target lock position if face is detected; otherwise, default to hand coordinates
    const targetX = faceDetected ? (targetLockPos.x * canvasElement.width) : handX;
    const targetY = faceDetected ? (targetLockPos.y * canvasElement.height) : handY;
    
    const dx = targetX - mouthX;
    const dy = targetY - mouthY;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    
    // Spell Cry (Voice Activated) makes fireballs 1.8x larger and shoots twice as many!
    const count = isVoiceActivated ? 6 : 3;
    const baseSize = isVoiceActivated ? 16 : 8;
    const baseSpeed = isVoiceActivated ? 9.0 : 6.0;
    
    for (let i = 0; i < count; i++) {
        // Add random spread to simulate fireball turbulence
        const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 0.25;
        const speed = baseSpeed + Math.random() * (isVoiceActivated ? 6.0 : 4.0);
        
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // Starts small at the mouth, then grows as it travels
        const size = baseSize + Math.random() * 5;
        
        particles.push(new Particle(
            mouthX, 
            mouthY, 
            'fireball_blast', 
            isVoiceActivated ? '#ffcc00' : '#ff4500', 
            size, 
            vx, 
            vy, 
            40 + Math.random() * 25
        ));
    }
    
    // Screen shake on voice-activated spell cries
    if (isVoiceActivated && Math.random() > 0.5) {
        triggerScreenShake();
    }
    
    limitParticles();
}

// Particle Class
class Particle {
    constructor(x, y, type, color, size, vx, vy, maxLife = 40) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.life = maxLife;
        this.maxLife = maxLife;
    }
    
    update() {
        this.life--;
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'fire') {
            this.vy -= 0.12;
            this.vx *= 0.98;
            this.size *= 0.95;
        } else if (this.type === 'fireball_blast') {
            this.size += 1.8;
            this.vx *= 0.96;
            this.vy *= 0.96;
        } else if (this.type === 'smoke') {
            this.vx *= 0.94;
            this.vy *= 0.94;
            this.size += 0.45;
        } else if (this.type === 'rasengan') {
            this.size *= 0.94;
        } else if (this.type === 'lightning') {
            this.vx += (Math.random() - 0.5) * 1.5;
            this.vy += (Math.random() - 0.5) * 1.5;
            this.size *= 0.92;
        } else if (this.type === 'aura') {
            this.vy -= 0.15;
            this.vx += (Math.random() - 0.5) * 0.3;
            this.size *= 0.94;
        }
    }
    
    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, this.life / this.maxLife);
        
        if (this.type === 'fireball_blast') {
            const grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.1, this.x, this.y, this.size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, '#ffcc00');
            grad.addColorStop(0.65, '#ff4500');
            grad.addColorStop(1.0, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = grad;
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'lightning' || this.type === 'rasengan') {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2.0, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw core
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.9;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Spawn fireballs
function emitFire(x, y, isSupercharged) {
    const count = isSupercharged ? 8 : 4;
    for (let i = 0; i < count; i++) {
        const angle = (Math.random() - 0.5) * 0.4 - Math.PI/2;
        const speed = 4 + Math.random() * 8;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = 15 + Math.random() * 20;
        const color = Math.random() > 0.4 ? '#ff5500' : (Math.random() > 0.5 ? '#ffaa00' : '#ff3300');
        particles.push(new Particle(x, y, 'fire', color, size, vx, vy, 45 + Math.random()*20));
    }
    limitParticles();
}

// Spawn smoke clouds
function emitSmoke(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const size = 12 + Math.random() * 15;
        const color = Math.random() > 0.5 ? '#eceef2' : '#cccccc';
        particles.push(new Particle(x, y, 'smoke', color, size, vx, vy, 35 + Math.random()*25));
    }
    limitParticles();
}

// Spawn aura bubbles
function emitAura(x, y) {
    if (Math.random() > 0.45) return; // lower emission frequency
    const theme = THEMES[currentAffinity];
    const vx = (Math.random() - 0.5) * 1.0;
    const vy = -1 - Math.random() * 1.5;
    particles.push(new Particle(x, y, 'aura', theme.color, 4 + Math.random() * 3, vx, vy, 20 + Math.random() * 10)); // shorter life
    limitParticles();
}

function limitParticles() {
    if (particles.length > MAX_PARTICLES) {
        particles.splice(0, particles.length - MAX_PARTICLES);
    }
}

// Draw lightning bolts (optimized with double stroke glow)
function drawLightningBolt(ctx, x1, y1, x2, y2, color, thickness) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const totalDist = Math.hypot(dx, dy);
    const steps = Math.max(4, Math.floor(totalDist / 20));
    
    const points = [{ x: x1, y: y1 }];
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        let cx = x1 + dx * t;
        let cy = y1 + dy * t;
        
        const perpX = -dy / totalDist;
        const perpY = dx / totalDist;
        const offset = (Math.random() - 0.5) * 20;
        
        cx += perpX * offset;
        cy += perpY * offset;
        points.push({ x: cx, y: cy });
        
        if (Math.random() > 0.85) {
            particles.push(new Particle(cx, cy, 'lightning', '#ffffff', 2 + Math.random()*1.5, (Math.random()-0.5)*2, (Math.random()-0.5)*2, 12));
        }
    }
    points.push({ x: x2, y: y2 });
    
    // Draw thick backing glow path
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness * 2.5;
    ctx.globalAlpha = 0.35;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
    
    // Draw thin bright core path
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = thickness * 0.8;
    ctx.globalAlpha = 0.95;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
}

// Draw swirling Rasengan sphere (optimized with double strokes)
function drawRasenganSphere(ctx, cx, cy, radius, isSupercharged) {
    ctx.save();
    
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ccf3ff');
    grad.addColorStop(0.6, 'rgba(0, 180, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    const ringCount = isSupercharged ? 4 : 2; // reduced count for speed
    const rotSpeed = Date.now() * 0.008;
    
    ctx.lineWidth = 1.5;
    
    for (let r = 0; r < ringCount; r++) {
        // Double stroke fake glow
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotSpeed * (r % 2 === 0 ? 1 : -1) + (r * Math.PI / 4));
        ctx.scale(1, 0.35 + (r * 0.15));
        
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    const spiralCount = isSupercharged ? 10 : 6; // reduced count
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    for (let s = 0; s < spiralCount; s++) {
        ctx.beginPath();
        const startAng = rotSpeed * 2 + (s * Math.PI * 2 / spiralCount);
        
        for (let a = 0; a < Math.PI * 1.2; a += 0.15) { // larger step increments
            const currentR = radius * (1 - (a / (Math.PI * 1.2))) * 0.85;
            const theta = startAng + a;
            const sx = cx + Math.cos(theta) * currentR;
            const sy = cy + Math.sin(theta) * currentR;
            
            if (a === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
    }
    
    if (Math.random() > 0.35) {
        const ang = Math.random() * Math.PI * 2;
        const dist = radius * (0.8 + Math.random() * 0.3);
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        const speed = 2 + Math.random() * 2;
        const vx = -Math.sin(ang) * speed;
        const vy = Math.cos(ang) * speed;
        
        particles.push(new Particle(px, py, 'rasengan', '#ffffff', 2 + Math.random()*1.5, vx, vy, 15));
    }
    
    ctx.restore();
}

// Distance utility
function getDist(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// Spark Gathering Game Initiation
function triggerExhaustion() {
    isExhausted = true;
    releaseJutsu();
    
    gatheredSparks = 0;
    exhaustionOverlay.style.display = 'flex';
    gatheredSparksCount.innerText = '0';
    chakraMeterBox.classList.add('depleted');
    
    addLogEntry('CHAKRA EXHAUSTED! Commencing gathering game...', true);
    
    // Spawn 5 random targets
    sparks = [];
    for (let i = 0; i < 5; i++) {
        sparks.push({
            x: 0.15 + Math.random() * 0.7,
            y: 0.22 + Math.random() * 0.55,
            collected: false,
            pulse: Math.random() * Math.PI
        });
    }
}

// Helper to determine if a finger is extended or curled (ROTATION-INVARIANT using PIP joints)
function isFingerExtended(hand, tipIdx, pipIdx) {
    const dTip = getDist(hand[tipIdx], hand[0]); // distance from tip to wrist
    const dPip = getDist(hand[pipIdx], hand[0]); // distance from PIP to wrist
    return dTip > dPip * 1.01; // 1% extension margin (relaxed from 1.05)
}

function isFingerCurled(hand, tipIdx, pipIdx) {
    const dTip = getDist(hand[tipIdx], hand[0]); // distance from tip to wrist
    const dPip = getDist(hand[pipIdx], hand[0]); // distance from PIP to wrist
    return dTip < dPip * 1.12; // curl matches when tip is closer to wrist than 112% PIP (relaxed from 1.0)
}

function classifyGestures(landmarks) {
    if (!landmarks || landmarks.length === 0 || isExhausted) {
        return 'NONE';
    }
    
    // Check all detected hands so user can invoke jutsu from either hand
    for (let h = 0; h < landmarks.length; h++) {
        const hand = landmarks[h];
        const palmSize = getDist(hand[0], hand[9]); // Wrist (0) to Middle MCP (9)
        if (palmSize < 0.01) continue;
        
        // Evaluate extend/curl states for the 4 fingers using PIP joints
        const idxExt  = isFingerExtended(hand, 8, 6);
        const midExt  = isFingerExtended(hand, 12, 10);
        const ringExt = isFingerExtended(hand, 16, 14);
        const pkyExt  = isFingerExtended(hand, 20, 18);
        
        const idxCrl  = isFingerCurled(hand, 8, 6);
        const midCrl  = isFingerCurled(hand, 12, 10);
        const ringCrl = isFingerCurled(hand, 16, 14);
        const pkyCrl  = isFingerCurled(hand, 20, 18);
        
        // 1. Fire Release (Fireball): Flat hand with all fingers extended
        const isFireSeal = idxExt && midExt && ringExt && pkyExt;
        if (isFireSeal) return 'FIREBALL';
        
        // 2. Wind Release (Rasengan): Thumb and pinky extended, other fingers curled
        const isThumbExtended = getDist(hand[4], hand[0]) > getDist(hand[3], hand[0]) * 1.01; // compare tip (4) to IP (3) (relaxed from 1.05)
        const isWindSeal = isThumbExtended && pkyExt && idxCrl && midCrl && ringCrl;
        if (isWindSeal) return 'RASENGAN';
        
        // 3. Lightning Release (Chidori): Index and pinky extended, middle and ring curled
        const isLightningSeal = idxExt && pkyExt && midCrl && ringCrl;
        if (isLightningSeal) return 'CHIDORI';
        
        // 4. Confrontation Seal (Shadow Clone): Index and middle fingers extended, others curled
        const isConfrontationSeal = idxExt && midExt && ringCrl && pkyCrl;
        if (isConfrontationSeal) return 'SHADOW_CLONE';
    }
    
    return 'NONE';
}

function invokeJutsu(jutsuName) {
    activeJutsu = jutsuName;
    
    // Get display name based on equipped Jutsus
    const nature = getJutsuAffinity(jutsuName);
    const displayName = equippedJutsuDisplayNames[nature] || jutsuName;
    const finalDisplayName = isComboSupercharged ? `${displayName} [SUPERCHARGED]` : displayName;
    
    // Deduct chakra
    chakraLevel = Math.max(0, chakraLevel - currentChakraCost);
    levelVal.innerText = Math.round(chakraLevel).toString();
    chakraMeterFill.style.width = `${chakraLevel}%`;
    
    addLogEntry(`${finalDisplayName} JUTSU ACTIVATED!`, true);
    statusOverlay.innerText = finalDisplayName;
    statusOverlay.classList.add('jutsu-active');
    if (isComboSupercharged) {
        statusOverlay.classList.add('supercharged-pulse');
    }
    
    activeJutsuVal.innerText = finalDisplayName;
    
    // Cast effects
    if (activeJutsu === 'SHADOW_CLONE') {
        flashScreen.style.opacity = '1';
        setTimeout(() => { flashScreen.style.opacity = '0'; }, 150);
        playPoofSound();
        emitSmoke(lastKnownHandPos.x * canvasElement.width, lastKnownHandPos.y * canvasElement.height, 30);
        
        // Capture a snapshot of the user's mirrored webcam feed for the clones
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasElement.width || 640;
        tempCanvas.height = canvasElement.height || 480;
        const tempCtx = tempCanvas.getContext('2d');
        if (isVideoMirrored) {
            tempCtx.translate(tempCanvas.width, 0);
            tempCtx.scale(-1, 1);
        }
        try {
            tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
            cloneData = tempCanvas;
        } catch (e) {
            console.error("Failed to capture shadow clone image:", e);
            cloneData = null;
        }
    } else if (activeJutsu === 'RASENGAN') {
        startRasenganSound();
    } else if (activeJutsu === 'FIREBALL') {
        startFireSound();
    } else if (activeJutsu === 'CHIDORI') {
        startChidoriSound();
    }
    
    // Highlight sidebar scroll
    document.querySelectorAll('.scroll-card').forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-jutsu') === activeJutsu) {
            card.classList.add('active');
        }
    });
    
    // Add XP
    addXP(10);
    
    // Check if depleted
    if (chakraLevel <= 0.01) {
        setTimeout(() => { triggerExhaustion(); }, 1000);
    }
}

function releaseJutsu() {
    if (activeJutsu === 'NONE') return;
    
    const nature = getJutsuAffinity(activeJutsu);
    const displayName = equippedJutsuDisplayNames[nature] || activeJutsu;
    
    addLogEntry(`${displayName} jutsu released.`);
    
    if (activeJutsu === 'RASENGAN') stopRasenganSound();
    else if (activeJutsu === 'FIREBALL') stopFireSound();
    else if (activeJutsu === 'CHIDORI') {
        stopChidoriSound();
        lightningFlash.style.backgroundColor = 'rgba(200, 240, 255, 0)';
    } else if (activeJutsu === 'SHADOW_CLONE') {
        playPoofSound();
        emitSmoke(lastKnownHandPos.x * canvasElement.width, lastKnownHandPos.y * canvasElement.height, 20);
        cloneData = null;
    }
    
    activeJutsu = 'NONE';
    resetCombo();
    
    statusOverlay.innerText = isExhausted ? 'CHAKRA EXHAUSTED' : 'FORM A SEAL';
    statusOverlay.classList.remove('jutsu-active');
    statusOverlay.classList.remove('supercharged-pulse');
    activeJutsuVal.innerText = 'NONE';
    
    document.querySelectorAll('.scroll-card').forEach(card => {
        card.classList.remove('active');
    });
}

// Snapshot Capture
function captureSnapshot(canvasElement) {
    if (!canvasElement) return;
    
    flashScreen.style.transition = 'none';
    flashScreen.style.opacity = '1';
    setTimeout(() => {
        flashScreen.style.transition = 'opacity 0.5s ease-out';
        flashScreen.style.opacity = '0';
    }, 50);
    
    playPoofSound();
    const dataUrl = canvasElement.toDataURL('image/png');
    
    const emptyMsg = galleryGrid.querySelector('.gallery-empty');
    if (emptyMsg) {
        galleryGrid.removeChild(emptyMsg);
    }
    
    const container = document.createElement('div');
    container.className = 'gallery-item';
    
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Ninja Clone Moment';
    
    const overlay = document.createElement('div');
    overlay.className = 'overlay-btn';
    overlay.innerHTML = '<span style="font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">DOWNLOAD</span>';
    
    container.appendChild(img);
    container.appendChild(overlay);
    
    container.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `ninja_jutsu_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    });
    
    galleryGrid.insertBefore(container, galleryGrid.firstChild);
    addLogEntry('Jutsu snapshot captured and sealed in scroll!');
}

// Setup MediaPipe and Video Frame Loop
function onResults(results) {
    latestResults = results;
    
    const frameNow = performance.now();
    const dt = (frameNow - lastFrameTime) / 1000;
    lastFrameTime = frameNow;
    
    let currentWristPos = null;
    let handDetected = false;
    let indexTipPos = null;
    
    let firstHand = null;
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        handDetected = true;
        const hand = results.multiHandLandmarks[0];
        firstHand = hand;
        
        const wrist = hand[0];
        currentWristPos = { x: wrist.x, y: wrist.y };
        
        const indexTip = hand[8];
        indexTipPos = { x: indexTip.x, y: indexTip.y };
        
        lastKnownHandPos = { x: (hand[9].x + hand[0].x)/2, y: (hand[9].y + hand[0].y)/2 };
    }
    
    // Update Virtual Pinch & Scroll Cursor
    updateVirtualCursor(firstHand);
    
    // Speed tracker & Chakra meter decay/gain
    if (!isExhausted) {
        if (currentWristPos) {
            const distTravelled = getDist(currentWristPos, lastWristPos);
            handVelocity = distTravelled / (dt || 0.016);
            lastWristPos = currentWristPos;
            
            if (handVelocity > 1.25) {
                chakraLevel = Math.min(100, chakraLevel + handVelocity * 12 * dt);
            }
        } else {
            handVelocity = 0;
        }
        
        // Fast change check before updating DOM properties (avoids layout thrashing)
        const roundedVelocity = Math.round(handVelocity * 10);
        if (roundedVelocity !== lastRenderedVelocity) {
            speedVal.innerText = roundedVelocity.toString();
            lastRenderedVelocity = roundedVelocity;
        }
        const roundedChakra = Math.round(chakraLevel);
        if (roundedChakra !== lastRenderedChakra) {
            levelVal.innerText = roundedChakra.toString();
            chakraMeterFill.style.width = `${roundedChakra}%`;
            lastRenderedChakra = roundedChakra;
        }
    }
    
    // GATHER SPARKS MINI-GAME PROCESS
    if (isExhausted && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        results.multiHandLandmarks.forEach(hand => {
            const indexTip = hand[8];
            if (indexTip) {
                sparks.forEach(spark => {
                    if (spark.collected) return;
                    
                    const dist = Math.hypot(indexTip.x - spark.x, indexTip.y - spark.y);
                    if (dist < 0.085) {
                        spark.collected = true;
                        gatheredSparks++;
                        playSparkSound();
                        
                        const sx = spark.x * canvasElement.width;
                        const sy = spark.y * canvasElement.height;
                        for (let pIdx = 0; pIdx < 15; pIdx++) {
                            const vx = (Math.random() - 0.5) * 4;
                            const vy = (Math.random() - 0.5) * 4;
                            particles.push(new Particle(sx, sy, 'lightning', '#ffffff', 3 + Math.random()*2, vx, vy, 20));
                        }
                        
                        gatheredSparksCount.innerText = gatheredSparks.toString();
                        addLogEntry(`Gathered spark (${gatheredSparks}/5).`);
                    }
                });
            }
        });
        
        if (gatheredSparks === 5) {
            isExhausted = false;
            exhaustionOverlay.style.display = 'none';
            chakraMeterBox.classList.remove('depleted');
            chakraLevel = 100;
            levelVal.innerText = '100';
            chakraMeterFill.style.width = '100%';
            
            playVictorySound();
            addLogEntry('Chakra reserves fully restored! Unleash your power!', true);
            addXP(25);
        }
    }
    
    // JUTSU LOGIC FLOW
    if (!isExhausted) {
        const currentDetectedSeal = classifyGestures(results.multiHandLandmarks);
        
        // Debounce to establish a stable seal (require 2 frames)
        if (currentDetectedSeal !== 'NONE') {
            if (currentDetectedSeal === lastDetectedSeal) {
                sealStableFrames++;
            } else {
                lastDetectedSeal = currentDetectedSeal;
                sealStableFrames = 1;
            }
        } else {
            sealStableFrames = 0;
            lastDetectedSeal = 'NONE';
        }
        
        const stableSeal = (sealStableFrames >= 2) ? lastDetectedSeal : 'NONE';
        
        if (stableSeal !== 'NONE') {
            if (isJutsuUnlocked(stableSeal)) {
                if (activeJutsu !== stableSeal) {
                    if (activeJutsu !== 'NONE') {
                        releaseJutsu();
                    }
                    invokeJutsu(stableSeal);
                }
            } else {
                // Locked feedback
                const affinity = getJutsuAffinity(stableSeal);
                const displayName = equippedJutsuDisplayNames[affinity] || stableSeal;
                const dist = getAffinityDistance(currentAffinity, affinity);
                const neededRank = dist === 2 ? 'JONIN (Rank 4)' : 'GENIN (Rank 2)';
                if (lastDetectedSeal !== stableSeal) {
                    addLogEntry(`🔒 ${displayName} is LOCKED! Requires rank ${neededRank}`, false);
                    lastDetectedSeal = stableSeal;
                }
            }
        } else {
            // stableSeal is 'NONE'
            if (activeJutsu !== 'NONE') {
                releaseJutsu();
            }
        }
    }
}

// MediaPipe Face Detection results callback
function onFaceResults(results) {
    latestFaceResults = results;
    if (results.detections && results.detections.length > 0) {
        faceDetected = true;
        const face = results.detections[0];
        
        // MediaPipe Face Detection keypoints:
        // 0: Right Eye, 1: Left Eye, 2: Nose Tip, 3: Mouth Center, 4: Right Ear, 5: Left Ear
        const landmarks = face.landmarks;
        if (landmarks && landmarks.length >= 4) {
            const eyeRight = landmarks[0];
            const eyeLeft = landmarks[1];
            const nose = landmarks[2];
            const mouth = landmarks[3];
            
            // Keep reference to physical mouth position
            physicalMouthPos = { x: mouth.x, y: mouth.y };
            
            // Estimate eye midpoint
            const eyesMidX = (eyeRight.x + eyeLeft.x) / 2;
            const eyesMidY = (eyeRight.y + eyeLeft.y) / 2;
            
            // Calculate gaze vector based on nose offset relative to eye midpoint
            const gazeOffsetX = (nose.x - eyesMidX) * 7.5; // multiplier scales gaze shift to screen edges
            const gazeOffsetY = (nose.y - eyesMidY) * 7.5;
            
            // Projected target lock coordinates (smooth transition)
            const rawTargetX = eyesMidX + gazeOffsetX;
            const rawTargetY = eyesMidY + gazeOffsetY;
            
            // Apply exponential smoothing to prevent jitter
            targetLockPos.x = targetLockPos.x * 0.75 + rawTargetX * 0.25;
            targetLockPos.y = targetLockPos.y * 0.75 + rawTargetY * 0.25;
            
            // Clamp to screen bounds
            targetLockPos.x = Math.max(0.02, Math.min(0.98, targetLockPos.x));
            targetLockPos.y = Math.max(0.02, Math.min(0.98, targetLockPos.y));
        }
    } else {
        faceDetected = false;
        physicalMouthPos = null;
    }
}

// Draw rotating sci-fi/gazing Target Lock Reticle
function drawTargetReticle(ctx, x, y) {
    ctx.save();
    
    // Pulse size slightly based on current time
    const pulse = Math.sin(performance.now() * 0.005) * 2;
    const rOuter = 24 + pulse;
    
    ctx.strokeStyle = 'rgba(255, 51, 51, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3333';
    
    // Outer rotating arcs
    const now = performance.now() * 0.002;
    ctx.beginPath();
    ctx.arc(x, y, rOuter, now, now + Math.PI * 0.35);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x, y, rOuter, now + Math.PI, now + Math.PI * 1.35);
    ctx.stroke();
    
    // Inner dashed ring rotating opposite direction
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.6)';
    ctx.shadowColor = '#ff9900';
    ctx.shadowBlur = 6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, 14, -now * 1.3, -now * 1.3 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Central target dot
    ctx.fillStyle = '#ff3333';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Crosshairs lines
    ctx.strokeStyle = 'rgba(255, 51, 51, 0.35)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x - 32, y); ctx.lineTo(x - 16, y);
    ctx.moveTo(x + 16, y); ctx.lineTo(x + 32, y);
    ctx.moveTo(x, y - 32); ctx.lineTo(x, y - 16);
    ctx.moveTo(x, y + 16); ctx.lineTo(x, y + 32);
    ctx.stroke();
    
    ctx.restore();
}

// Separate 60fps smooth render loop
function drawLoop() {
    if (!isCameraRunning) return;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // MIRROR EFFECT
    if (isVideoMirrored) {
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
    }
    
    // Draw raw video feed directly from video tag
    if (videoElement && videoElement.readyState >= 2) {
        canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    }
    
    // Draw Gaze Target Lock Reticle
    if (faceDetected) {
        drawTargetReticle(canvasCtx, targetLockPos.x * canvasElement.width, targetLockPos.y * canvasElement.height);
    }
    
    const theme = THEMES[currentAffinity];
    const isSupercharged = (chakraLevel > 70) || isComboSupercharged;
    
    let handDetected = false;
    let handLandmarks = null;
    
    if (latestResults && latestResults.multiHandLandmarks && latestResults.multiHandLandmarks.length > 0) {
        handDetected = true;
        handLandmarks = latestResults.multiHandLandmarks[0];
    }
    
    // GATHER SPARKS MINI-GAME RENDERING
    if (isExhausted) {
        sparks.forEach((spark) => {
            if (spark.collected) return;
            
            spark.pulse += 0.06;
            const pulseRadius = 15 + Math.sin(spark.pulse) * 4;
            const sx = spark.x * canvasElement.width;
            const sy = spark.y * canvasElement.height;
            
            canvasCtx.save();
            canvasCtx.strokeStyle = theme.color;
            canvasCtx.lineWidth = 3.5;
            
            canvasCtx.beginPath();
            canvasCtx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
            canvasCtx.stroke();
            
            canvasCtx.fillStyle = '#ffffff';
            canvasCtx.beginPath();
            canvasCtx.arc(sx, sy, 5.5, 0, Math.PI * 2);
            canvasCtx.fill();
            
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            canvasCtx.lineWidth = 1.5;
            canvasCtx.beginPath();
            canvasCtx.arc(sx, sy, pulseRadius * 0.65, spark.pulse, spark.pulse + Math.PI * 0.6);
            canvasCtx.stroke();
            
            canvasCtx.restore();
        });
        
        // Find index tip of all hands to render reticles
        if (latestResults && latestResults.multiHandLandmarks && latestResults.multiHandLandmarks.length > 0) {
            latestResults.multiHandLandmarks.forEach(hand => {
                const indexTipPos = hand[8];
                if (indexTipPos) {
                    const hX = indexTipPos.x * canvasElement.width;
                    const hY = indexTipPos.y * canvasElement.height;
                    
                    canvasCtx.save();
                    canvasCtx.strokeStyle = '#00d2ff';
                    canvasCtx.lineWidth = 2;
                    canvasCtx.beginPath();
                    canvasCtx.arc(hX, hY, 20, 0, Math.PI*2);
                    canvasCtx.stroke();
                    
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(hX - 25, hY); canvasCtx.lineTo(hX + 25, hY);
                    canvasCtx.moveTo(hX, hY - 25); canvasCtx.lineTo(hX, hY + 25);
                    canvasCtx.stroke();
                    canvasCtx.restore();
                }
            });
        }
    }
    
    // JUTSU RENDERING FLOW
    if (!isExhausted && activeJutsu !== 'NONE') {
        const handX = lastKnownHandPos.x * canvasElement.width;
        const handY = lastKnownHandPos.y * canvasElement.height;
        
        if (activeJutsu === 'RASENGAN') {
            updateRasenganSound(isSupercharged ? 1.5 : 1.0);
            const radius = (isSupercharged ? 105 : 70) * (handDetected ? getDist(handLandmarks[0], handLandmarks[9]) / 0.15 : 0.85);
            drawRasenganSphere(canvasCtx, handX, handY, radius, isSupercharged);
            
        } else if (activeJutsu === 'CHIDORI') {
            lightningFlash.style.backgroundColor = `rgba(200, 240, 255, ${Math.random() * 0.18})`;
            
            if (handDetected) {
                const wristX = handLandmarks[0].x * canvasElement.width;
                const wristY = handLandmarks[0].y * canvasElement.height;
                
                const fingerTipIndices = [4, 8, 12, 16, 20];
                fingerTipIndices.forEach(idx => {
                    const tipX = handLandmarks[idx].x * canvasElement.width;
                    const tipY = handLandmarks[idx].y * canvasElement.height;
                    drawLightningBolt(canvasCtx, wristX, wristY, tipX, tipY, '#e0f7ff', isSupercharged ? 4.5 : 2.5);
                    drawLightningBolt(canvasCtx, wristX, wristY, tipX, tipY, '#00d2ff', isSupercharged ? 8.5 : 5.5);
                });
                
                if (Math.random() > 0.6) {
                    drawLightningBolt(canvasCtx, wristX, wristY, Math.random() * canvasElement.width, Math.random() > 0.5 ? 0 : canvasElement.height, '#00d2ff', 3);
                }
            } else {
                for (let b = 0; b < (isSupercharged ? 6 : 4); b++) {
                    const targetX = handX + (Math.random() - 0.5) * 160;
                    const targetY = handY + (Math.random() - 0.5) * 160;
                    drawLightningBolt(canvasCtx, handX, handY, targetX, targetY, '#00d2ff', isSupercharged ? 5 : 3);
                }
            }
            
        } else if (activeJutsu === 'FIREBALL') {
            fireGlow.style.boxShadow = `inset 0 0 ${isSupercharged ? '120px' : '70px'} rgba(255, 30, 0, 0.45)`;
            emitFire(handX, handY, isSupercharged);
        }
    }
    
    // Draw Clones for Shadow Clone
    if (activeJutsu === 'SHADOW_CLONE' && cloneData) {
        canvasCtx.globalAlpha = 0.65;
        if (isSupercharged) {
            canvasCtx.drawImage(cloneData, -canvasElement.width / 4, 80, canvasElement.width / 1.8, canvasElement.height / 1.3);
            canvasCtx.drawImage(cloneData, -canvasElement.width / 12, 30, canvasElement.width / 1.5, canvasElement.height / 1.15);
            canvasCtx.drawImage(cloneData, canvasElement.width / 2.5, 30, canvasElement.width / 1.5, canvasElement.height / 1.15);
            canvasCtx.drawImage(cloneData, canvasElement.width * 0.7, 80, canvasElement.width / 1.8, canvasElement.height / 1.3);
        } else {
            canvasCtx.drawImage(cloneData, -canvasElement.width / 6, 60, canvasElement.width / 1.6, canvasElement.height / 1.25);
            canvasCtx.drawImage(cloneData, canvasElement.width / 2.0, 60, canvasElement.width / 1.6, canvasElement.height / 1.25);
        }
        canvasCtx.globalAlpha = 1.0;
    }
    
    // Draw Hand Skeletons & Aura sparks (optimized double-stroke glow)
    if (latestResults && latestResults.multiHandLandmarks && latestResults.multiHandLandmarks.length > 0) {
        latestResults.multiHandLandmarks.forEach(handLandmarks => {
            // 1. Draw glowing transparent back path
            canvasCtx.save();
            canvasCtx.lineWidth = 8.5;
            canvasCtx.globalAlpha = 0.35;
            canvasCtx.lineCap = 'round';
            canvasCtx.lineJoin = 'round';
            canvasCtx.strokeStyle = theme.color;
            
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 1, 2, 3, 4]);
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 5, 6, 7, 8]);
            drawSkeletonPath(canvasCtx, handLandmarks, [9, 10, 11, 12]);
            drawSkeletonPath(canvasCtx, handLandmarks, [5, 9]);
            drawSkeletonPath(canvasCtx, handLandmarks, [13, 14, 15, 16]);
            drawSkeletonPath(canvasCtx, handLandmarks, [9, 13]);
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 17, 18, 19, 20]);
            drawSkeletonPath(canvasCtx, handLandmarks, [13, 17]);
            canvasCtx.restore();
            
            // 2. Draw thin solid white core path
            canvasCtx.save();
            canvasCtx.strokeStyle = '#ffffff';
            canvasCtx.lineWidth = 2.5;
            canvasCtx.globalAlpha = 0.9;
            canvasCtx.lineCap = 'round';
            canvasCtx.lineJoin = 'round';
            
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 1, 2, 3, 4]);
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 5, 6, 7, 8]);
            drawSkeletonPath(canvasCtx, handLandmarks, [9, 10, 11, 12]);
            drawSkeletonPath(canvasCtx, handLandmarks, [13, 14, 15, 16]);
            drawSkeletonPath(canvasCtx, handLandmarks, [0, 17, 18, 19, 20]);
            drawSkeletonPath(canvasCtx, handLandmarks, [5, 9, 13, 17]);
            canvasCtx.restore();
            
            // 3. Draw joint dots
            canvasCtx.save();
            canvasCtx.globalAlpha = 0.95;
            canvasCtx.fillStyle = theme.color;
            for (let i = 0; i < 21; i++) {
                const pt = handLandmarks[i];
                const px = pt.x * canvasElement.width;
                const py = pt.y * canvasElement.height;
                
                canvasCtx.beginPath();
                canvasCtx.arc(px, py, 4.0, 0, Math.PI * 2);
                canvasCtx.fill();
                
                // ONLY emit aura sparks from the 5 fingertips for extreme performance
                const fingertips = [4, 8, 12, 16, 20];
                if (fingertips.includes(i) && pt.x && pt.y) {
                    emitAura(px, py);
                }
            }
            canvasCtx.restore();
        });
    }

    
    // Draw camera & hand tracking diagnostics
    canvasCtx.save();
    if (isVideoMirrored) {
        canvasCtx.translate(canvasElement.width, 0);
        canvasCtx.scale(-1, 1);
    }
    drawDiagnosticsPanel(canvasCtx, handDetected);
    canvasCtx.restore();
    
    updateAndDrawParticles(canvasCtx);
    canvasCtx.restore();
    
    requestAnimationFrame(drawLoop);
}

function drawSkeletonPath(ctx, landmarks, indices) {
    const canvas = ctx.canvas;
    ctx.beginPath();
    for (let i = 0; i < indices.length; i++) {
        const pt = landmarks[indices[i]];
        const px = pt.x * canvas.width; // Align with mirrored coordinate system
        const py = pt.y * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
}

function updateAndDrawParticles(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        p.draw(ctx);
    }
}

// Start Camera and Detector
async function startDojo() {
    initAudio();
    initBlowDetector(); // Start audio analyser for blowing fireball
    resetCombo(); // Reset combo system
    const introScreen = document.getElementById('intro-screen');
    introScreen.style.opacity = '0';
    setTimeout(() => {
        introScreen.style.display = 'none';
    }, 800);
    
    addLogEntry(`Shinobi ${lockedName.toUpperCase()} registered with ${currentAffinity.toUpperCase()} nature.`);
    addLogEntry('Entering Dojo...');
    
    handsDetector = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    handsDetector.setOptions({
        maxNumHands: 2, // Track up to 2 hands simultaneously
        modelComplexity: 1,
        minDetectionConfidence: 0.65,
        minTrackingConfidence: 0.65
    });
    
    handsDetector.onResults(onResults);

    faceDetector = new FaceDetection({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
    });
    
    faceDetector.setOptions({
        model: 'short',
        minDetectionConfidence: 0.55
    });
    
    faceDetector.onResults(onFaceResults);
    
    cameraManager = new Camera(videoElement, {
        onFrame: async () => {
            if (videoElement.videoWidth && videoElement.videoHeight) {
                // Avoid resetting canvas buffer size unless it actually changes
                if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                }
                await Promise.all([
                    handsDetector.send({ image: videoElement }),
                    faceDetector.send({ image: videoElement })
                ]);
            }
        },
        width: 640,
        height: 480,
        facingMode: 'user'
    });
    
    try {
        await cameraManager.start();
        isCameraRunning = true;
        addLogEntry('Camera initialized. Chakra sensors online.');
        statusOverlay.innerText = 'FORM A SEAL';
        
        // Start the 60fps smooth render loop
        if (!isDrawLoopRunning) {
            isDrawLoopRunning = true;
            requestAnimationFrame(drawLoop);
        }
    } catch (err) {
        console.error('Camera failed to start via MediaPipe Camera utility:', err);
        addLogEntry('Error: MediaPipe camera utility failed. Trying fallback native stream...');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            videoElement.srcObject = stream;
            videoElement.play();
            
            isCameraRunning = true;
            addLogEntry('Camera initialized via Fallback API. Chakra sensors online.');
            statusOverlay.innerText = 'FORM A SEAL';
            
            const processFallbackFrames = async () => {
                if (!isCameraRunning) return;
                try {
                    if (videoElement.readyState >= 2 && videoElement.videoWidth && videoElement.videoHeight) {
                        if (canvasElement.width !== videoElement.videoWidth || canvasElement.height !== videoElement.videoHeight) {
                            canvasElement.width = videoElement.videoWidth;
                            canvasElement.height = videoElement.videoHeight;
                        }
                        await Promise.all([
                            handsDetector.send({ image: videoElement }),
                            faceDetector.send({ image: videoElement })
                        ]);
                    }
                } catch (e) {
                    console.error("Error sending fallback frame:", e);
                }
                requestAnimationFrame(processFallbackFrames);
            };
            requestAnimationFrame(processFallbackFrames);
            
            if (!isDrawLoopRunning) {
                isDrawLoopRunning = true;
                requestAnimationFrame(drawLoop);
            }
        } catch (fallbackErr) {
            console.error('Fallback camera failed too:', fallbackErr);
            addLogEntry('Error: Webcam access denied. Check browser permission settings!', true);
            alert('Could not access camera. Please allow camera permissions and refresh!');
        }
    }
}

// Load Jutsu Database and Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    
    // Initialize DOM Cache
    canvasElement = document.getElementById('output_canvas');
    if (canvasElement) {
        canvasCtx = canvasElement.getContext('2d');
    }
    videoElement = document.getElementById('video_input');
    
    // Load 2,900+ Jutsus from the converted json dataset
    fetch('data/jutsus.json')
        .then(response => response.json())
        .then(data => {
            allJutsus = data;
            addLogEntry(`Chakra Library loaded: ${allJutsus.length} Jutsu scrolls parsed.`);
        })
        .catch(err => {
            console.error("Failed to load jutsu database:", err);
            addLogEntry("Error: Failed to load jutsu database.");
        });
        
    // Bind Intro Affinity Selectors (Locked-in mechanism)
    document.querySelectorAll('.chakra-btn-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chakra-btn-select').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            const affinity = e.currentTarget.getAttribute('data-affinity');
            selectAffinity(affinity);
        });
    });
    
    // Bind Register & Start Button
    document.getElementById('btn-start-dojo').addEventListener('click', () => {
        lockedName = document.getElementById('shinobi-name').value.trim() || 'Shinobi';
        
        const selectedBtn = document.querySelector('.chakra-btn-select.selected');
        const affinity = selectedBtn ? selectedBtn.getAttribute('data-affinity') : 'wind';
        selectAffinity(affinity);
        
        lockedNameBadge.innerText = lockedName.toUpperCase();
        lockedNatureBadge.innerText = `${currentAffinity.toUpperCase()} NATURE (LOCKED)`;
        
        // Refresh lock statuses on scroll cards based on starting affinity and level
        updateScrollLocks();
        updateScrollCardNames();
        
        const affSelector = document.querySelector('.affinity-circle-selector');
        if (affSelector) affSelector.style.display = 'none';
        
        const affinityEl = document.querySelector('.panel-content')?.querySelector('[data-affinity]');
        if (affinityEl?.parentElement) affinityEl.parentElement.remove();
        
        // Save initial progress to local storage
        saveShinobiProgress();
        
        startDojo();
    });
    
    // Selection state for equipping
    let selectedLibJutsu = null;
    let selectedLibJutsuNature = null;
    
    // Bind Equip Button click listener
    const equipBtn = document.getElementById('btn-equip-jutsu');
    equipBtn.addEventListener('click', () => {
        if (selectedLibJutsu && selectedLibJutsuNature) {
            equippedJutsuDisplayNames[selectedLibJutsuNature] = selectedLibJutsu.jutsu_name;
            addLogEntry(`Equipped ${selectedLibJutsu.jutsu_name} to ${selectedLibJutsuNature.toUpperCase()} slot.`, true);
            
            // Play confirmation sound
            playSparkSound();
            
            // Refresh scroll names in HUD
            updateScrollCardNames();
            
            // Save equipped jutsu changes to local storage
            saveShinobiProgress();
            
            // UI feedback
            equipBtn.innerText = 'EQUIPPED!';
            equipBtn.disabled = true;
            equipBtn.style.background = 'rgba(0, 210, 255, 0.2)';
            equipBtn.style.borderColor = '#00d2ff';
            setTimeout(() => {
                equipBtn.innerText = 'ALREADY EQUIPPED';
                equipBtn.style.background = 'rgba(255,255,255,0.05)';
                equipBtn.style.borderColor = 'var(--border-color)';
            }, 1200);
        }
    });
    
    // Bind Shinobi Library Search Engine
    libSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        libResults.innerHTML = '';
        
        if (!query) {
            libDetails.style.display = 'none';
            return;
        }
        
        // Filter elements
        const matches = allJutsus.filter(jutsu => 
            jutsu.jutsu_name.toLowerCase().includes(query) ||
            jutsu.jutsu_type.toLowerCase().includes(query)
        ).slice(0, 15);
        
        if (matches.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.fontSize = '0.8rem';
            emptyDiv.style.color = 'var(--text-secondary)';
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.padding = '8px';
            emptyDiv.innerText = 'No matches found.';
            libResults.appendChild(emptyDiv);
            return;
        }
        
        matches.forEach(jutsu => {
            const item = document.createElement('div');
            item.className = 'lib-result-item';
            item.innerText = jutsu.jutsu_name;
            
            item.addEventListener('click', () => {
                libDetailsName.innerText = jutsu.jutsu_name;
                libDetailsType.innerText = `Type: ${jutsu.jutsu_type}`;
                libDetailsDesc.innerText = jutsu.jutsu_description;
                
                // Set seals and equip logic
                selectedLibJutsu = jutsu;
                selectedLibJutsuNature = getJutsuNature(jutsu);
                
                const sealsEl = document.getElementById('lib-details-seals');
                
                if (selectedLibJutsuNature) {
                    sealsEl.innerText = getJutsuSeals(jutsu.jutsu_name, selectedLibJutsuNature);
                    sealsEl.style.display = 'block';
                    
                    const slotJutsuName = selectedLibJutsuNature === 'wind' ? 'RASENGAN' : 
                                         (selectedLibJutsuNature === 'lightning' ? 'CHIDORI' : 
                                         (selectedLibJutsuNature === 'fire' ? 'FIREBALL' : 'SHADOW_CLONE'));
                    
                    const unlocked = isJutsuUnlocked(slotJutsuName);
                    if (unlocked) {
                        equipBtn.disabled = false;
                        equipBtn.style.cursor = 'pointer';
                        equipBtn.style.opacity = '1';
                        
                        // Check if already equipped
                        if (equippedJutsuDisplayNames[selectedLibJutsuNature] === jutsu.jutsu_name) {
                            equipBtn.innerText = 'ALREADY EQUIPPED';
                        } else {
                            equipBtn.innerText = 'EQUIP JUTSU';
                        }
                    } else {
                        equipBtn.disabled = true;
                        equipBtn.style.cursor = 'not-allowed';
                        equipBtn.style.opacity = '0.5';
                        
                        const dist = getAffinityDistance(currentAffinity, selectedLibJutsuNature);
                        const neededRank = dist === 2 ? 'JONIN (Rank 4)' : 'GENIN (Rank 2)';
                        equipBtn.innerText = `🔒 LOCKED (Needs ${neededRank})`;
                    }
                    equipBtn.style.display = 'block';
                } else {
                    sealsEl.innerText = 'Non-elemental Jutsu (Scroll read-only)';
                    sealsEl.style.display = 'block';
                    equipBtn.style.display = 'none';
                }
                
                libDetails.style.display = 'block';
                libDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
            
            libResults.appendChild(item);
        });
    });

    
    // Bind Capture Control Button
    document.getElementById('btn-capture').addEventListener('click', () => {
        const canvasElement = document.getElementById('output_canvas');
        captureSnapshot(canvasElement);
    });
    
    // Bind Mirror View Toggle Button
    const btnMirror = document.getElementById('btn-mirror');
    if (btnMirror) {
        btnMirror.addEventListener('click', () => {
            isVideoMirrored = !isVideoMirrored;
            addLogEntry(`Camera mirror mode set to: ${isVideoMirrored ? 'ON' : 'OFF'}`);
            
            // Give instant feedback on the button
            btnMirror.style.background = isVideoMirrored ? 'rgba(0, 210, 255, 0.15)' : 'rgba(15, 15, 20, 0.85)';
            btnMirror.style.borderColor = isVideoMirrored ? '#00d2ff' : 'var(--border-color)';
        });
    }

    
    // Bind Scroll Cards (Allow user to select training target Jutsu)
    document.querySelectorAll('.scroll-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            const cardJutsu = e.currentTarget.getAttribute('data-jutsu');
            
            // Set training target
            trainingTargetJutsu = cardJutsu;
            
            // Play a sound
            playSparkSound();
            
            // Update active state in UI
            document.querySelectorAll('.scroll-card').forEach(c => c.classList.remove('training-target'));
            e.currentTarget.classList.add('training-target');
            
            addLogEntry(`Tutor target set to ${cardJutsu.replace('_', ' ')}. Form the required hand sign!`, true);
        });
    });
    
    // Bind Spacebar key overrides to blow fireball
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault(); // prevent window scrolling
            if (activeJutsu === 'FIREBALL') {
                isBlowing = true;
                triggerFireballBlast();
            }
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            isBlowing = false;
        }
    });
    
    // Set default theme
    selectAffinity('wind');
    
    // Bind Intro tabs for New Shinobi / Load Scroll
    const tabNew = document.getElementById('tab-new-shinobi');
    const tabLoad = document.getElementById('tab-load-scroll');
    const contentNew = document.getElementById('content-new-shinobi');
    const contentLoad = document.getElementById('content-load-scroll');
    
    if (tabNew && tabLoad && contentNew && contentLoad) {
        tabNew.addEventListener('click', () => {
            tabNew.classList.add('active');
            tabNew.style.color = 'var(--active-chakra)';
            tabNew.style.borderBottom = '2px solid var(--active-chakra)';
            
            tabLoad.classList.remove('active');
            tabLoad.style.color = 'var(--text-secondary)';
            tabLoad.style.borderBottom = '2px solid transparent';
            
            contentNew.style.display = 'block';
            contentLoad.style.display = 'none';
        });
        
        tabLoad.addEventListener('click', () => {
            tabLoad.classList.add('active');
            tabLoad.style.color = 'var(--active-chakra)';
            tabLoad.style.borderBottom = '2px solid var(--active-chakra)';
            
            tabNew.classList.remove('active');
            tabNew.style.color = 'var(--text-secondary)';
            tabNew.style.borderBottom = '2px solid transparent';
            
            contentNew.style.display = 'none';
            contentLoad.style.display = 'block';
            updateSavedProfileUI();
        });
    }
    
    // Check if there is already a saved shinobi scroll to show in UI
    updateSavedProfileUI();
    
    // Bind Load Scroll enter button
    const btnLoadDojo = document.getElementById('btn-load-dojo');
    if (btnLoadDojo) {
        btnLoadDojo.addEventListener('click', () => {
            const loaded = loadShinobiProgress();
            if (loaded) {
                startDojo();
            } else {
                alert("Failed to unseal scroll. Please create a new shinobi.");
            }
        });
    }
});
