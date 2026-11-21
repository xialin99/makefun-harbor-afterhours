import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chrome = process.env.HARBOR_CHROMIUM;
assert(chrome, 'Set HARBOR_CHROMIUM to the Chrome or Chromium executable');
const profile = await mkdtemp(join(tmpdir(), 'harbor-chromium-'));
const root = new URL('../game/', import.meta.url);
const output = new URL('../screenshots/', import.meta.url);
const mime = { html: 'text/html', mjs: 'text/javascript', js: 'text/javascript', css: 'text/css' };
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const name = path === '/' ? 'index.html' : path.slice(1);
  try {
    const file = new URL(name, root);
    assert(file.href.startsWith(root.href));
    const data = await readFile(file, 'utf8');
    response.setHeader('Content-Type', mime[name.split('.').at(-1)] ?? 'text/plain');
    // Read/write state for deterministic checkpoints without shipping a game debug API.
    response.end(name === 'view.mjs' ? data + '\nglobalThis.testWorld = () => w;\n' : data);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = 'http://127.0.0.1:' + server.address().port;
const browser = spawn(chrome, [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--remote-debugging-port=0',
  '--user-data-dir=' + profile, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, description) {
  for (let i = 0; i < 220; i++) {
    const result = await check();
    if (result) return result;
    await delay(90);
  }
  throw new Error('Timed out: ' + description);
}
let socket;
try {
  const port = await until(async () => {
    try { return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; }
    catch { return null; }
  }, 'Chromium startup');
  const tabs = await fetch('http://127.0.0.1:' + port.trim() + '/json/list').then(r => r.json());
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const errors = [];
  const requests = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url);
    const callback = pending.get(message.id);
    if (callback) {
      pending.delete(message.id);
      callback(message);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, message => message.error ? reject(Error(message.error.message)) : resolve(message.result));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const js = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result.value;
  };
  const key = (code, active) => send('Input.dispatchKeyEvent', {
    type: active ? 'rawKeyDown' : 'keyUp', code, key: code.startsWith('Key') ? code[3].toLowerCase() : code,
  });
  const tap = async code => { await key(code, true); await key(code, false); };
  const waitFor = (expression, label) => until(() => js('!!(' + expression + ')'), label);
  const screenshot = async name => {
    if (!process.argv.includes('--capture')) return;
    await send('Page.bringToFront');
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 89, fromSurface: true });
    const bytes = Buffer.from(data, 'base64');
    assert(bytes.length <= 262144);
    await writeFile(new URL(name + '.jpg', output), bytes);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 720, deviceScaleFactor: 1, mobile: false });
  const open = async () => {
    await send('Page.navigate', { url: address });
    await waitFor('globalThis.testWorld && document.querySelector("#mission b")', 'game loads');
    assert.equal(await js('document.querySelectorAll("canvas").length'), 3, '3D view initialized');
  };
  await open();
  if (process.argv.includes('--capture')) await mkdir(output, { recursive: true });
  await js('document.querySelector("#new").click()');
  await waitFor('testWorld().time > .35 && document.querySelector("#mission").textContent.includes("Press E")', 'starter prompt');
  await screenshot('02-marina-on-foot');
  await tap('KeyE');
  await waitFor('testWorld().player.car === 42', 'enter starter coupe');
  await key('KeyW', true);
  await waitFor('testWorld().player.y < 245', 'accelerate through garage approach');
  await key('KeyD', true);
  await waitFor('testWorld().player.a > -.95', 'steer through intersection');
  await key('KeyD', false);
  await key('KeyW', false);
  await key('Space', true);
  await waitFor('Math.abs(testWorld().cars[42].v) < 10', 'brake');
  await key('Space', false);
  await tap('KeyE');
  await waitFor('testWorld().player.car === null', 'exit vehicle');
  console.log('Keyboard enter, accelerate, steer, brake and exit passed.');

  const stage = (x, y, a, car = false) => js(`(() => {
    const w = testWorld();
    Object.assign(w.player, { x: ${x}, y: ${y}, a: ${a}, car: ${car ? 42 : 'null'} });
    if (${car}) Object.assign(w.cars[42], { x: ${x}, y: ${y}, a: ${a}, v: 0, hp: 100 });
  })()`);
  await stage(1560, 600, Math.PI);
  await waitFor('testWorld().notice.includes("Bring a vehicle")', 'first mission requires a car');
  assert.equal(await js('testWorld().mission'), 0);
  await stage(1560, 600, Math.PI, true);
  await waitFor('testWorld().mission === 1 && testWorld().player.cash === 250', 'first payout');
  await stage(1480, 763, 0, true);
  await waitFor('document.querySelector(".district").textContent === "GLASSWORKS"', 'district HUD');
  await key('KeyW', true);
  await waitFor('testWorld().cars[42].v > 50', 'cover shows the car moving');
  await screenshot('03-glassworks-drive');
  await key('KeyW', false);
  await stage(2040, 1800, 0, true);
  await waitFor('testWorld().mission === 2 && testWorld().wanted >= 1 && testWorld().police.length > 0', 'delivery triggers police chase');
  await stage(1937, 2285, Math.PI/2, true);
  await js('Object.assign(testWorld().police[0], { x: 1989, y: 2360, a: -Math.PI/2 })');
  await waitFor('testWorld().police[0].y < 2345', 'police move toward the player');
  await key('KeyW', true);
  await waitFor('testWorld().cars[42].v > 35', 'drive while wanted');
  await screenshot('01-south-docks-pursuit');
  await key('KeyW', false);
  await stage(840, 2040, 0, true);
  await waitFor('testWorld().notice.includes("Lose the police")', 'wanted level blocks handoff');
  assert.equal(await js('testWorld().mission'), 2);
  await js('testWorld().heat = .1; testWorld().policeTimer = 90; testWorld().police.forEach(unit => Object.assign(unit, { x: 2204, y: 2204 }))');
  await waitFor('testWorld().mission === 3 && testWorld().wanted === 0 && testWorld().police.length === 0', 'heat decays and handoff unlocks');
  await tap('F5');
  await waitFor('JSON.parse(localStorage.getItem("harbor-afterhours"))?.mission === 3', 'keyboard save');
  await open();
  await js('document.querySelector("#load").click()');
  await waitFor('testWorld().mission === 3 && testWorld().player.cash === 1400', 'reload and continue');
  assert.equal(await js('testWorld().player.car'), null);
  await stage(840, 2025, Math.PI/2);
  await delay(1250);
  await screenshot('04-signal-house');
  await stage(360, 360, Math.PI / 2);
  await waitFor('testWorld().completed && testWorld().player.cash === 2400', 'final reward and free roam');
  assert.deepEqual(errors, []);
  assert(requests.every(url => url.startsWith(address + '/')), 'game must load entirely from local files');
  console.log('All four missions, police spawning/pursuit/heat, F5 save, reload and offline requests passed.');
} finally {
  socket?.close();
  const exited = new Promise(resolve => browser.once('exit', resolve));
  browser.kill();
  server.closeAllConnections();
  server.close();
  await Promise.race([exited, delay(1500)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 200 });
}
