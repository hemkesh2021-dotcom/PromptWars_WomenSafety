const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('SOS stays unavailable and fabricated map overlays are absent', () => {
  assert.match(html, /id="sosBtn" disabled/);
  assert.match(html, /No emergency contacts are notified/);
  assert.match(app, /el\.sosBtn\.disabled = true/);
  assert.doesNotMatch(app, /SOS Triggered|Location shared with emergency contacts|Verified Safe Zone|function drawSafeZones|function drawTrafficZones/);
});

test('route reasons do not promise safety and sharing requires a separate service', () => {
  const functions = app.slice(app.indexOf('function buildReason('), app.indexOf('function renderComparison('));
  const context = vm.createContext({ roundOne: n => Math.round(n * 10) / 10 });
  vm.runInContext(functions, context);
  const data = { mode: 'Women Safety Mode', weather: 'Clear', traffic: 'Low' };
  const ctx = { night: { risk: 1, label: 'Night' }, weather: { risk: 0 }, traffic: { risk: 0 } };
  for (const [eta, risk] of [[5, 2], [5, 8], [15, 2]]) {
    const result = context.buildReason({ name: 'Route A', eta, estimatedRisk: risk }, { name: 'Route B', eta: 10, estimatedRisk: 5 }, data, ctx);
    assert.match(result.lineOne, /heuristic/);
    assert.doesNotMatch(result.lineOne, /safety within limits|avoids the higher-risk/);
    assert.match(result.lineTwo, /unvalidated/);
  }
  assert.match(context.buildTip(data, ctx), /separate trusted service/);
});
