/*
Game interface from Learn Web Development
Youtube channel : https://www.youtube.com/channel/UC8n8ftV94ZU_DJLOLtrpORA

AI code from Pedro Borges Torres @pedrohbtp
*/
const cvs = document.getElementById("snake");
const ctx = cvs.getContext("2d");

// Canvas dimensions
const canvasSize = 380;
const proportion = 19;
const box = Math.floor(canvasSize / proportion); // 20px

// Board limits (in grid units)
let boardLimitXMax = 17;
let boardLimitXMin = 1;
let boardLimitYMax = 17;
let boardLimitYMin = 3;

// Palette matching the site design system
const COLOR_BG        = '#0F1923';
const COLOR_GRID      = 'rgba(255, 255, 255, 0.04)';
const COLOR_HEAD      = '#7EC8E3';  // site hero tagline cyan
const COLOR_BODY      = '#4A7FA5';  // site link colour
const COLOR_BODY_MID  = '#3A6A8F';  // subtle mid-tone for body gradient
const COLOR_FOOD      = '#FC8181';  // coral/red for contrast

// AI model
let model = null;
// Snake segments
let snake = [];
// Food position
let food;
// Score
let score;
// Current direction
let d;
// Game interval handle
let game = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(text, cls) {
    const el = document.getElementById('snake-status');
    if (el) {
        el.textContent = text;
        el.className = 'snake-status ' + cls;
    }
}

function setScore(val) {
    const el = document.getElementById('snake-score');
    if (el) el.textContent = val;
}

/** Draw a filled rounded rectangle on ctx. */
function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

// ── Drawing ───────────────────────────────────────────────────────────────────

function drawBackground() {
    // Dark fill
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Subtle grid
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= proportion; i++) {
        ctx.beginPath();
        ctx.moveTo(i * box, 0);
        ctx.lineTo(i * box, canvasSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * box);
        ctx.lineTo(canvasSize, i * box);
        ctx.stroke();
    }

    // Score label in top margin
    ctx.fillStyle = 'rgba(144,164,190,0.5)';
    ctx.font = '600 11px Inter, DM Sans, sans-serif';
    ctx.fillText('SCORE', box * boardLimitXMin, box * 1.5);
}

function drawFood() {
    const cx = food.x + box / 2;
    const cy = food.y + box / 2;
    const r  = box / 2 - 3;

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 6);
    glow.addColorStop(0, 'rgba(252,129,129,0.4)');
    glow.addColorStop(1, 'rgba(252,129,129,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = COLOR_FOOD;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
}

