// Jest unit tests for the Snake DQN helper functions.
// These run in Node and do not require a real TensorFlow.js installation.

// Provide a very small `tf` stub so that snake-dqn.js can call tf.clone().
global.tf = {
  clone(x) {
    return x;
  },
};

const {
  oneHotState,
  transferWeightsFromGraphModel,
} = require('../../js/snake-dqn.js');

// ── oneHotState ───────────────────────────────────────────────────────────

test('oneHotState encodes a 12-element binary vector into length-24 one-hot', () => {
  const input = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
  const out = oneHotState(input);

  expect(out.length).toBe(24);
  for (let i = 0; i < 12; i++) {
    const a = out[2 * i];
    const b = out[2 * i + 1];
    expect(a + b).toBe(1);
    if (input[i] === 0) {
      expect([a, b]).toEqual([1, 0]);
    } else {
      expect([a, b]).toEqual([0, 1]);
    }
  }
});

test('oneHotState encodes an all-zeros vector correctly', () => {
  const input = new Array(12).fill(0);
  const out = oneHotState(input);

  expect(out.length).toBe(24);
  for (let i = 0; i < 12; i++) {
    expect([out[2 * i], out[2 * i + 1]]).toEqual([1, 0]);
  }
});

test('oneHotState encodes an all-ones vector correctly', () => {
  const input = new Array(12).fill(1);
  const out = oneHotState(input);

  expect(out.length).toBe(24);
  for (let i = 0; i < 12; i++) {
    expect([out[2 * i], out[2 * i + 1]]).toEqual([0, 1]);
  }
});

// ── transferWeightsFromGraphModel ─────────────────────────────────────────

test('transferWeightsFromGraphModel handles array-valued weight maps (GraphModel style)', () => {
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
  expect(ok).toBe(true);
  expect(received.length).toBe(6);
  expect(received[0].shape).toEqual([24, 64]);
  expect(received[1].shape).toEqual([64]);
  expect(received[2].shape).toEqual([64, 64]);
  expect(received[3].shape).toEqual([64]);
  expect(received[4].shape).toEqual([64, 4]);
  expect(received[5].shape).toEqual([4]);
});

test('transferWeightsFromGraphModel returns false when required weights are missing', () => {
  const graphModel = { weights: {} };
  const setWeights = jest.fn();
  const layersModel = { setWeights };

  const ok = transferWeightsFromGraphModel(graphModel, layersModel);
  expect(ok).toBe(false);
  expect(setWeights).not.toHaveBeenCalled();
});
