// node test-crouch.mjs — física e combate reais, sem navegador/Cloudflare.
import assert from 'node:assert/strict';
import test from 'node:test';
import { CROUCH, stanceHeight, eyeHeight, stepCrouch } from './shared/stance.js';
import { createPhysics, rayHitboxes } from './shared/physics.js';
import { bodyClosest, explosionHits, rayCapsule } from './shared/combat.js';
import { meleeHit } from './shared/melee.js';
import { Game } from './server/src/game.js';

const pos = (x = 0, y = 0, z = 0) => ({ x, y, z });
const entity = (crouch = 0) => ({ pos: pos(), vel: pos(), crouch, onGround: true, alive: true });
const empty = () => createPhysics([], [20, 20]);
const roof = { min: pos(-2, 1.4, -2), max: pos(2, 2, 2) };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);

test('transição gradual: pés fixos, câmera e colisão descem juntas', () => {
  const e = entity(), p = empty();
  stepCrouch(e, 1, 0.05, p);
  close(e.crouch, 0.25);
  assert.ok(stanceHeight(e) > 1.3 && stanceHeight(e) < 2);
  close(eyeHeight(e) / stanceHeight(e), 0.8);
  stepCrouch(e, 1, CROUCH.duration, p);
  close(stanceHeight(e), 1.3); close(eyeHeight(e), 1.04);
  assert.deepEqual(e.pos, pos());
  stepCrouch(e, 0, 0.05, p); close(e.crouch, 0.75);
  stepCrouch(e, 0, CROUCH.duration, p); close(e.crouch, 0);
});

test('passa sob teto agachado; não levanta nem é expulso pela colisão', () => {
  const p = createPhysics([roof], [20, 20]), e = entity(1);
  assert.ok(p.collides(0, 0, 0));
  assert.equal(p.collides(0, 0, 0, stanceHeight(e)), false);
  stepCrouch(e, 0, 0.2, p); close(e.crouch, 1);
  e.vel.x = 2; p.moveEntity(e, 0.1);
  close(e.pos.x, 0.2); close(e.pos.y, 0);
  e.pos.x = 3; stepCrouch(e, 0, 0.2, p); close(e.crouch, 0);
});

test('salto agachado respeita o teto e paredes continuam sólidas', () => {
  const p = createPhysics([roof], [20, 20]), e = entity(1);
  e.vel.y = 8.5; e.onGround = false; p.moveEntity(e, 0.05);
  assert.ok(e.pos.y + stanceHeight(e) <= roof.min.y + 1e-8);
  assert.equal(e.vel.y, 0); assert.equal(e.bonk, true);
  const wall = { min: pos(1, 0, -2), max: pos(1.1, 5, 2) };
  const w = entity(1); w.vel.x = 10;
  createPhysics([wall], [20, 20]).moveEntity(w, 0.1);
  assert.ok(w.pos.x < 1 - 0.42);
});

test('tiro passa acima do agachado e ainda acerta cabeça/corpo na nova altura', () => {
  const dir = pos(0, 0, 1);
  assert.ok(rayHitboxes(pos(0, 1.8, -5), dir, pos(), 0)?.head);
  assert.equal(rayHitboxes(pos(0, 1.8, -5), dir, pos(), 1), null);
  assert.equal(rayHitboxes(pos(0, 1.2, -5), dir, pos(), 1)?.head, true);
  assert.equal(rayHitboxes(pos(0, 0.45, -5), dir, pos(), 1)?.head, false);
  // A hitbox já começa a baixar no meio da animação.
  assert.ok(rayHitboxes(pos(0, 1.8, -5), dir, pos(), 0));
  assert.equal(rayHitboxes(pos(0, 1.8, -5), dir, pos(), 0.5), null);
  const tilted = pos(0, -0.1, 1), L = Math.hypot(tilted.y, tilted.z);
  assert.ok(rayHitboxes(pos(0, 1.5, -5), pos(0, tilted.y / L, tilted.z / L), pos(), 1));
});