function addSnakeSegment() {
    const inset = 2;
    const radius = 4;
    const segW = box - inset * 2;
    const segH = box - inset * 2;

    for (let i = snake.length - 1; i >= 0; i--) {
        const isHead = i === 0;

        // Fade body segments slightly toward the tail
        if (isHead) {
            ctx.fillStyle = COLOR_HEAD;
        } else {
            // Interpolate between body colour and a darker shade near the tail
            const t = i / (snake.length - 1 || 1);
            ctx.fillStyle = t < 0.5 ? COLOR_BODY : COLOR_BODY_MID;
        }

        roundRect(
            snake[i].x + inset,
            snake[i].y + inset,
            segW,
            segH,
            radius
        );

        // Eyes on the head
        if (isHead) {
            ctx.fillStyle = COLOR_BG;
            const eyeR = 2;
            const eyeOffset = box * 0.28;
            let eye1x, eye1y, eye2x, eye2y;

            if (d === 'RIGHT') {
                eye1x = snake[i].x + box - 6; eye1y = snake[i].y + eyeOffset;
                eye2x = snake[i].x + box - 6; eye2y = snake[i].y + box - eyeOffset;
            } else if (d === 'LEFT') {
                eye1x = snake[i].x + 6; eye1y = snake[i].y + eyeOffset;
                eye2x = snake[i].x + 6; eye2y = snake[i].y + box - eyeOffset;
            } else if (d === 'UP') {
                eye1x = snake[i].x + eyeOffset;     eye1y = snake[i].y + 6;
                eye2x = snake[i].x + box - eyeOffset; eye2y = snake[i].y + 6;
            } else {
                eye1x = snake[i].x + eyeOffset;     eye1y = snake[i].y + box - 6;
                eye2x = snake[i].x + box - eyeOffset; eye2y = snake[i].y + box - 6;
            }

            ctx.beginPath(); ctx.arc(eye1x, eye1y, eyeR, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eye2x, eye2y, eyeR, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// ── Game logic ────────────────────────────────────────────────────────────────

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}

function draw() {
    drawBackground();
    addSnakeSegment();
    drawFood();

    // Move head
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d === 'LEFT')  snakeX -= box;
    if (d === 'UP')    snakeY -= box;
    if (d === 'RIGHT') snakeX += box;
    if (d === 'DOWN')  snakeY += box;

    // Eat food
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        setScore(score);
        food = {
            x: Math.floor(Math.random() * 17 + 1) * box,
            y: Math.floor(Math.random() * 15 + 3) * box
        };
    } else {
        snake.pop();
    }

    const newHead = { x: snakeX, y: snakeY };

    // Game over
    if (
        snakeX < boardLimitXMin * box || snakeX > boardLimitXMax * box ||
        snakeY < boardLimitYMin * box || snakeY > boardLimitYMax * box ||
        collision(newHead, snake)
    ) {
        clearInterval(game);
        setStatus('Game Over', 'over');
        // Draw a subtle overlay
        ctx.fillStyle = 'rgba(15, 25, 35, 0.6)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.fillStyle = '#FC8181';
        ctx.font = 'bold 22px Inter, DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvasSize / 2, canvasSize / 2 - 10);
        ctx.fillStyle = 'rgba(144,164,190,0.8)';
        ctx.font = '13px Inter, DM Sans, sans-serif';
        ctx.fillText('Press Reset to play again', canvasSize / 2, canvasSize / 2 + 18);
        ctx.textAlign = 'left';
        return;
    }

    snake.unshift(newHead);
}

function getState() {
    // Axes are inverted to match training convention
    let snakeY = snake[0].x;
    let snakeX = snake[0].y;
    let isBoardLeft  = snakeX <= (boardLimitXMin + 1) * box;
    let isBoardRight = snakeX >= (boardLimitXMax - 1) * box;
    let isBoardUp    = snakeY <= (boardLimitYMin + 1) * box;
    let isBoardDown  = snakeY >= (boardLimitYMax - 1) * box;

    const dict_rep = {
        'is_food_left':    snake[0].y > food.y,
        'is_food_right':   snake[0].y < food.y,
        'is_food_up':      snake[0].x > food.x,
        'is_food_down':    snake[0].x < food.x,
        'is_moving_left':  d === 'LEFT',
        'is_moving_right': d === 'RIGHT',
        'is_moving_up':    d === 'UP',
        'is_moving_down':  d === 'DOWN',
        'is_danger_left':  isBoardLeft,
        'is_danger_right': isBoardRight,
        'is_danger_up':    isBoardUp,
        'is_danger_down':  isBoardDown
    };

    const list_resp = [];
    for (const i in dict_rep) {
        list_resp.push(dict_rep[i] === true ? 1 : 0);
    }
    return list_resp;
}

function init() {
    clearInterval(game);
    score = 0;
    setScore(0);
    setStatus('Running', 'running');

    d = 'RIGHT';

    snake[0] = { x: 9 * box, y: 10 * box };
    snake[1] = { x: 8 * box, y: 9  * box };
    snake[2] = { x: 7 * box, y: 8  * box };
    snake.length = 3;

    food = {
        x: Math.floor(Math.random() * 17 + 1) * box,
        y: Math.floor(Math.random() * 15 + 3) * box
    };

    game = setInterval(predictAndDraw, 90);
}

async function predictAndDraw() {
    const state  = getState();
    const a      = tf.tensor2d([state], [1, 12], 'int32');
    const preResp = await model.predict(a).array();

    let indexes = preResp[0]
        .map((val, ind) => ({ ind, val }))
        .sort((a, b) => a.val - b.val)
        .map((obj) => obj.ind);

    let actionIndex = indexes[indexes.length - 1];

    // Avoid reversing direction
    if (
        (actionIndex === 0 && d === 'LEFT')  ||
        (actionIndex === 1 && d === 'RIGHT') ||
        (actionIndex === 2 && d === 'DOWN')  ||
        (actionIndex === 3 && d === 'UP')
    ) {
        actionIndex = indexes[indexes.length - 2];
    }

    if      (actionIndex === 0) d = 'RIGHT';
    else if (actionIndex === 1) d = 'LEFT';
    else if (actionIndex === 2) d = 'UP';
    else if (actionIndex === 3) d = 'DOWN';

    draw();
}

const MODEL_HTTP_URL = 'snake/model.json';

async function fetchModel() {
    try {
        const model = await tf.loadGraphModel(
            window.location.href.split('snake-rl')[0] + 'snake-rl/' + MODEL_HTTP_URL
        );
        return model;
    } catch (error) {
        console.error(error);
    }
}

fetchModel().then(modelResp => {
    model = modelResp;
    switchMode('watch');
});

// ── Training mode — state ─────────────────────────────────────────────────────

let currentMode    = 'watch';   // 'watch' | 'train'
let dqnAgent       = null;
let trainGame      = null;      // training setInterval handle
let trainScore     = 0;         // score for the current training episode
let trainStepCount = 0;         // steps elapsed this episode
let trainEpReward  = 0;         // cumulative reward this episode
let trainBatchBusy = false;     // guard: at most one trainBatch in flight
let speedMult      = 1;         // interval multiplier (1–5)

// ── Mode switching ────────────────────────────────────────────────────────────

function switchMode(newMode) {
    clearInterval(game);
    clearInterval(trainGame);
    game = null;
    trainGame = null;

    currentMode = newMode;

    const btnWatch   = document.getElementById('btn-mode-watch');
    const btnTrain   = document.getElementById('btn-mode-train');
    const speedCtrl  = document.getElementById('speed-control');
    const trainBar   = document.getElementById('train-status-bar');
    const watchInfo  = document.getElementById('watch-info');
    const trainPanel = document.getElementById('train-metrics');

    if (btnWatch)   btnWatch.classList.toggle('active', newMode === 'watch');
    if (btnTrain)   btnTrain.classList.toggle('active', newMode === 'train');
    if (speedCtrl)  speedCtrl.style.display  = newMode === 'train' ? 'flex'  : 'none';
    if (trainBar)   trainBar.style.display   = newMode === 'train' ? 'flex'  : 'none';
    if (watchInfo)  watchInfo.style.display  = newMode === 'watch' ? 'block' : 'none';
    if (trainPanel) trainPanel.style.display = newMode === 'train' ? 'block' : 'none';

    if (newMode === 'watch') {
        if (dqnAgent) { dqnAgent.dispose(); dqnAgent = null; }
        resetMetricsDisplay();
        init();
    } else {
        setStatus('Running', 'running');
        setTrainStatus('training', 'Training in progress…');
        dqnAgent = new DQNAgent(model);   // warm-start from pre-trained weights
        initTrainGameState();
        startTrainLoop();
    }
}

function onResetClick() {
    if (currentMode === 'watch') {
        init();
    } else {
        clearInterval(trainGame);
        trainGame = null;
        if (dqnAgent) { dqnAgent.dispose(); dqnAgent = null; }
        dqnAgent = new DQNAgent(model);
        resetMetricsDisplay();
        setStatus('Running', 'running');
        initTrainGameState();
        startTrainLoop();
    }
}

function onSpeedChange(val) {
    speedMult = parseInt(val, 10);
    const lbl = document.getElementById('speed-label');
    if (lbl) lbl.textContent = val + '×';
    if (currentMode === 'train' && trainGame !== null) {
        clearInterval(trainGame);
        startTrainLoop();
    }
}

function startTrainLoop() {
    const ms = Math.max(15, Math.floor(90 / speedMult));
    trainGame = setInterval(runTrainStep, ms);
}

// ── Training game state ───────────────────────────────────────────────────────

function initTrainGameState() {
    trainScore     = 0;
    trainStepCount = 0;
    trainEpReward  = 0;
    setScore(0);
    setStatus('Running', 'running');

    d = 'RIGHT';
    snake[0] = { x: 9 * box, y: 10 * box };
    snake[1] = { x: 8 * box, y:  9 * box };
    snake[2] = { x: 7 * box, y:  8 * box };
    snake.length = 3;

    food = {
        x: Math.floor(Math.random() * 17 + 1) * box,
        y: Math.floor(Math.random() * 15 + 3) * box
    };
}

// ── Training step ─────────────────────────────────────────────────────────────

let _stepRunning = false;

function runTrainStep() {
    if (_stepRunning || !dqnAgent) return;
    _stepRunning = true;

    // 1. Observe state, select action
    const state12 = getState();
    const state24 = oneHotState(state12);
    const action  = dqnAgent.act(state24);

    // 2. Apply action to current direction
    applyTrainAction(action);

    // 3. Step game, get outcome
    const { ateFood, gameOver } = trainDraw();

    // 4. Update score
    if (ateFood) {
        trainScore++;
        setScore(trainScore);
    }

    // 5. Compute reward
    const reward = gameOver ? -10 : ateFood ? 10 : -0.01;
    trainEpReward += reward;
    trainStepCount++;

    // 6. Store transition
    const nextState12 = getState();
    const nextState24 = oneHotState(nextState12);
    dqnAgent.remember(state24, action, reward, nextState24, gameOver);

    // 7. Train one batch (fire-and-forget, at most one in flight)
    if (!trainBatchBusy) {
        trainBatchBusy = true;
        dqnAgent.trainBatch().then(loss => {
            trainBatchBusy = false;
        }).catch(err => {
            console.error('[DQN]', err);
            trainBatchBusy = false;
        });
    }

    // 8. Update UI metrics
    updateMetrics();

    if (gameOver) {
        // Episode ended
        dqnAgent.onEpisodeEnd(trainScore);
        updateMetrics();
        updateScoreChart();
        // Pause briefly so the user can see the overlay, then start a new episode
        setTimeout(() => {
            if (currentMode === 'train') {
                initTrainGameState();
                _stepRunning = false;
            }
        }, 350);
    } else {
        _stepRunning = false;
    }
}

// ── Direction helper ──────────────────────────────────────────────────────────

/**
 * Apply a DQN action index to direction d, preventing direct reversal.
 * Action mapping (same convention as predictAndDraw):
 *   0 = RIGHT, 1 = LEFT, 2 = UP, 3 = DOWN
 */
function applyTrainAction(actionIndex) {
    if (actionIndex === 0 && d === 'LEFT')  return;
    if (actionIndex === 1 && d === 'RIGHT') return;
    if (actionIndex === 2 && d === 'DOWN')  return;
    if (actionIndex === 3 && d === 'UP')    return;

    if      (actionIndex === 0) d = 'RIGHT';
    else if (actionIndex === 1) d = 'LEFT';
    else if (actionIndex === 2) d = 'UP';
    else if (actionIndex === 3) d = 'DOWN';
}

// ── Training draw (shared canvas, returns outcome) ────────────────────────────

/**
 * Variant of draw() for training mode.
 * Renders the current frame and advances game state.
 * Does NOT call clearInterval or show the persistent game-over screen.
 *
 * @returns {{ ateFood: boolean, gameOver: boolean }}
 */
function trainDraw() {
    drawBackground();
    addSnakeSegment();
    drawFood();

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (d === 'LEFT')  snakeX -= box;
    if (d === 'UP')    snakeY -= box;
    if (d === 'RIGHT') snakeX += box;
    if (d === 'DOWN')  snakeY += box;

    let ateFood = false;
    if (snakeX === food.x && snakeY === food.y) {
        ateFood = true;
        food = {
            x: Math.floor(Math.random() * 17 + 1) * box,
            y: Math.floor(Math.random() * 15 + 3) * box
        };
    } else {
        snake.pop();
    }

    const newHead = { x: snakeX, y: snakeY };

    const gameOver = (
        snakeX < boardLimitXMin * box || snakeX > boardLimitXMax * box ||
        snakeY < boardLimitYMin * box || snakeY > boardLimitYMax * box ||
        collision(newHead, snake)
    );

    if (gameOver) {
        // Brief episode-end overlay (auto-cleared when next episode starts)
        ctx.fillStyle = 'rgba(15, 25, 35, 0.65)';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.fillStyle = '#7EC8E3';
        ctx.font = 'bold 15px Inter, DM Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Episode ' + ((dqnAgent ? dqnAgent.episode : 0) + 1), canvasSize / 2, canvasSize / 2 - 10);
        ctx.fillStyle = 'rgba(144,164,190,0.85)';
        ctx.font = '12px Inter, DM Sans, sans-serif';
        ctx.fillText('Score: ' + trainScore, canvasSize / 2, canvasSize / 2 + 12);
        ctx.textAlign = 'left';
        return { ateFood, gameOver: true };
    }

    snake.unshift(newHead);
    return { ateFood, gameOver: false };
}

