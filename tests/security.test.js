const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { server, allowApi } = require('../server');
async function request(url, method = 'GET') {
  const req = { url, method, socket: { remoteAddress: 'test' } };
  return new Promise(resolve => {
    const res = {
      status: 200, headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      writeHead(status, headers) { this.status = status; Object.assign(this.headers, headers); },
      end(body) { resolve({ status: this.status, body: String(body), headers: this.headers }); }
    };
    server.emit('request', req, res);
  });
}
test('only public files can be read', async () => {
  assert.equal((await request('/')).status, 200);
  for (const p of ['/.env', '/server.js', '/package.json', '/.git/config', '/../server.js', '/%2e%2e/server.js', '/app.js/../.env']) {
    assert.equal((await request(p)).status, 404, p);
  }
});
test('rejects methods and invalid parameters before upstream access', async () => {
  assert.equal((await request('/api/route', 'POST')).status, 405);
  assert.equal((await request('/api/weather?lat=91&lng=1')).status, 400);
  assert.equal((await request('/api/geocode?q=a&q=b')).status, 400);
  assert.equal((await request('/api/directions?departure_time=1%26key%3Dother')).status, 400);
});
test('rate limits a client without trusting headers', () => {
  for (let i = 0; i < 30; i++) assert.equal(allowApi('rate-test'), true);
  assert.equal(allowApi('rate-test'), false);
});
