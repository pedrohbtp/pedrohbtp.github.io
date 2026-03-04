/*
  Snake DQN — in-browser Deep Q-Network training
  Warm-starts from the pre-trained graph model's weights.

  Weight layout in model.json (weightsManifest):
    model/pi_fc0/w  [24, 64]  — first dense kernel  (24 = 12 one-hot pairs)
    model/pi_fc0/b  [64]
    model/pi_fc1/w  [64, 64]  — second dense kernel
    model/pi_fc1/b  [64]
    model/pi/w      [64, 4]   — output kernel
    model/pi/b      [4]

  The DQN layers model mirrors this (same weight shapes) but uses:
    - float32 input of dimension 24 (pre-computed one-hot, see oneHotState())
    - linear output activation (raw Q-values, not softmax)
*/

// ── State encoding ────────────────────────────────────────────────────────────

/**
 * Convert the 12-element binary state vector into a 24-element one-hot vector.
 * Each binary feature i is encoded as [1-v, v]:
 *   feature=0  →  [1, 0]
 *   feature=1  →  [0, 1]
 * This matches the preprocessing the graph model does internally via OneHot ops.
 *
 * @param {number[]} state12  12-element array of 0/1 values from getState()
 * @returns {number[]}        24-element float array
 */
function oneHotState(state12) {
  const out = new Array(24);
  for (let i = 0; i < 12; i++) {
    out[2 * i]     = 1 - state12[i];
    out[2 * i + 1] = state12[i];
  }
  return out;
}

// ── Weight transfer ───────────────────────────────────────────────────────────

/**
 * Copy the six trainable dense-layer weights from the pre-trained GraphModel
 * into a tf.Sequential layers model.
 *
 * Weight shapes are identical between the graph model and the DQN layers model.
 * Only the output activation differs (softmax vs linear) — that is not stored
 * in the weights, so the transfer is lossless.
 *
 * @param {tf.GraphModel}    graphModel   The loaded pre-trained model
 * @param {tf.LayersModel}   layersModel  The DQN sequential model to initialise
 * @returns {boolean}  true on success, false if weight names didn't match
 */
function transferWeightsFromGraphModel(graphModel, layersModel) {
  const gw = graphModel.weights; // NamedTensorMap: {[name]: tf.Tensor}

  // Names in order matching setWeights(): kernel0, bias0, kernel1, bias1, kernel2, bias2
  const names = [
    'model/pi_fc0/w', 'model/pi_fc0/b',
    'model/pi_fc1/w', 'model/pi_fc1/b',
    'model/pi/w',     'model/pi/b',
  ];

  const tensors = names.map(n => gw[n]);
  if (tensors.some(t => t == null)) {
    console.warn('[DQN] Weight transfer: some weights not found. Available keys:',
      Object.keys(gw).join(', '));
    return false;
  }

  // Clone tensors so the graph model retains its own copies
  layersModel.setWeights(tensors.map(t => tf.clone(t)));
  return true;
}

// ── DQN Agent ─────────────────────────────────────────────────────────────────

class DQNAgent {
  /**
   * @param {tf.GraphModel|null} graphModel
   *   Pass the pre-trained graph model to warm-start (transfers weights).
   *   Pass null to train from random initialisation (ε starts at 1.0).
   */
  constructor(graphModel) {
    this.online = this._buildModel();  // trainable online network
    this.target = this._buildModel();  // target network (periodic hard update)

    const transferred = graphModel && transferWeightsFromGraphModel(graphModel, this.online);
    if (transferred) {
      transferWeightsFromGraphModel(graphModel, this.target);
      // Warm-start: already know the basics, so begin mostly exploiting
      this.epsilon = 0.15;
    } else {
      this.epsilon = 1.0;             // cold start: full exploration
    }

    this.epsilonMin   = 0.01;
    this.epsilonDecay = 0.997;        // per episode
    this.gamma        = 0.95;         // discount factor
    this.batchSize    = 32;
    this.memCap       = 10000;
    this.syncEvery    = 100;          // episodes between target network syncs

    this.memory       = [];           // replay buffer: [{s,a,r,ns,done}]
    this._memIdx      = 0;            // circular-buffer write pointer
    this.lastLoss     = 0;

    // Episode stats
    this.episode      = 0;
    this.bestScore    = 0;
    this.scoreHistory = [];
  }

  // ── Network construction ────────────────────────────────────────────────────