// ── Metrics UI ────────────────────────────────────────────────────────────────

function updateMetrics() {
    if (!dqnAgent) return;
    const g = id => document.getElementById(id);

    const ep  = g('m-episode');  if (ep)  ep.textContent  = dqnAgent.episode;
    const bst = g('m-best');     if (bst) bst.textContent = dqnAgent.bestScore;
    const avg = g('m-avg');      if (avg) avg.textContent = dqnAgent.avgScore(20).toFixed(1);
    const eps = g('m-epsilon');  if (eps) eps.textContent = dqnAgent.epsilon.toFixed(3);
    const rwd = g('m-reward');   if (rwd) rwd.textContent = trainEpReward.toFixed(1);
    const stp = g('m-steps');    if (stp) stp.textContent = trainStepCount;
    const lss = g('m-loss');
    if (lss) lss.textContent = dqnAgent.lastLoss ? dqnAgent.lastLoss.toFixed(4) : '—';

    const bufBar = g('m-buffer-bar');
    const bufTxt = g('m-buffer');
    if (bufBar || bufTxt) {
        const pct = Math.round((dqnAgent.memory.length / dqnAgent.memCap) * 100);
        if (bufTxt) bufTxt.textContent = dqnAgent.memory.length.toLocaleString() + ' / 10 000';
        if (bufBar) bufBar.style.width = pct + '%';
    }
}