test('foguete e distância de explosão usam a cápsula abaixada', () => {
  const o = pos(0, 1.8, -5), dir = pos(0, 0, 1);
  assert.notEqual(rayCapsule(o, dir, 10, pos()), null);
  assert.equal(rayCapsule(o, dir, 10, pos(), 0, 1), null);
  assert.notEqual(rayCapsule(pos(0, 0.9, -5), dir, 10, pos(), 0.15, 1), null);
  close(bodyClosest(pos(0, 2, 0), pos(), 1).d, 2 - (1.5 + 0.58) * 0.65);
  // Explosão sobre uma mureta: o agachado fica totalmente protegido.
  const blast = { radius: 5, maxDmg: 120, selfMul: 0.4, knock: 0, lift: 0 };
  const los = (a, b) => { const t = (1.5 - a.x) / (b.x - a.x); return a.y + (b.y - a.y) * t > 1.2; };
  assert.equal(explosionHits(pos(3, 0.2), blast, [entity(0)], los).length, 1);
  assert.equal(explosionHits(pos(3, 0.2), blast, [entity(1)], los).length, 0);
});

test('faca respeita o corpo abaixado e a postura histórica recebida', () => {
  const e = entity(1), target = { e, p: e.pos, yaw: 0 };
  assert.ok(meleeHit(pos(0, 0.8, -1.2), pos(0, 0, 1), 'slash', [target]));
  const down = pos(0, -Math.SQRT1_2, Math.SQRT1_2);
  assert.equal(meleeHit(pos(0, 3.2, -1), down, 'slash', [target]), null);
  assert.ok(meleeHit(pos(0, 3.2, -1), down, 'slash', [{ ...target, crouch: 0 }]));
});

function game() {
  const messages = [];
  const g = new Game({ code: 'TEST', max: 2, fillBots: false }, {
    send() {}, broadcast(m) { messages.push(m); }, startLoop() {}, stopLoop() {}, saveCfg() {},
  });
  const a = g.join({ name: 'Ana', primary: 0 }).ent;
  const b = g.join({ name: 'Beto', primary: 0 }).ent;
  g.startMatch('arena');
  g.P = empty(); g.map = { size: [20, 20] }; g.pickups = [];
  for (const e of [a, b]) { e.pos = pos(); e.vel = pos(); e.invulnUntil = 0; e.hist = []; }
  return { g, a, b, messages };
}

test('servidor limita a transição e aceita posição sob teto só agachado', () => {
  const { g, a } = game(); let now = 100; g.now = () => now;
  a.lastUpd = now;
  const update = (c, p = [0, 0, 0]) => g.onUpdate(a, { sq: a.sq, p, v: [0, 0, 0], c, g: 1 });
  now += 0.05; update(1); close(a.crouch, 0.25);
  now += 0.15; update(1); close(a.crouch, 1);
  g.P = createPhysics([roof], [20, 20]);
  now += 0.2; update(0); close(a.crouch, 1);
  assert.equal(a.badMoves || 0, 0);
  g.P = empty(); now += 0.2; update(undefined); close(a.crouch, 0);
  // Dados inválidos nunca geram uma hitbox de altura negativa/NaN.
  for (const bad of [NaN, Infinity, -10, '1', {}]) { now += 0.2; update(bad); close(a.crouch, 0); }
});

test('hitscan online faz rewind da postura junto com a posição', () => {
  const { g, a, b } = game();
  a.pos.z = -5; g.T = 1; b.crouch = 0; g.pushHist(b);
  g.T = 1.2; b.crouch = 1; g.pushHist(b);
  close(g.crouchAt(b, 1.1), 0.5);
  assert.equal(g.hitscan(a, pos(0, 1.8, -5), [pos(0, 0, 1)], 0, g.T).size, 0);
  assert.ok(g.hitscan(a, pos(0, 1.8, -5), [pos(0, 0, 1)], 0, 1).has(b));
  assert.ok(b.hp < 100);
});

test('snapshot inclui postura e respawn restaura altura/histórico', () => {
  const { g, a, messages } = game(); a.crouch = 1;
  const now = g.now(); g.lastTick = now; g.t0 = now - 1;
  g.tick();
  const snap = messages.findLast((m) => m.t === 's');
  assert.equal(snap.e.find((row) => row[0] === a.id)[10], 1);
  g.spawn(a); close(a.crouch, 0);
  assert.equal(a.hist.length, 1); close(a.hist[0][5], 0);
});
