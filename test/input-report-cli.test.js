import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseResults, parseLine, analyse, toText, toMarkdown, toJson, toCsv, parseArgs, main } from '../src/index.js';

const EX = join(fileURLToPath(import.meta.url), '..', '..', 'examples', 'results.csv');

function sink() {
  let data = '';
  return { write(s) { data += s; }, get text() { return data; } };
}

test('parseResults: good rows, optional cost, every bad row named', () => {
  const r = parseResults('﻿variant,visitors,actions,cost\na,100,5,40\n"b, two",50,0,\n');
  assert.deepEqual(r, [{ variant: 'a', visitors: 100, actions: 5, cost: 40 }, { variant: 'b, two', visitors: 50, actions: 0 }]);
  let msg = '';
  try { parseResults('variant,visitors,actions,cost\n,10,1,\na,0,0,\na,10,11,\nc,10,x,-1\nd,10\n'); } catch (err) { msg = err.message; }
  for (const part of ['line 2: variant is empty', 'line 3: visitors must be a whole number above 0', 'line 4: variant a is listed twice', 'line 4: more actions (11) than visitors (10)', 'line 5: actions must be a whole number', 'line 5: cost must be a number', 'line 6: expected 4 values']) assert.ok(msg.includes(part), part);
  assert.throws(() => parseResults(''), /the file is empty/);
  assert.throws(() => parseResults('variant,visitors\n'), /missing column\(s\) actions/);
  assert.throws(() => parseResults('variant,visitors,actions\n'), /no variants/);
});

test('parseLine: shares and percentages, nothing outside 0 to 1', () => {
  assert.equal(parseLine('0.05'), 0.05);
  assert.equal(parseLine('5%'), 0.05);
  assert.throws(() => parseLine('0'), /between 0 and 1/);
  assert.throws(() => parseLine('105%'), /between 0 and 1/);
  assert.throws(() => parseLine('five'), /between 0 and 1/);
});

test('every format says undecided and the visitors still needed, never a pass', () => {
  const r = analyse([{ variant: '=x', visitors: 180, actions: 4, cost: 90 }], { line: 0.05 });
  assert.match(toText(r), /undecided: about \d+ more visitors needed if the rate holds/);
  assert.match(toMarkdown(r), /undecided: about \d+ more visitors/);
  assert.equal(JSON.parse(toJson(r)).variants[0].verdict, 'undecided');
  assert.match(toCsv(r), /^'=x,180,4,0\.0222,[0-9.]+,[0-9.]+,undecided,\d+,22\.50$/m);
  const on = analyse([{ variant: 'y', visitors: 100, actions: 5 }], { line: 0.05 });
  assert.match(toText(on), /undecided: the rate sits on the line/);
});

test('parseArgs', () => {
  const o = parseArgs(['--results', 'r.csv', '--line', '3%', '--confidence', '99', '--fail-on-fail']);
  assert.equal(o.line, 0.03);
  assert.equal(o.confidence, 99);
  assert.throws(() => parseArgs(['--results', 'r.csv']), /are required/);
  assert.throws(() => parseArgs(['--results', 'r', '--line', '5%', '--confidence', '80']), /90, 95 or 99/);
  assert.throws(() => parseArgs(['--results', 'r', '--line', '5%', '--format', 'xml']), /unknown format/);
  assert.throws(() => parseArgs(['--line']), /needs a value/);
  assert.throws(() => parseArgs(['--nope', 'x']), /unknown option/);
  assert.equal(parseArgs(['--help']).help, true);
});

test('the example, --fail-on-fail, --output and bad input', async (t) => {
  const out = sink();
  assert.equal(await main(['--results', EX, '--line', '5%'], { stdout: out, stderr: sink() }), 0);
  assert.match(out.text, /waitlist +51 of 640 +8\.0%/);
  assert.match(out.text, /passes: even the low end of the range is above the line/);
  assert.match(out.text, /waitlist vs pricing-page: \+3\.2 points/);
  const err = sink();
  assert.equal(await main(['--results', EX, '--line', '12%', '--fail-on-fail'], { stdout: sink(), stderr: err }), 1);
  assert.match(err.text, /failed the line/);
  const d = await mkdtemp(join(tmpdir(), 'dt-'));
  t.after(() => rm(d, { recursive: true, force: true }));
  assert.equal(await main(['--results', EX, '--line', '5%', '--format', 'json', '--output', join(d, 'r.json')], { stdout: sink(), stderr: sink() }), 0);
  assert.equal(JSON.parse(await readFile(join(d, 'r.json'), 'utf8')).variants.length, 3);
  await writeFile(join(d, 'bad.csv'), 'variant,visitors,actions\na,10,20\n');
  const e2 = sink();
  assert.equal(await main(['--results', join(d, 'bad.csv'), '--line', '5%'], { stdout: sink(), stderr: e2 }), 2);
  assert.match(e2.text, /more actions \(20\) than visitors \(10\)/);
  assert.equal(await main(['--results', join(d, 'missing.csv'), '--line', '5%'], { stdout: sink(), stderr: sink() }), 2);
  const help = sink();
  assert.equal(await main(['--help'], { stdout: help, stderr: sink() }), 0);
  assert.match(help.text, /Exit codes/);
});