function resetMetricsDisplay() {
    ['m-episode','m-best','m-avg','m-epsilon','m-reward','m-steps','m-loss'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '—';
    });
    const bar = document.getElementById('m-buffer-bar');
    if (bar) bar.style.width = '0%';
    const buf = document.getElementById('m-buffer');
    if (buf) buf.textContent = '0 / 10 000';
    const chart = document.getElementById('score-chart');
    if (chart) chart.getContext('2d').clearRect(0, 0, chart.width, chart.height);
}

// ── Score sparkline ───────────────────────────────────────────────────────────

function updateScoreChart() {
    const canvas = document.getElementById('score-chart');
    if (!canvas || !dqnAgent || dqnAgent.scoreHistory.length < 2) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const c  = canvas.getContext('2d');
    const history = dqnAgent.scoreHistory.slice(-60);

    c.clearRect(0, 0, cw, ch);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(0, 0, cw, ch);

    const maxScore = Math.max(...history, 1);
    const pad  = 4;
    const stepX = cw / (history.length - 1);
    const pts = history.map((s, i) => ({
        x: i * stepX,
        y: ch - pad - (s / maxScore) * (ch - 2 * pad),
    }));

    // Gradient fill
    const grad = c.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, 'rgba(126,200,227,0.35)');
    grad.addColorStop(1, 'rgba(126,200,227,0)');

    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.lineTo(pts[pts.length - 1].x, ch);
    c.lineTo(pts[0].x, ch);
    c.closePath();
    c.fillStyle = grad;
    c.fill();

    // Line
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.strokeStyle = '#7EC8E3';
    c.lineWidth = 1.5;
    c.stroke();
}

// ── Training status bar ───────────────────────────────────────────────────────

function setTrainStatus(type, text) {
    const bar  = document.getElementById('train-status-bar');
    const icon = document.getElementById('train-status-icon');
    const txt  = document.getElementById('train-status-text');
    if (!bar) return;

    bar.className = 'snake-train-status'
        + (type === 'paused' ? ' paused' : type === 'error' ? ' error' : '');
    if (icon) icon.innerHTML =
        type === 'training' ? '&#9654;' :
        type === 'paused'   ? '&#9646;&#9646;' : '&#10006;';
    if (txt) txt.textContent = text;
}

// ── Education section toggles ─────────────────────────────────────────────────

function toggleEdu(id) {
    const body = document.getElementById(id);
    const btn  = body && body.previousElementSibling;
    if (!body || !btn) return;

    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    btn.setAttribute('aria-expanded', String(!isOpen));
}
