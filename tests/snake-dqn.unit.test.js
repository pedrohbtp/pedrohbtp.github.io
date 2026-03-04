// @ts-check
// Minimal Node.js unit tests for the Snake DQN helper functions.
// These run in Node using the built-in `node:test` runner and do not
// require a real TensorFlow.js installation.

const test = require('node:test');
const assert = require('node:assert/strict');

// Provide a very small `tf` stub so that snake-dqn.js can call tf.clone().
global.tf = {
  clone(x) {
    return x;
  },
};

const {
  oneHotState,
  transferWeightsFromGraphModel,
} = require('../js/snake-dqn.js');

test('oneHotState encodes a 12-element binary vector into length-24 one-hot', () => {
  const input = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
  const out = oneHotState(input);

  assert.equal(out.length, 24);
  for (let i = 0; i < 12; i++) {
    const a = out[2 * i];
    const b = out[2 * i + 1];
    // Each pair must be either [1,0] or [0,1]
    assert.strictEqual(a + b, 1, `pair ${i} should sum to 1`);
    if (input[i] === 0) {
      assert.deepEqual([a, b], [1, 0]);
    } else {
      assert.deepEqual([a, b], [0, 1]);
    }
  }
});

test('transferWeightsFromGraphModel handles array-valued weight maps (GraphModel style)', () => {
  // Fake "tensor" objects only need a shape for this test.
  const t = (shape) => ({ shape });

  const graphModel = {
    weights: {
      'model/pi_fc0/w': [t([24, 64])],
      'model/pi_fc0/b': [t([64])],
      'model/pi_fc1/w': [t([64, 64])],
      'model/pi_fc1/b': [t([64])],
      'model/pi/w':     [t([64, 4])],
      'model/pi/b':     [t([4])],
    },
  };

  const received = [];
  const layersModel = {
    setWeights(arr) {
      received.push(...arr);
    },
  };

  const ok = transferWeightsFromGraphModel(graphModel, layersModel);
  assert.equal(ok, true);
  assert.equal(received.length, 6);
  assert.deepEqual(received[0].shape, [24, 64]);
  assert.deepEqual(received[1].shape, [64]);
  assert.deepEqual(received[2].shape, [64, 64]);
  assert.deepEqual(received[3].shape, [64]);
  assert.deepEqual(received[4].shape, [64, 4]);
  assert.deepEqual(received[5].shape, [4]);
});

test('transferWeightsFromGraphModel returns false when required weights missing', () => {
  const graphModel = { weights: {} };
  const layersModel = {
    setWeights() {
      throw new Error('setWeights should not be called when weights are missing');
    },
  };

  const ok = transferWeightsFromGraphModel(graphModel, layersModel);
  assert.equal(ok, false);
});

