import test from 'node:test';
import assert from 'node:assert/strict';
import { Z, wilson, visitorsNeeded, difference, judge, analyse, failed } from '../src/index.js';

const near = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} is not near ${b}`);

test('wilson: known values and edges', () => {
  // 0 of 10 at 95%: the textbook upper bound is 0.2775
  const w0 = wilson(0, 10, Z[95]);
  near(w0.low, 0);
  near(w0.high, 0.2775);
  // 10 of 10 mirrors it
  near(wilson(10, 10, Z[95]).low, 1 - 0.2775);
  // 5 of 10: symmetric around one half
  const w5 = wilson(5, 10, Z[95]);
  near(w5.low + w5.high, 1);
  assert.deepEqual(wilson(0, 0, Z[95]), { low: 0, high: 1 });
  // a wider confidence gives a wider range
  assert.ok(wilson(20, 400, Z[99]).high > wilson(20, 400, Z[90]).high);
});

test('visitorsNeeded: grows as the rate nears the line, null on the line', () => {
  const far = visitorsNeeded(0.08, 0.05, Z[95]);
  const near5 = visitorsNeeded(0.06, 0.05, Z[95]);
  assert.ok(near5 > far, `${near5} > ${far}`);
  assert.equal(visitorsNeeded(0.05, 0.05, Z[95]), null);
  const n = visitorsNeeded(0.08, 0.05, Z[95]);
  const w = wilson(Math.round(0.08 * n), n, Z[95]);
  assert.ok(w.low > 0.05, 'at the returned size the same rate passes');
});

test('judge: passes, fails, undecided with visitors still needed, cost per action', () => {
  const pass = judge({ variant: 'a', visitors: 1000, actions: 100 }, 0.05, Z[95]);
  assert.equal(pass.verdict, 'passes');
  assert.equal(pass.moreVisitors, null);
  const fail = judge({ variant: 'b', visitors: 1000, actions: 10 }, 0.05, Z[95]);
  assert.equal(fail.verdict, 'fails');
  const und = judge({ variant: 'c', visitors: 180, actions: 4, cost: 90 }, 0.05, Z[95]);
  assert.equal(und.verdict, 'undecided');
  assert.ok(und.moreVisitors > 0);
  near(und.costPerAction, 22.5);
  assert.equal(judge({ variant: 'd', visitors: 50, actions: 0, cost: 10 }, 0.05, Z[95]).costPerAction, null);
  assert.equal(judge({ variant: 'e', visitors: 50, actions: 5 }, 0.05, Z[95]).costPerAction, undefined);
});

test('difference: the range includes zero when the variants are close', () => {
  const close = difference({ visitors: 500, actions: 30 }, { visitors: 500, actions: 28 }, Z[95]);
  assert.ok(close.low < 0 && close.high > 0);
  const clear = difference({ visitors: 2000, actions: 200 }, { visitors: 2000, actions: 100 }, Z[95]);
  near(clear.diff, 0.05);
  assert.ok(clear.low > 0);
});

test('analyse: every pair compared, a leader only when the range excludes zero', () => {
  const r = analyse([{ variant: 'a', visitors: 2000, actions: 200 }, { variant: 'b', visitors: 2000, actions: 100 }, { variant: 'c', visitors: 2000, actions: 98 }], { line: 0.04 });
  assert.equal(r.confidence, 95);
  assert.deepEqual(r.pairs.map((p) => [p.a, p.b, p.lead]), [['a', 'b', 'a'], ['a', 'c', 'a'], ['b', 'c', null]]);
  assert.deepEqual(failed(r), []);
  const f = analyse([{ variant: 'x', visitors: 1000, actions: 5 }], { line: 0.05, confidence: 99 });
  assert.deepEqual(failed(f).map((v) => v.variant), ['x']);
});