  _buildModel() {
    const m = tf.sequential();
    m.add(tf.layers.dense({
      inputShape: [24],       // 24-dim one-hot encoded state
      units: 64,
      activation: 'tanh',
      kernelInitializer: 'glorotUniform',
    }));
    m.add(tf.layers.dense({
      units: 64,
      activation: 'tanh',
      kernelInitializer: 'glorotUniform',
    }));
    m.add(tf.layers.dense({
      units: 4,
      activation: 'linear',  // raw Q-values; NOT softmax
      kernelInitializer: 'glorotUniform',
    }));
    m.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'meanSquaredError',
    });
    return m;
  }

  // ── Action selection ────────────────────────────────────────────────────────

  /**
   * Epsilon-greedy: random with probability ε, greedy otherwise.
   * @param {number[]} state24  24-dim one-hot encoded state
   * @returns {number}  Action index 0–3
   */
  act(state24) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * 4);
    }
    return tf.tidy(() => {
      const t = tf.tensor2d([state24], [1, 24]);
      return this.online.predict(t).argMax(1).dataSync()[0];
    });
  }

  // ── Replay buffer ───────────────────────────────────────────────────────────

  /**
   * Store a transition. Uses a circular buffer once memCap is reached.
   */
  remember(s, a, r, ns, done) {
    const entry = { s, a, r, ns, done };
    if (this.memory.length < this.memCap) {
      this.memory.push(entry);
    } else {
      this.memory[this._memIdx] = entry;
    }
    this._memIdx = (this._memIdx + 1) % this.memCap;
  }

  // ── Training ────────────────────────────────────────────────────────────────

  /**
   * Sample one mini-batch and update the online network with Bellman targets.
   * @returns {Promise<number|null>}  MSE loss for this batch, or null if buffer too small
   */
  async trainBatch() {
    const minBuffer = Math.max(this.batchSize, 64);
    if (this.memory.length < minBuffer) return null;

    const batch = this._sampleBatch();
    const { gamma, batchSize } = this;

    // Build tensors — kept alive across the async trainOnBatch call
    const states     = tf.tensor2d(batch.map(e => e.s),  [batchSize, 24]);
    const nextStates = tf.tensor2d(batch.map(e => e.ns), [batchSize, 24]);

    // Compute Bellman targets synchronously inside tidy (no async needed here)
    const qCurrentData = tf.tidy(() => this.online.predict(states).arraySync());
    const qNextMaxData = tf.tidy(() => this.target.predict(nextStates).max(1).arraySync());

    for (let i = 0; i < batchSize; i++) {
      const bellman = batch[i].done
        ? batch[i].r
        : batch[i].r + gamma * qNextMaxData[i];
      qCurrentData[i][batch[i].a] = bellman;
    }

    const targetTensor = tf.tensor2d(qCurrentData, [batchSize, 4]);

    // Gradient update (async)
    const loss = await this.online.trainOnBatch(states, targetTensor);

    // Dispose all tensors
    states.dispose();
    nextStates.dispose();
    targetTensor.dispose();

    const lossVal = typeof loss === 'number' ? loss
                  : Array.isArray(loss)       ? loss[0]
                  : 0;
    this.lastLoss = lossVal;
    return lossVal;
  }

  // ── Episode bookkeeping ─────────────────────────────────────────────────────

  /**
   * Call once per episode end. Updates epsilon, syncs target network if due.
   * @param {number} episodeScore  Score achieved in the episode
   */
  onEpisodeEnd(episodeScore) {
    this.episode++;
    this.scoreHistory.push(episodeScore);
    if (episodeScore > this.bestScore) this.bestScore = episodeScore;

    // Decay ε per episode
    if (this.epsilon > this.epsilonMin) {
      this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);
    }

    // Hard sync: copy online → target
    if (this.episode % this.syncEvery === 0) {
      this.target.setWeights(this.online.getWeights());
    }
  }

  /**
   * Rolling average score over the last n episodes.
   * @param {number} n
   * @returns {number}
   */
  avgScore(n = 20) {
    const s = this.scoreHistory.slice(-n);
    if (!s.length) return 0;
    return s.reduce((a, b) => a + b, 0) / s.length;
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  dispose() {
    this.online.dispose();
    this.target.dispose();
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _sampleBatch() {
    const batch = [];
    const len = this.memory.length;
    for (let i = 0; i < this.batchSize; i++) {
      batch.push(this.memory[Math.floor(Math.random() * len)]);
    }
    return batch;
  }
}
