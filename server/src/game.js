// ============================================================
//  Simulação autoritativa de uma sala online (roda dentro do Durable Object).
//  Não depende de APIs da Cloudflare: recebe callbacks send/broadcast/loop.
//  Autoridade do servidor: acertos (hitscan com rewind ~100 ms + ping/2), dano, abates, placar, renascimento,
//  pickups, Copo Bomba e foguetes (física + explosão), tempo de partida, fim de partida e bots.
//  O cliente é dono só do próprio movimento (com checagem de velocidade/paredes) e manda eventos de tiro com origem+direção.
// ============================================================
import { MAPS, PLAY_MAPS, getMap } from '../../maps.js';
import { TRAIN, isTraining, dummyX } from '../../shared/training.js';
import { buildNav } from '../../nav.js';
import { SKINS } from '../../skins.js';
import { cleanName, uniqueName } from '../../shared/names.js';
import { KILL_LIMIT, TIME_LIMIT, normTime, RESPAWN_TIME, INVULN, JUMP, SPEED, BOT_SPEED, EYE, WEAPONS, PRIMARIES, BOT_PRIMARIES, SECONDARIES, MELEES, PISTOL, KNIFE, SABER, UZI, P90, NAIL, SEMI, MELEE, W_NADE, NADE, BACON_ITEM, noteHurt, resetRegen, regenStep, BOT_DEFS, BOT_RANGE, TAG_COLORS } from '../../shared/rules.js';
import { meleeHit, MELEE_KINDS } from '../../shared/melee.js';
import { mapSolids, createPhysics, raySphere, rayHitboxes } from '../../shared/physics.js';
import { stanceScale, stanceHeight, stepCrouch } from '../../shared/stance.js';
import { explosionHits, rayCapsule, ROCKET_PAD } from '../../shared/combat.js';
import { streakRewards, PREDATOR, HELI, NUKE, heliOrbit, heliPos } from '../../shared/killstreaks.js';
import { DOM, pickZone, newZoneState, zoneCounts, stepZone, canJoinTeam, smallerTeam, inZone } from '../../shared/domination.js';

export const MAX_PLAYERS = 10;
const RS_SAFETY = 60; // s: cliente antigo que nunca manda 'rs' renasce sozinho depois disso
const PENDING_WAIT = 60; // s de relógio de parede pra escolher o time ao entrar no meio; depois vai no Automático
const TICK = 0.05, HIST = 1.0, DC_GRACE = 30;
const TICK_DT = (g) => clamp(g.T - (g.lastZoneT ?? g.T), 0, 0.25) + (g.lastZoneT = g.T, 0);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r2 = (v) => Math.round(v * 100) / 100;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const vlen = (v) => Math.hypot(v.x, v.y, v.z);
const norm = (v) => { const l = vlen(v) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
const arr3 = (v) => [r2(v.x), r2(v.y), r2(v.z)];
const obj3 = (a) => (Array.isArray(a) && a.length === 3 && a.every(Number.isFinite) ? { x: a[0], y: a[1], z: a[2] } : null);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const center = (e, y = 1.0, p = e.pos) => ({ x: p.x, y: p.y + y * stanceScale(e.crouch), z: p.z });

export class Game {
  constructor(cfg, io) {
    this.test = !!cfg.test; // só no `wrangler dev` com ALLOW_TEST=1: aceita teleporte (testes automatizados)
    this.cfg = { code: cfg.code, map: cfg.map || 'arena', max: clamp(cfg.max | 0 || 6, 2, MAX_PLAYERS), fillBots: cfg.fillBots !== false, mode: cfg.mode === 'dom' || isTraining(cfg.mode) ? cfg.mode : 'dm', time: normTime(cfg.time), chat: cfg.chat !== false };
    this.chatLog = Array.isArray(cfg.chatLog) ? cfg.chatLog.filter((x) => x && typeof x.text === 'string').slice(-30) : [];
    this.io = io; // { send(id, obj), broadcast(obj), startLoop(), stopLoop() }
    this.ents = new Map(); this.nextId = 1; this.hostId = 0;
    this.state = 'lobby'; this.mapId = null; this.T = 0; this.t0 = 0;
    this.events = []; this.personal = new Map(); this.nades = []; this.rockets = []; this.pickups = []; this.bacons = []; this.helis = []; this.nukes = []; this.projId = 1;
  }
  now() { return Date.now() / 1000; }
  // o mundo só avança com mensagens (limite de CPU): depois de um tempo parado, T fica velho. Acerta pelo relógio de parede antes de usar.
  syncClock() { if (this.state === 'playing' && this.t0) this.T = Math.max(this.T, this.now() - this.t0); }
  get teamMode() { return this.cfg.mode === 'dom'; }
  get training() { return isTraining(this.cfg.mode); } // Estande do Docão: bots = alvos parados/andando
  live() { return [...this.ents.values()].filter((e) => e.bot || e.connected); }
  teamCounts(exclude, humansOnly = true) { const c = [0, 0]; for (const e of this.live()) if (e !== exclude && (!humansOnly || !e.bot) && (e.team === 0 || e.team === 1)) c[e.team]++; return c; }
  // escolha de time (lobby, pré-partida ou entrando no meio): -1 = automático. Bloqueia se deixaria 2+ humanos a mais.
  chooseTeam(e, want) {
    want = want === 0 || want === 1 ? want : -1; e.teamPref = want;
    const c = this.teamCounts(e); let team = want, blocked = false;
    if (want >= 0 && !canJoinTeam(want, c)) { blocked = true; team = -1; e.teamPref = -1; } // bloqueado: vira Automático
    if (team < 0) team = smallerTeam(c);
    e.team = team; return { team, blocked };
  }
  humans(connectedOnly = true) { return [...this.ents.values()].filter((e) => !e.bot && (!connectedOnly || e.connected)); }
  // ---------- entrada/saída ----------
  join({ name, skin, primary, secondary, melee, token }) {
    this.syncClock(); this.purge();
    let e = token ? [...this.ents.values()].find((x) => !x.bot && x.token === token) : null;
    if (e) { e.cameBack = !e.connected; e.connected = true; e.dcAt = 0; e.voice = 'off'; } // reconexão: mesmo id e placar; o microfone volta mudo
    else {
      if (this.humans().length >= this.cfg.max) return { error: 'Sala cheia' };
      if (this.state !== 'lobby' && !this.teamMode) this.removeOneBot(); // abre vaga (Dominação: ao escolher o time)
      e = this.makeEnt({ name: this.freeName(name), skin, primary, secondary, melee, bot: false });
      if (this.teamMode) { this.chooseTeam(e, -1); if (this.state === 'playing') { e.pendingTeam = true; e.pendingSince = this.now(); } }
      e.token = token && /^[a-z0-9]{8,32}$/i.test(token) ? token : Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 8);
      e.arrived = true;
    }
    if (!this.hostId || !this.ents.get(this.hostId)?.connected) this.hostId = e.id;
    return { ent: e };
  }
  welcome(e) {
    this.syncClock(); if (this.state === 'playing') this.io.startLoop(); // o loop para quando o último humano sai: volta ao entrar/reconectar
    const fresh = !!e.arrived; e.arrived = false;
    this.io.send(e.id, { t: 'welcome', id: e.id, token: e.token, code: this.cfg.code, hostId: this.hostId, cfg: this.cfg, state: this.state, maps: MAPS.map((m) => [m.id, m.name]), chat: this.chatLog });
    if (this.state === 'lobby') this.sendLobby();
    else {
      this.io.send(e.id, this.startMsg());
      if (this.state === 'playing') { this.events.push(['j', this.entInfo(e)]); if (!e.alive) e.needRs = false; if (!e.alive) e.respawnAt = e.pendingTeam ? this.T + PENDING_WAIT : Math.min(e.respawnAt || this.T, this.T + 0.5); } // escolhendo time: espera até 60 s (depois vai no Automático)
      if (this.state === 'over') this.io.send(e.id, this.endMsg());
    }
    this.sendLobby();
    if (fresh) this.postChat({ sys: 1, text: `${e.name} entrou` });
    else if (e.cameBack) this.postChat({ sys: 1, text: `${e.name} voltou` });
    e.cameBack = false;
    this.sendVoices();
  }
  leave(id) {
    const e = this.ents.get(id); if (!e) return;
    const name = e.name, bot = e.bot;
    e.connected = false; e.dcAt = this.now(); e.alive = false; e.voice = 'off';
    if (this.hostId === id) { const h = this.humans()[0]; this.hostId = h ? h.id : 0; }
    if (this.state === 'lobby') this.ents.delete(id);
    else this.events.push(['l', id]);
    this.syncBots(); this.sendLobby();
    if (!bot) this.postChat({ sys: 1, text: `${name} saiu` });
    this.sendVoices();
    if (!this.humans().length) this.io.stopLoop();
  }
  purge() { // remove quem caiu e não voltou (o “saiu” já foi pro chat no leave)
    const t = this.now();
    for (const e of [...this.ents.values()]) if (!e.bot && !e.connected && t - e.dcAt > DC_GRACE) this.ents.delete(e.id);
  }
  // nome limpo e sem repetir ("Matheus (2)") entre quem está na sala (humanos conectados e bots)
  freeName(raw, self = null) { return uniqueName(cleanName(raw), [...this.ents.values()].filter((x) => x !== self).map((x) => x.name)); }
  makeEnt({ name, skin, primary, secondary, melee, bot }) {
    const id = this.nextId++;
    const prim = PRIMARIES.includes(primary) ? primary : 0;
    const sec = SECONDARIES.includes(secondary) ? secondary : PISTOL;
    const mel = MELEES.includes(melee) ? melee : KNIFE;
    const e = { id, bot, name: cleanName(name), skin: SKINS.some((s) => s.id === skin) ? skin : pick(SKINS).id, tag: TAG_COLORS[(id - 1) % TAG_COLORS.length],
      primary: prim, nextPrimary: prim, secondary: sec, nextSecondary: sec, melee: mel, nextMelee: mel, slots: [prim, sec, mel], weapon: 0,
      pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, crouch: 0, onGround: true, hp: 100, alive: false, kills: 0, deaths: 0, invulnUntil: 0, respawnAt: 0,
      nades: 0, mag: WEAPONS.map((w) => w.mag), reserve: WEAPONS.map((w) => w.reserve), lastShot: WEAPONS.map(() => -9), lastCt: [], reload: null, hist: [], ping: 0, lastUpd: 0, sq: 0, lastKnock: -9,
      connected: !bot, dcAt: 0, lastAttacker: 0, team: -1, teamPref: -1, caps: 0, voice: 'off' };
    if (bot) Object.assign(e, { think: 0, target: null, aim: 0, reaction: rand(0.35, 0.65), strafeDir: 1, strafeT: 0, wp: null, path: null, stuck: 0, lastSeen: null, lastSeenAt: -99, accuracy: rand(0.045, 0.07), nextNade: 0, nextFire: 0, reloadEnd: 0, repathAt: 0 });
    this.ents.set(id, e); return e;
  }
  entInfo(e) { return { id: e.id, name: e.name, skin: e.skin, bot: e.bot, tag: e.tag, kills: e.kills, deaths: e.deaths, alive: e.alive, primary: e.primary, w: e.weapon, team: e.team, caps: e.caps, pend: e.pendingTeam ? 1 : 0 }; }
  sendLobby() {
    this.io.broadcast({ t: 'lobby', cfg: this.cfg, hostId: this.hostId, state: this.state, mapId: this.mapId,
      players: [...this.ents.values()].filter((e) => e.bot || e.connected).map((e) => ({ id: e.id, name: e.name, skin: e.skin, bot: e.bot, ping: e.ping, kills: e.kills, deaths: e.deaths, team: e.team, pref: e.teamPref })) });
  }
  // ---------- bots de preenchimento ----------
  syncBots() {
    if (this.state === 'lobby') return;
    if (this.training) return this.syncDummies();
    const want = this.cfg.fillBots ? Math.max(0, this.cfg.max - this.humans().length) : 0;
    let bots = [...this.ents.values()].filter((e) => e.bot);
    const tc = () => this.teamCounts(null, false);
    while (bots.length > want) { // Dominação: tira do time maior
      let b = bots[bots.length - 1]; if (this.teamMode) { const c = tc(), big = c[0] >= c[1] ? 0 : 1; b = [...bots].reverse().find((x) => x.team === big) || b; }
      bots = bots.filter((x) => x !== b); this.ents.delete(b.id); this.events.push(['l', b.id]);
    }
    if (this.teamMode) { // rebalanceia bots se um time ficou 2+ maior
      for (let i = 0; i < MAX_PLAYERS; i++) { const c = tc(), big = c[0] > c[1] ? 0 : 1; if (c[big] - c[1 - big] < 2) break; const b = bots.find((x) => x.team === big); if (!b) break; b.team = 1 - big; this.events.push(['tm', b.id, b.team]); }
    }
    const used = new Set(this.live().map((b) => b.name)); // bot não pega nome de humano
    while (bots.length < want) {
      const name = BOT_DEFS.map((d) => d.name).find((n) => !used.has(n)) || 'Bot ' + this.nextId; used.add(name);
      const b = this.makeEnt({ name, skin: pick(SKINS).id, primary: pick(BOT_PRIMARIES), bot: true }); bots.push(b);
      if (this.teamMode) b.team = smallerTeam(tc());
      if (this.state === 'playing') { this.events.push(['j', this.entInfo(b)]); this.spawn(b); }
    }
  }
  // Treino: um alvo por posição do mapa (independe de max/bots); recria se a lista mudou
  syncDummies() {
    const D = (this.map && this.map.dummies) || [], bots = [...this.ents.values()].filter((e) => e.bot);
    if (bots.length === D.length && bots.every((b, i) => b.dummy === D[i])) return;
    for (const b of bots) { this.ents.delete(b.id); this.events.push(['l', b.id]); }
    D.forEach((d) => {
      const b = this.makeEnt({ name: d.name, skin: pick(SKINS).id, primary: 0, bot: true }); b.name = d.name; b.dummy = d;
      if (this.state === 'playing') { this.events.push(['j', this.entInfo(b)]); this.spawn(b); }
    });
  }
  placeDummy(b) {
    const d = b.dummy, x = dummyX(d, this.T), y = this.P.groundAt(x, d.z, (d.y || 0) + 0.3), px = b.pos.x;
    b.pos = { x, y, z: d.z }; b.vel = { x: 0, y: 0, z: 0 }; b.onGround = true; b.yaw = d.yaw || 0; b.pitch = 0; b.weapon = PISTOL;
    return x - px;
  }
  removeOneBot() { const b = [...this.ents.values()].reverse().find((e) => e.bot); if (b) { this.ents.delete(b.id); this.events.push(['l', b.id]); } }
  // ---------- partida ----------
  startMatch(mapId) {
    const id = this.training ? TRAIN.map : mapId === 'random' || !PLAY_MAPS.some((m) => m.id === mapId) ? pick(PLAY_MAPS.filter((m) => m.id !== this.mapId)).id : mapId;
    const map = getMap(id); this.mapId = id; this.map = map;
    const solids = mapSolids(map); this.P = createPhysics(solids, map.size);
    this.spawns = map.spawns.map(([x, z, y = 0]) => ({ x, y: this.P.groundAt(x, z, y + 0.3), z }));
    this.nav = buildNav({ hx: map.size[0], hz: map.size[1], spacing: map.navSpacing || 2, collides: this.P.collides, groundAt: this.P.groundAt, solids, topAt: this.P.topAt, seeds: this.spawns.map((s) => [s.x, s.y, s.z]), extra: map.waypoints || [] });
    this.pickups = map.pickups.map(([type, x, z, y]) => ({ type, pos: { x, y: this.P.groundAt(x, z, (y || 0) + 0.3), z }, active: true, respawnAt: 0 }));
    this.nades = []; this.rockets = []; this.bacons = []; this.helis = []; this.nukes = []; this.events = []; this.personal.clear();
    this.state = 'playing'; this.t0 = this.now(); this.T = 0; this.lastTick = this.now();
    this.curLimit = this.cfgLimit;
    for (const e of this.ents.values()) {
      e.kills = 0; e.deaths = 0; e.alive = false; e.needRs = false; e.caps = 0; e.pendingTeam = false; if (!this.teamMode) e.team = -1;
      // this.T e o relógio do cliente voltam a 0 na partida nova: zera cadência/anti speed-hack, senão os tiros da partida anterior
      // (lastShot/lastCt/lastMelee no futuro) fazem o servidor rejeitar todo tiro no "Próximo mapa"/"Jogar de novo" (sem dano)
      e.lastShot = WEAPONS.map(() => -9); e.lastCt = []; e.maxOff = undefined; e.lastMeleeCt = undefined; e.lastMeleeT = undefined; e.lastMeleeRate = 0; e.lastKnock = -9;
      this.resetStreak(e); e.rejectedShots = 0; e.rejectedMelee = 0; e.reload = null; e.hist = []; e.nextFire = 0; e.reloadEnd = 0; e.knifeRoll = 0; e.knifeMode = false;
      if (e.bot) Object.assign(e, { think: 0, lastSeenAt: -99, nextNade: 0, repathAt: 0 });
    }
    if (this.teamMode) { // times
      const hs = this.humans(); // os times do lobby já respeitam a regra; só completa quem está sem time e reequilibra (automáticos primeiro)
      for (const e of hs) if (e.team !== 0 && e.team !== 1) e.team = e.teamPref >= 0 && canJoinTeam(e.teamPref, this.teamCounts(e)) ? e.teamPref : smallerTeam(this.teamCounts(e));
      for (let g = 0; g < 16; g++) {
        const c = this.teamCounts(null), big = c[0] - c[1] >= 2 ? 0 : c[1] - c[0] >= 2 ? 1 : -1; if (big < 0) break;
        const mv = hs.find((x) => x.team === big && x.teamPref < 0) || hs.find((x) => x.team === big); mv.team = 1 - big;
      }
      for (const b of [...this.ents.values()].filter((x) => x.bot)) b.team = -1;
    }
    this.syncBots();
    if (this.teamMode) { for (const b of [...this.ents.values()].filter((x) => x.bot)) b.team = -1; for (const b of [...this.ents.values()].filter((x) => x.bot)) b.team = smallerTeam(this.teamCounts(null, false)); }
    this.teamScore = [0, 0]; this.zone = this.teamMode ? newZoneState(pickZone(this.nav)) : null;
    for (const e of this.ents.values()) if (e.bot || e.connected) this.spawn(e, true);
    this.io.broadcast(this.startMsg()); this.sendLobby();
    this.io.startLoop();
  }
  get cfgLimit() { return this.training ? Infinity : this.cfg.time ? this.cfg.time * 60 : this.teamMode ? DOM.TIME_LIMIT_DOM : TIME_LIMIT; } // Treino: não acaba
  get timeLimit() { return this.curLimit || this.cfgLimit; } // mudar o tempo no meio da partida só vale na próxima
  zoneArr() { const z = this.zone; return z ? [r2(z.x), r2(z.y), r2(z.z), +z.progress.toFixed(3), z.team, z.contested ? 1 : 0, z.counts[0], z.counts[1], this.teamScore[0], this.teamScore[1]] : null; }
  startMsg() { return { t: 'start', mode: this.cfg.mode, zone: this.zoneArr(), win: DOM.WIN_CAPS, map: this.mapId, T: r2(this.T), limit: Number.isFinite(this.timeLimit) ? this.timeLimit : 0, kills: KILL_LIMIT, hostId: this.hostId, ents: [...this.ents.values()].filter((e) => e.bot || e.connected).map((e) => this.entInfo(e)), pk: this.pickups.map((p) => (p.active ? 1 : 0)) }; }
  endMatch() {
    this.state = 'over'; this.io.stopLoop(); this.nades = []; this.rockets = []; this.helis = []; this.nukes = [];
    this.io.broadcast(this.endMsg()); this.sendLobby();
  }
  endMsg() {
    const rows = [...this.ents.values()].filter((e) => e.bot || e.connected).sort((a, b) => this.score(b) - this.score(a) || a.deaths - b.deaths);
    const i = MAPS.findIndex((m) => m.id === this.mapId), ts = this.teamScore || [0, 0];
    return { t: 'end', mode: this.cfg.mode, ts, winTeam: this.teamMode ? (ts[0] > ts[1] ? 0 : ts[1] > ts[0] ? 1 : -1) : null, board: rows.map((e) => [e.id, e.name, e.kills, e.deaths, e.bot, e.team, e.caps]), winner: rows[0] ? rows[0].id : 0, map: this.mapId, next: PLAY_MAPS[(PLAY_MAPS.findIndex((m) => m.id === this.mapId) + 1) % PLAY_MAPS.length].id, hostId: this.hostId };
  }
  score(e) { return this.teamMode ? e.kills + 2 * e.caps : e.kills; }
  // ---------- mensagens dos clientes ----------
  onMessage(id, m) {
    this.syncClock();
    const e = this.ents.get(id); if (!e || !m || typeof m !== 'object') return;
    const isHost = id === this.hostId;
    switch (m.t) {
      case 'u': this.onUpdate(e, m); break;
      case 'rs': if (this.state === 'playing' && !e.alive) e.rsReq = true; break; // botão Renascer
      case 'prof': if (typeof m.name === 'string' && this.state !== 'playing') e.name = this.freeName(m.name, e); // nome só muda fora da partida (as plaquinhas são criadas no início)
         if (SKINS.some((s) => s.id === m.skin)) e.skin = m.skin; if (PRIMARIES.includes(m.primary)) e.nextPrimary = m.primary; if (SECONDARIES.includes(m.secondary)) e.nextSecondary = m.secondary; if (MELEES.includes(m.melee)) e.nextMelee = m.melee; if (this.state === 'lobby') { e.primary = e.nextPrimary; e.secondary = e.nextSecondary; e.melee = e.nextMelee; } this.sendLobby(); break;
      case 'cfg': if (!isHost) return;
        if (m.map === 'random' || MAPS.some((x) => x.id === m.map)) this.cfg.map = m.map;
        if (m.max) this.cfg.max = clamp(m.max | 0, Math.max(2, this.humans().length), MAX_PLAYERS);
        if (typeof m.fillBots === 'boolean') this.cfg.fillBots = m.fillBots;
        if (m.time !== undefined) this.cfg.time = normTime(m.time);
        if ((m.mode === 'dm' || m.mode === 'dom' || isTraining(m.mode)) && this.state !== 'playing') { this.cfg.mode = m.mode; for (const h of this.humans()) { if (m.mode === 'dom') this.chooseTeam(h, h.teamPref); else { h.team = -1; if (h.voice === 'team') h.voice = 'all'; } } }
        if (typeof m.chat === 'boolean') this.cfg.chat = m.chat;
        this.io.saveCfg && this.io.saveCfg(this.cfg); if (this.state === 'playing') this.syncBots(); this.sendLobby(); this.sendVoices(); break;
      case 'testKs': if (this.test && this.state === 'playing' && e.alive) { const n = clamp(m.n | 0, 0, 30); for (let i = 0; i < n; i++) this.streakKill(e); } break; // só testes (ALLOW_TEST=1)
      case 'testEnd': if (this.test && isHost && this.state === 'playing') this.endMatch(); break; // só testes (ALLOW_TEST=1)
      case 'start': if (!isHost || this.state === 'playing') return; this.startMatch(m.map || (m.next && this.mapId ? PLAY_MAPS[(PLAY_MAPS.findIndex((x) => x.id === this.mapId) + 1) % PLAY_MAPS.length].id : this.cfg.map)); break;
      case 'team': {
        if (!this.teamMode) return; const r = this.chooseTeam(e, m.team);
        if (this.state === 'playing') {
          if (e.pendingTeam) { e.pendingTeam = false; e.respawnAt = this.T + 0.3; this.syncBots(); }
          else if (e.alive) { e.alive = false; e.deaths++; e.respawnAt = this.T + RESPAWN_TIME; this.events.push(['k', 0, e.id, -2, 0, 0, e.deaths]); } // troca no meio: renasce no time novo
          this.events.push(['tm', e.id, e.team]);
        }
        this.io.send(e.id, { t: 'teamOk', team: r.team, blocked: r.blocked, pref: e.teamPref }); this.sendLobby(); this.sendVoices(); break;
      }
      case 'lobby': if (!isHost || this.state !== 'over') return; this.state = 'lobby'; for (const b of [...this.ents.values()]) if (b.bot) this.ents.delete(b.id); this.sendLobby(); break;
      case 'say': this.onSay(e, m); break;
      case 'voice': {
        let scope = m.scope === 'all' || m.scope === 'team' ? m.scope : 'off';
        if (scope === 'team' && !this.teamMode) scope = 'all';
        e.voice = scope; this.sendVoices(); break;
      }
      case 'sig': this.onSig(e, m); break;
      default: break;
    }
  }
  cleanChat(raw) {
    if (typeof raw !== 'string') return '';
    return raw.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  }
  hearsChat(h, line) {
    if (line.sys || h.id === line.id) return true;
    if (line.dead && !(this.state === 'playing' && !h.alive)) return false;
    if (line.scope === 'team' && h.team !== line.team) return false;
    return true;
  }
  postChat(line) {
    const row = { id: line.id || 0, name: line.name || '', team: line.team ?? -1, scope: line.scope === 'team' ? 'team' : 'all', dead: line.dead ? 1 : 0, sys: line.sys ? 1 : 0, text: line.text, at: Date.now() };
    this.chatLog.push(row); while (this.chatLog.length > 30) this.chatLog.shift();
    const msg = { t: 'chat', ...row };
    for (const h of this.humans()) if (this.hearsChat(h, row)) this.io.send(h.id, msg);
    if (this.io.saveCfg) this.io.saveCfg();
  }
  onSay(e, m) {
    if (this.cfg.chat === false || e.bot) return;
    const text = this.cleanChat(m.text); if (!text) return;
    const now = Date.now();
    const times = e.sayAt = (e.sayAt || []).filter((t) => now - t < 5000);
    if (times.length >= 4) return;
    times.push(now);
    const scope = m.scope === 'team' && this.teamMode ? 'team' : 'all';
    const dead = this.state === 'playing' && !e.alive ? 1 : 0;
    this.postChat({ id: e.id, name: e.name, team: e.team, scope, dead, text });
  }
  voiceReaches(from, to) {
    const s = from.voice || 'off'; if (s === 'off' || from === to) return false;
    if (s === 'all') return true;
    return s === 'team' && this.teamMode && from.team >= 0 && from.team === to.team;
  }
  voicePair(a, b) { return this.voiceReaches(a, b) || this.voiceReaches(b, a); }
  sendVoices() {
    this.io.broadcast({ t: 'voices', list: this.humans().map((h) => [h.id, h.voice || 'off', h.team]) });
  }
  onSig(e, m) {
    const other = this.ents.get(m.to | 0);
    if (!other || other.bot || !other.connected || other.id === e.id || !this.voicePair(e, other)) return;
    if (m.kind !== 'offer' && m.kind !== 'answer' && m.kind !== 'ice') return;
    let data = m.data;
    if (m.kind === 'ice') {
      if (!data || typeof data !== 'object' || typeof data.candidate !== 'string' || !data.candidate) return;
      data = { candidate: data.candidate.slice(0, 2000), sdpMid: typeof data.sdpMid === 'string' ? data.sdpMid.slice(0, 32) : null, sdpMLineIndex: Number.isInteger(data.sdpMLineIndex) ? data.sdpMLineIndex : null };
    } else if (typeof data !== 'string' || data.length < 8 || data.length > 6000 || !data.startsWith('v=0')) return;
    this.io.send(other.id, { t: 'sig', from: e.id, kind: m.kind, data });
  }
  onUpdate(e, m) {
    if (this.state !== 'playing') return;
    const t = this.now(); if (Number.isFinite(m.pg)) e.ping = clamp(m.pg | 0, 0, 2000);
    if (m.sq === e.sq && e.alive) {
      const p = obj3(m.p), v = obj3(m.v);
      if (p) {
        const dt = clamp(t - (e.lastUpd || t), 0.016, 1);
        // Não confia em uma redução instantânea da hitbox enviada pelo cliente.
        // Clientes antigos omitem c e continuam em pé.
        stepCrouch(e, m.c, dt, this.P);
        const horiz = Math.hypot(p.x - e.pos.x, p.z - e.pos.z);
        const knocked = this.T - e.lastKnock < 2.5;
        const maxH = (SPEED * 1.35 + (knocked ? 22 : 0)) * dt + 0.6;
        const [hx, hz] = this.map.size;
        const inside = Math.abs(p.x) <= hx && Math.abs(p.z) <= hz && p.y >= -0.5 && p.y < 45;
        if (this.test && m.tp) { e.pos = p; e.lastKnock = this.T; }
        else if (horiz > maxH || !inside || this.P.overlapping(p.x, p.y, p.z, 0.03, stanceHeight(e)) || (p.y - e.pos.y > (knocked ? 12 : 3.2) * Math.max(dt, 0.25) + 1)) {
          e.badMoves = (e.badMoves || 0) + 1; this.toMe(e, ['pos', arr3(e.pos)]); // anti-cheat: devolve pra última posição válida
        } else { e.pos = p; if (v) e.vel = { x: clamp(v.x, -40, 40), y: clamp(v.y, -60, 40), z: clamp(v.z, -40, 40) }; }
        e.lastUpd = t;
      }
      if (Number.isFinite(m.y)) e.yaw = m.y + Math.PI; // câmera → modelo
      if (Number.isFinite(m.pi)) e.pitch = clamp(m.pi, -1.6, 1.6);
      e.onGround = !!m.g;
      if (e.slots.includes(m.w) && m.w !== e.weapon) { e.weapon = m.w; e.reload = null; }
      this.pushHist(e);
    }
    if (Array.isArray(m.ev)) for (const ev of m.ev.slice(0, 24)) this.onEvent(e, ev);
  }
  onEvent(e, ev) {
    if (!Array.isArray(ev)) return;
    const [k] = ev;
    if (k === 'pr') { if (PRIMARIES.includes(ev[1])) e.nextPrimary = ev[1]; if (SECONDARIES.includes(ev[2])) e.nextSecondary = ev[2]; if (MELEES.includes(ev[3])) e.nextMelee = ev[3]; if (this.training && e.alive) this.equipNow(e); return; }
    if (!e.alive) return;
    if (k === 'rl') { const w = ev[1]; if (e.slots.includes(w) && e.mag[w] < WEAPONS[w].mag && e.reserve[w] > 0) e.reload = { w, start: this.T, done: 0 }; return; }
    if (k === 'f') return this.clockOk(e, ev[4], ev[3]) && this.humanFire(e, ev[1], ev[2], ev[3], ev[5], ev[6]);
    if (k === 'r') return this.clockOk(e, ev[3], 3) && this.humanRocket(e, ev[1], ev[2]);
    if (k === 'n') return this.humanNade(e, ev[1], ev[2]);
    if (k === 'm') return this.humanMelee(e, ev[1], ev[2], ev[3], ev[4], ev[5]);
    if (k === 'sw') return this.clockOk(e, ev[3], SABER) && this.humanSwing(e, ev[1], ev[2]);
    if (k === 'ks') return this.useStreak(e, ev[1], ev[2]);
    if (k === 'ms') return this.missileImpact(e, ev[1]);
  }
  // ---------- killstreaks (servidor autoritativo; regras em shared/killstreaks.js) ----------
  resetStreak(e) { e.ksKills = 0; e.ksBank = { missile: 0, heli: 0, nuke: 0 }; e.ksMissile = null; }
  // abate que conta pra sequência (quem matou precisa estar vivo, igual ao cliente)
  streakKill(a) {
    if (!a.ksBank) this.resetStreak(a);
    a.ksKills++;
    for (const r of streakRewards(a.ksKills)) if (r in a.ksBank) a.ksBank[r]++;
  }
  // F: 'p' = Míssil (abre o laptop; o cliente pilota e manda o impacto em 'ms'), 'h' = Gavião, 'x' = nuke
  useStreak(e, kind, startA) {
    const B = e.ksBank; if (!B || e.bot) return;
    if (kind === 'p') {
      const st = obj3(startA); if (!B.missile || e.ksMissile || !st || Math.hypot(st.x - e.pos.x, st.z - e.pos.z) > PREDATOR.back + 2.5) return;
      B.missile--; e.ksMissile = { T0: this.T, start: { x: st.x, y: this.P.groundAt(st.x, st.z, e.pos.y + 4) + PREDATOR.height, z: st.z } };
    } else if (kind === 'h') {
      if (!B.heli) return; B.heli--;
      for (const h of this.helis) if (h.owner === e && h.alive) { h.alive = false; this.events.push(['hx', h.id, 0]); } // um por dono (como o offline)
      const h = { id: this.projId++, owner: e, alive: true, hp: HELI.hp, ang: Math.random() * Math.PI * 2, orbit: heliOrbit(this.map.size), born: this.T, until: this.T + HELI.life, cool: 0.4 };
      this.helis.push(h); this.events.push(['hl', h.id, e.id, r2(h.ang), r2(h.orbit), r2(h.born), r2(h.until), h.hp]);
    } else if (kind === 'x') {
      if (!B.nuke || this.nukes.some((n) => n.owner === e)) return; B.nuke--;
      const n = { owner: e, at: this.T + NUKE.delay }; this.nukes.push(n); this.events.push(['nk', e.id, r2(n.at)]);
    }
  }
  // impacto do míssil pilotado: precisa ter um míssil no ar e o ponto tem que ser alcançável desde o lançamento
  missileImpact(e, cA) {
    const M = e.ksMissile, c = obj3(cA); if (!M || !c) return;
    const fly = this.T - M.T0 - PREDATOR.laptop, slack = 6 + clamp(e.ping / 1000, 0, 0.5) * PREDATOR.speed;
    const [hx, hz] = this.map.size;
    if (fly < -0.4 || fly > PREDATOR.life + 2 || dist(M.start, c) > PREDATOR.speed * Math.max(0, fly) + slack || Math.abs(c.x) > hx + 2 || Math.abs(c.z) > hz + 2 || c.y > M.start.y + 1) { e.rejectedShots = (e.rejectedShots || 0) + 1; e.ksMissile = null; return; }
    e.ksMissile = null;
    this.blast(c, e, { radius: PREDATOR.radius, maxDmg: PREDATOR.maxDmg, selfMul: PREDATOR.selfMul, knock: PREDATOR.knock, lift: PREDATOR.lift, wIdx: W_NADE, kind: 'p', ks: 'p' });
  }
  heliAt(h, T = this.T) { return heliPos(h, T); }
  hurtHeli(h, amount, by) {
    if (!h.alive || !(amount > 0)) return;
    h.hp = Math.max(0, h.hp - amount); this.events.push(['hh', h.id, Math.round(h.hp)]);
    if (h.hp <= 0) { h.alive = false; this.events.push(['hx', h.id, 1, by ? by.id : 0]); }
  }
  // inimigo do dono do Gavião (pode atirar nele / ele atira em você)
  heliFoe(h, e) { return e && e !== h.owner && !this.friends(e, h.owner); }
  stepHelis(dt) {
    for (const h of this.helis) {
      if (!h.alive) continue;
      if (this.T >= h.until) { h.alive = false; this.events.push(['hx', h.id, 0]); continue; }
      h.cool -= dt; if (h.cool > 0) continue;
      const hp = this.heliAt(h); let best = null, bd = 1e9;
      for (const e of this.ents.values()) {
        if (!e.alive || (!e.bot && !e.connected) || !this.heliFoe(h, e)) continue;
        const d = dist(hp, e.pos); if (d < bd && this.P.losClear(hp, center(e, 1.1))) { best = e; bd = d; }
      }
      if (!best) continue;
      h.cool = HELI.rate;
      this.events.push(['hs', h.id, arr3(center(best, 1.0))]);
      this.damage(best, HELI.dmg, h.owner, 0, false, false, 'h');
    }
    this.helis = this.helis.filter((h) => h.alive);
  }
  stepNukes() {
    for (const n of this.nukes.filter((x) => this.T >= x.at)) {
      this.nukes = this.nukes.filter((x) => x !== n);
      const o = n.owner; if (!this.ents.has(o.id)) continue; // dono saiu de vez: cancela
      this.events.push(['nb', o.id]); // morrer depois de puxar o rádio não cancela
      for (const t of [...this.ents.values()]) if (t !== o && t.alive && (t.bot || t.connected) && !this.friends(t, o)) this.kill(t, o, W_NADE, false, false, 'x');
      if (this.pendingEnd) break;
    }
  }
  // Treino: troca de arma na hora (teclas B/N/M), com pente cheio
  equipNow(e) {
    e.primary = e.nextPrimary; e.secondary = e.nextSecondary ?? PISTOL; e.melee = e.nextMelee ?? KNIFE; const old = e.slots; e.slots = [e.primary, e.secondary, e.melee];
    for (const w of e.slots) if (!old.includes(w)) { e.mag[w] = WEAPONS[w].mag; e.reserve[w] = WEAPONS[w].reserve; }
    if (!e.slots.includes(e.weapon)) e.weapon = e.primary; e.reload = null;
  }
  // cadência: usa o relógio do cliente (tiros chegam agrupados pela rede), mas o relógio do cliente não pode
  // andar mais rápido que o do servidor (speed hack): (tServidor - tCliente) não pode cair mais que 0,75 s abaixo do máximo visto
  clockOk(e, ct, w) {
    if (!Number.isFinite(ct) || !WEAPONS[w]) return false;
    const off = this.now() - ct; e.maxOff = Math.max(e.maxOff ?? -Infinity, off);
    if (off < e.maxOff - 0.75) { e.rejectedShots = (e.rejectedShots || 0) + 1; return false; }
    const last = e.lastCt[w] ?? -Infinity; if (ct - last < WEAPONS[w].rate * 0.9) { e.rejectedShots = (e.rejectedShots || 0) + 1; return false; }
    e.lastCt[w] = ct; return true;
  }
  eyeOk(e, o) { return o && dist(o, center(e, EYE)) < 2.6; }
  // recarga do lado do servidor (mesma temporização do cliente, com 20% de folga pra rede)
  progressReload(e) {
    const R = e.reload; if (!R) return; const w = WEAPONS[R.w], el = this.T - R.start, i = R.w;
    if (w.shellReload) {
      const shells = el >= (w.reloadStart + w.reload) * 0.8 ? Math.floor((el - w.reloadStart * 0.8) / (w.reload * 0.8)) : 0;
      while (R.done < shells && e.mag[i] < w.mag && e.reserve[i] > 0) { e.mag[i]++; e.reserve[i]--; R.done++; }
      if (e.mag[i] >= w.mag || e.reserve[i] <= 0) e.reload = null;
    } else if (el >= w.reload * 0.8) { const n = Math.min(w.mag - e.mag[i], e.reserve[i]); e.mag[i] += n; e.reserve[i] -= n; e.reload = null; }
  }
  canShoot(e, w) {
    const W = WEAPONS[w]; if (!e.slots.includes(w)) return false;
    if (this.T - e.lastShot[w] < W.rate * 0.35) return false; // folga pra rede; a cadência real é checada em clockOk
    this.progressReload(e);
    if (e.mag[w] <= 0) return false;
    if (e.reload && W.shellReload) e.reload = null; // atirar interrompe a recarga do Calibre 12
    else if (e.reload) return false;
    e.mag[w]--; e.lastShot[w] = this.T; e.invulnUntil = Math.min(e.invulnUntil, this.T); e.weapon = w; return true;
  }
  humanFire(e, oA, dirs, w, rt, pull) {
    const o = obj3(oA); if (!this.eyeOk(e, o) || !Number.isInteger(w) || !WEAPONS[w] || WEAPONS[w].rocket || !Array.isArray(dirs)) return;
    if (!this.canShoot(e, w)) { e.rejectedShots = (e.rejectedShots || 0) + 1; return; }
    const ds = dirs.slice(0, Math.max(1, WEAPONS[w].pellets)).map(obj3).filter(Boolean).map(norm);
    // compensação de lag: o cliente manda o tempo de servidor do que estava desenhando (rt); senão estima RTT + 100 ms de interpolação
    const rewind = Number.isFinite(rt) ? clamp(rt, this.T - 0.4, this.T) : this.T - clamp(e.ping / 1000 + 0.1, 0, 0.4);
    const mul = WEAPONS[w].key === 'arco' ? clamp(Number(pull) || 1, 0.35, 1.3) : 1;
    this.hitscan(e, o, ds, w, rewind, mul);
  }
  humanRocket(e, oA, dA) {
    const o = obj3(oA), d = obj3(dA); if (!this.eyeOk(e, o) || !d || !this.canShoot(e, 3)) return;
    this.launchRocket(e, o, norm(d));
  }
  // Faca (servidor autoritativo): precisa estar com a faca na mão, olho perto do olho que o servidor conhece,
  // cadência pelo relógio do cliente (mesma checagem anti speed-hack dos tiros) + piso pelo relógio do servidor,
  // alcance/cone/pelas costas calculados aqui (shared/melee.js) contra posições e yaw voltados no tempo (lag comp).
  humanMelee(e, kindIdx, oA, dA, ct, rt) {
    const kind = MELEE_KINDS[kindIdx], o = obj3(oA), d0 = obj3(dA);
    if (!kind || !o || !d0 || vlen(d0) < 0.5 || e.weapon !== KNIFE || !e.slots.includes(KNIFE) || dist(o, center(e, EYE)) > 1.3 || !Number.isFinite(ct)) { e.rejectedMelee = (e.rejectedMelee || 0) + 1; return; }
    const off = this.now() - ct; e.maxOff = Math.max(e.maxOff ?? -Infinity, off);
    const lastRate = e.lastMeleeRate || 0;
    if (off < e.maxOff - 0.75 || ct - (e.lastMeleeCt ?? -Infinity) < lastRate * 0.9 || this.T - (e.lastMeleeT ?? -9) < lastRate * 0.35) { e.rejectedMelee = (e.rejectedMelee || 0) + 1; return; }
    e.lastMeleeCt = ct; e.lastMeleeT = this.T; e.lastMeleeRate = MELEE[kind].rate; e.invulnUntil = Math.min(e.invulnUntil, this.T);
    const rewind = Number.isFinite(rt) ? clamp(rt, this.T - 0.4, this.T) : this.T - clamp(e.ping / 1000 + 0.1, 0, 0.4);
    this.melee(e, kind, o, norm(d0), rewind);
  }
  melee(e, kind, o, d, rewindT = this.T) {
    const targets = [...this.ents.values()].filter((t) => t !== e && t.alive && (t.bot || t.connected) && !this.friends(t, e))
      .map((t) => ({ e: t, p: rewindT < this.T ? this.posAt(t, rewindT) : t.pos, yaw: rewindT < this.T ? this.yawAt(t, rewindT) : t.yaw, crouch: this.crouchAt(t, rewindT) }));
    const h = meleeHit(o, d, kind, targets, (a, b) => this.P.losClear(a, b));
    this.events.push(['ml', e.id, MELEE_KINDS.indexOf(kind), h ? 1 : 0]);
    if (h) this.damage(h.e, h.dmg, e, KNIFE, false, h.back);
    return h;
  }
  humanNade(e, oA, vA) {
    const o = obj3(oA), v = obj3(vA); if (!this.eyeOk(e, o) || !v || e.nades <= 0 || vlen(v) > 34) return;
    e.nades--; e.lastNadeT = this.T; this.throwNade(e, o, v);
  }
  humanSwing(e, oA, dirA) {
    const W = WEAPONS[SABER];
    if (!e.alive || e.weapon !== SABER) return;
    const o = obj3(oA), dir = obj3(dirA);
    if (!this.eyeOk(e, o) || !dir) return;
    const fl = Math.hypot(dir.x, dir.z) || 1;
    const fx = dir.x / fl, fz = dir.z / fl;
    for (const t of this.ents.values()) {
      if (t === e || !t.alive || this.friends(t, e)) continue;
      const dx = t.pos.x - o.x, dz = t.pos.z - o.z, dist = Math.hypot(dx, dz);
      if (dist > W.reach || dist < 0.05) continue;
      if ((dx / dist) * fx + (dz / dist) * fz < Math.cos(W.arc)) continue;
      this.damage(t, W.dmg, e, SABER, false);
    }
  }
  // ---------- histórico de posições (rewind) ----------
  pushHist(e) { e.hist.push([this.T, e.pos.x, e.pos.y, e.pos.z, e.yaw, e.crouch]); while (e.hist.length > 2 && e.hist[0][0] < this.T - HIST) e.hist.shift(); }
  posAt(e, t) {
    const h = e.hist; if (!h.length || t >= h[h.length - 1][0]) return e.pos;
    for (let i = h.length - 1; i > 0; i--) if (h[i - 1][0] <= t) { const a = h[i - 1], b = h[i], k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return { x: a[1] + (b[1] - a[1]) * k, y: a[2] + (b[2] - a[2]) * k, z: a[3] + (b[3] - a[3]) * k }; }
    return { x: h[0][1], y: h[0][2], z: h[0][3] };
  }
  yawAt(e, t) { const h = e.hist; let y = e.yaw; for (let i = h.length - 1; i >= 0; i--) { y = h[i][4] ?? y; if (h[i][0] <= t) break; } return y; }
  crouchAt(e, t) {
    const h = e.hist; if (!h.length || t >= h[h.length - 1][0]) return e.crouch || 0;
    for (let i = h.length - 1; i > 0; i--) if (h[i - 1][0] <= t) {
      const a = h[i - 1], b = h[i], k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]);
      return (a[5] || 0) + ((b[5] || 0) - (a[5] || 0)) * k;
    }
    return h[0][5] || 0;
  }
  // ---------- combate ----------
  hitscan(shooter, o, dirs, w, rewindT = this.T, mul = 1) {
    const W = WEAPONS[w], hits = new Map(), ends = [], heliDmg = new Map(); const heliT = this.T - (shooter.bot ? 0 : clamp(shooter.ping / 1000, 0, 0.4));
    const scale = W.key === 'arco' ? clamp(Number(mul) || 1, 0.35, 1.3) : 1;
    const targets = [...this.ents.values()].filter((t) => t !== shooter && t.alive && (t.bot || t.connected) && !this.friends(t, shooter)).map((t) => ({ t, p: rewindT < this.T ? this.posAt(t, rewindT) : t.pos, crouch: this.crouchAt(t, rewindT) }));
    for (const d of dirs) {
      const wall = this.P.rayWorld(o, d, W.range); const wallD = wall ?? W.range; let best = null;
      for (const { t, p, crouch } of targets) {
        const hit = rayHitboxes(o, d, p, crouch);
        if (hit && hit.t < wallD && (!best || hit.t < best.tt)) best = { t, tt: hit.t, head: hit.head };
      }
      let hb = null; // Gavião inimigo na frente (bala para nele). O cliente desenha o Gavião no tempo de jogo (sem atraso de interpolação): vale o ping ou o rewind dos jogadores
      for (const hl of this.helis) { if (!hl.alive || !this.heliFoe(hl, shooter)) continue; const tt = Math.max(raySphere(o, d, this.heliAt(hl, heliT), HELI.hit), raySphere(o, d, this.heliAt(hl, rewindT), HELI.hit)); if (tt > 0.15 && tt < wallD && (!best || tt < best.tt) && (!hb || tt < hb.tt)) hb = { hl, tt }; }
      if (hb) {
        ends.push([r2(o.x + d.x * hb.tt), r2(o.y + d.y * hb.tt), r2(o.z + d.z * hb.tt), 0]);
        let fo = 1; if (W.falloff) { const [n0, n1, mn] = W.falloff; fo = clamp(1 - (hb.tt - n0) / (n1 - n0) * (1 - mn), mn, 1); }
        heliDmg.set(hb.hl, (heliDmg.get(hb.hl) || 0) + W.dmg * scale * fo); continue;
      }
      const L = best ? best.tt : wallD; ends.push([r2(o.x + d.x * L), r2(o.y + d.y * L), r2(o.z + d.z * L), best ? 1 : 0]);
      if (best) {
        const h = hits.get(best.t) || { dmg: 0, head: false };
        let fo = 1; if (W.falloff) { const [n0, n1, mn] = W.falloff; fo = clamp(1 - (best.tt - n0) / (n1 - n0) * (1 - mn), mn, 1); }
        h.dmg += W.dmg * scale * (best.head ? W.headMul : 1) * fo; h.head = h.head || best.head; hits.set(best.t, h);
      }
    }
    this.events.push(['sh', shooter.id, w, arr3(o), ends]);
    for (const [hl, dmg] of heliDmg) this.hurtHeli(hl, dmg, shooter);
    for (const [t, h] of hits) this.damage(t, h.dmg, shooter, w, h.head);
    return hits;
  }
  friends(a, b) { return this.teamMode && a && b && a !== b && a.team === b.team && a.team >= 0; }
  damage(t, amount, a, w, head, back = false, ks = null) {
    if (!t.alive || this.T < t.invulnUntil || this.friends(t, a)) return false; // sem fogo amigo
    t.hp -= amount; t.lastAttacker = a ? a.id : 0; noteHurt(t, a, this.T); // regen só com dano de outro
    if (t.bot && a && a !== t && !t.target) { t.target = a; t.aim = t.reaction * 0.5; }
    this.events.push(['h', t.id, a ? a.id : 0, Math.max(0, Math.round(t.hp)), head ? 1 : 0, Math.round(amount)]); // [5] = dano (números no Treino)
    if (t.hp <= 0) { this.kill(t, a, w, head, back, ks); return true; }
    return false;
  }
  // ks: abate de killstreak ('p' míssil, 'h' Gavião, 'x' nuke) → ev[8]; Gavião e nuke não contam pra sequência
  kill(t, a, w, head, back = false, ks = null) {
    t.alive = false; t.hp = 0; t.deaths++; t.respawnAt = this.T + (t.dummy ? TRAIN.respawn : RESPAWN_TIME); if (!t.bot) { t.needRs = true; t.rsReq = false; } // humano: só renasce clicando em Renascer
    if (a && a !== t) { a.kills++; if (a.alive && ks !== 'h' && ks !== 'x') this.streakKill(a); }
    this.resetStreak(t); // morreu: sequência zera (míssil no ar cai junto); o nuke já puxado continua
    // faca: ev[3] = pistola (clientes antigos não conhecem a arma 5) e ev[7] = 1 (faca) / 2 (pelas costas)
    const ev = ['k', a ? a.id : 0, t.id, w === KNIFE ? PISTOL : w, head ? 1 : 0, a ? a.kills : 0, t.deaths]; if (w === KNIFE) ev.push(back ? 2 : 1);
    if (ks) { while (ev.length < 8) ev.push(0); ev.push(ks); }
    this.events.push(ev);
    // vira bacon que cura: fica no chão onde morreu pelo mesmo tempo que o bacon aparece no cliente
    this.bacons = this.bacons.filter((b) => b.id !== t.id);
    this.bacons.push({ id: t.id, x: t.pos.x, y: this.P.groundAt(t.pos.x, t.pos.z, t.pos.y + 0.3), z: t.pos.z, born: this.T });
    if (a && a.kills >= KILL_LIMIT && !this.teamMode && !this.training) this.pendingEnd = true;
  }
  blast(c, owner, o, direct = null) {
    this.events.push(['bm', o.pid || 0, o.kind, arr3(c)]);
    for (const hl of this.helis) { // explosão perto do Gavião (mesma conta do offline)
      if (!hl.alive || !this.heliFoe(hl, owner)) continue;
      const d = dist(c, this.heliAt(hl)), reach = o.radius + HELI.hit * 0.4; if (d < reach) this.hurtHeli(hl, o.maxDmg * (0.35 + 0.65 * (1 - d / reach)), owner);
    }
    const hits = explosionHits(c, o, this.live(), (a, b) => this.P.losClear(a, b), owner, this.teamMode, direct);
    for (const h of hits) {
      const e = h.e; e.lastKnock = this.T;
      if (e.bot) { e.vel.x += h.knock.x; e.vel.z += h.knock.z; e.vel.y = Math.max(e.vel.y, h.knock.y); e.onGround = false; }
      else this.toMe(e, ['kn', arr3(h.knock)]); // empurrão aplicado pelo próprio cliente (rocket jump)
      this.damage(e, h.dmg, owner, o.wIdx, false, false, o.ks || null);
    }
    return hits;
  }
  throwNade(e, o, v) {
    const n = { id: this.projId++, owner: e, pos: { ...o }, vel: { ...v }, explodeAt: this.T + NADE.fuse };
    this.nades.push(n); this.events.push(['nd', n.id, e.id, arr3(o), arr3(v)]);
  }
  launchRocket(e, o, d) {
    const R = WEAPONS[3].rocket, near = this.P.rayWorld(o, d, 0.7);
    this.events.push(['sh', e.id, 3, arr3(o), []]);
    if (near !== null) { const t = Math.max(0, near - 0.12); this.blast({ x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t }, e, { ...R, wIdx: 3, kind: 'r' }); return; }
    const r = { id: this.projId++, owner: e, pos: { x: o.x + d.x * 0.6, y: o.y + d.y * 0.6, z: o.z + d.z * 0.6 }, dir: d, born: this.T };
    this.rockets.push(r); this.events.push(['rk', r.id, e.id, arr3(r.pos), arr3(d)]);
  }
  stepProjectiles(dt) {
    for (let i = this.nades.length - 1; i >= 0; i--) {
      const n = this.nades[i]; for (let s = 0; s < 2; s++) this.P.stepNade(n.pos, n.vel, dt / 2);
      if (this.T >= n.explodeAt) { this.nades.splice(i, 1); this.blast({ ...n.pos }, n.owner, { radius: NADE.radius, maxDmg: NADE.maxDmg, selfMul: NADE.selfMul, knock: NADE.knock, lift: NADE.lift, wIdx: W_NADE, kind: 'n', pid: n.id }); }
    }
    const R = WEAPONS[3].rocket;
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i], step = R.speed * dt; let hitT = this.P.rayWorld(r.pos, r.dir, step + 0.1), hitE = null;
      for (const e of this.ents.values()) {
        if (!e.alive || (!e.bot && !e.connected) || (e === r.owner && this.T - r.born < 0.3)) continue;
        if (this.friends(e, r.owner)) continue;
        const t = rayCapsule(r.pos, r.dir, step + 0.1, e.pos, ROCKET_PAD, e.crouch); if (t !== null && (hitT === null || t < hitT)) { hitT = t; hitE = e; } // casco do Docão
      }
      if (hitT !== null || this.T - r.born > 6) {
        const t = Math.max(0, (hitT ?? 0) - 0.05); this.rockets.splice(i, 1);
        this.blast({ x: r.pos.x + r.dir.x * t, y: r.pos.y + r.dir.y * t, z: r.pos.z + r.dir.z * t }, r.owner, { ...R, wIdx: 3, kind: 'r', pid: r.id }, hitE); continue;
      }
      r.pos.x += r.dir.x * step; r.pos.y += r.dir.y * step; r.pos.z += r.dir.z * step;
    }
  }
  // ---------- renascimento e pickups ----------
  pickSpawn(e) {
    let best = this.spawns[0], bd = -Infinity;
    for (const s of this.spawns) {
      let md = 1e9, seen = false; const eye = { x: s.x, y: s.y + 1.5, z: s.z };
      for (const o of this.ents.values()) { if (o === e || !o.alive || this.friends(o, e)) continue; const d = dist(o.pos, s); md = Math.min(md, d); if (!seen && d < 60 && this.P.losClear(eye, center(o, 1.5))) seen = true; }
      const score = Math.min(md, 40) + Math.random() * 6 - (seen ? 30 : 0); if (score > bd) { bd = score; best = s; }
    }
    return best;
  }
  spawn(e, silent = false) {
    const s = this.pickSpawn(e); e.pos = { ...s }; e.vel = { x: 0, y: 0, z: 0 }; e.crouch = 0; e.hp = 100; e.alive = true; resetRegen(e); e.needRs = false; e.rsReq = false; e.invulnUntil = this.T + INVULN; e.sq++;
    if (e.bot && Math.random() < 0.3) e.nextPrimary = pick(BOT_PRIMARIES);
    e.primary = e.nextPrimary; e.secondary = e.nextSecondary ?? PISTOL; e.melee = e.nextMelee ?? KNIFE; e.slots = [e.primary, e.secondary, e.melee]; e.weapon = e.primary; e.knifeMode = false; e.mag = WEAPONS.map((w) => w.mag); e.reserve = WEAPONS.map((w) => w.reserve); e.reload = null; e.nades = NADE.spawnWith;
    e.yaw = Math.atan2(-s.x, -s.z); e.pitch = 0; // modelo olhando pro centro
    if (e.dummy) { this.placeDummy(e); e.invulnUntil = this.T; e.slots = [0, PISTOL, KNIFE]; }
    e.hist = []; this.pushHist(e); e.lastUpd = this.now();
    if (e.bot) Object.assign(e, { target: null, wp: null, path: null, stuck: 0, reloadEnd: 0 });
    this.events.push(['sp', e.id, arr3(e.pos), r2(e.yaw), e.primary, e.sq]);
  }
  refillAmmo(e) {
    let got = false;
    for (const i of e.slots) { const w = WEAPONS[i]; if (e.reserve[i] >= w.reserve) continue; e.reserve[i] = w.rocket ? Math.min(w.reserve, e.reserve[i] + 1) : w.reserve; got = true; }
    return got;
  }
  updatePickups() {
    this.pickups.forEach((p, i) => {
      if (!p.active) { if (this.T >= p.respawnAt) { p.active = true; this.events.push(['pk', i, 1]); } return; }
      for (const e of this.ents.values()) {
        if (!e.alive || (!e.bot && !e.connected)) continue;
        const dx = e.pos.x - p.pos.x, dz = e.pos.z - p.pos.z; if (dx * dx + dz * dz > 1.5 || Math.abs(e.pos.y - p.pos.y) > 1.5) continue;
        if (p.type === 'health') { if (e.hp >= 100) continue; e.hp = Math.min(100, e.hp + 50); }
        else if (p.type === 'grenade') { if (e.nades >= NADE.max) continue; e.nades++; }
        else if (!this.refillAmmo(e)) continue;
        p.active = false; p.respawnAt = this.T + (p.type === 'grenade' ? NADE.pickupRespawn : 15);
        this.events.push(['pk', i, 0]); if (!e.bot) this.toMe(e, ['got', p.type, Math.round(e.hp), e.nades]);
        break;
      }
    });
  }
  // bacon que cura: quem pisar (vivo, menos o próprio morto, com vida < 100) ganha +10 e o bacon some; evento 'bc' pra todos
  updateBacons() {
    if (!this.bacons.length) return;
    const R2 = BACON_ITEM.radius * BACON_ITEM.radius;
    this.bacons = this.bacons.filter((b) => {
      const age = this.T - b.born; if (age >= BACON_ITEM.life) return false; if (age < BACON_ITEM.from) return true;
      for (const e of this.ents.values()) {
        if (!e.alive || e.id === b.id || (!e.bot && !e.connected) || e.hp >= 100) continue;
        const dx = e.pos.x - b.x, dz = e.pos.z - b.z; if (dx * dx + dz * dz > R2 || Math.abs(e.pos.y - b.y) >= BACON_ITEM.dy) continue;
        e.hp = Math.min(100, e.hp + BACON_ITEM.heal); this.events.push(['bc', b.id, e.id, Math.round(e.hp)]); return false;
      }
      return true;
    });
  }
  toMe(e, ev) { if (e.bot) return; if (!this.personal.has(e.id)) this.personal.set(e.id, []); this.personal.get(e.id).push(ev); }
  // ---------- laço do servidor (20 Hz) ----------
  tick() {
    if (this.state !== 'playing') return;
    const t = this.now(); let dt = clamp(t - this.lastTick, 0, 0.25); this.lastTick = t;
    this.T = t - this.t0; this.purge();
    while (dt > 1e-4) { const h = Math.min(TICK, dt); dt -= h; for (const e of this.ents.values()) if (e.bot) this.updateBot(e, h); this.stepProjectiles(h); this.stepHelis(h); }
    this.stepNukes();
    for (const e of this.ents.values()) {
      if (!e.alive && (e.bot || e.connected) && this.T >= e.respawnAt && !(e.needRs && !e.rsReq && this.T < e.respawnAt + RS_SAFETY) && !(e.pendingTeam && this.now() - (e.pendingSince || 0) < PENDING_WAIT)) { if (e.pendingTeam) { e.pendingTeam = false; this.syncBots(); } this.spawn(e); }
      if (e.bot) this.pushHist(e);
      if (!e.bot && e.alive) this.progressReload(e);
      if (this.training && !e.bot && e.alive) { // munição de reserva infinita e Copo Bomba volta sozinho
        for (const w of e.slots) e.reserve[w] = WEAPONS[w].reserve;
        if (e.nades < NADE.max && this.T - (e.lastNadeT ?? -9) > TRAIN.nadeRefill) e.nades = NADE.max;
      }
    }
    this.updatePickups(); this.updateBacons();
    { const rt = clamp(this.T - (this.lastRegenT ?? this.T), 0, 0.25); this.lastRegenT = this.T; for (const e of this.ents.values()) regenStep(e, this.T, rt); }
    if (this.zone) this.updateZone(TICK_DT(this));
    const snap = { t: 's', T: r2(this.T), d: this.zoneArr() || undefined, e: [...this.ents.values()].filter((e) => e.bot || e.connected).map((e) => [e.id, r2(e.pos.x), r2(e.pos.y), r2(e.pos.z), r2(e.yaw), r2(e.pitch), e.weapon,
      (e.alive ? 1 : 0) | (this.T < e.invulnUntil ? 2 : 0) | (e.onGround ? 4 : 0) | ((e.bot ? e.reloadEnd > this.T : !!e.reload) ? 8 : 0) | (e.regenOn ? 16 : 0), Math.round(e.hp), e.ping, r2(e.crouch)]), ev: this.events };
    this.events = [];
    this.io.broadcast(snap);
    for (const [id, evs] of this.personal) this.io.send(id, { t: 'p', ev: evs }); this.personal.clear();
    if (this.pendingEnd || this.T >= this.timeLimit) { this.pendingEnd = false; this.endMatch(); }
  }
  updateZone(dt) {
    const z = this.zone, got = stepZone(z, zoneCounts(z, this.live()), dt);
    if (got >= 0) {
      this.teamScore[got]++; for (const e of this.live()) if (e.alive && e.team === got && inZone(z, e.pos)) e.caps++;
      const nz = newZoneState(pickZone(this.nav, z)); this.zone = nz;
      this.events.push(['zc', got, this.teamScore[0], this.teamScore[1], [r2(nz.x), r2(nz.y), r2(nz.z)], [...this.live()].filter((e) => e.caps).map((e) => [e.id, e.caps])]);
      if (this.teamScore[got] >= DOM.WIN_CAPS) this.pendingEnd = true;
    }
  }
  // ---------- bots (mesma lógica dos bots offline, sem Three.js) ----------
  randomWaypoint() { const n = this.nav.randomNode(); return n ? { x: n.x, y: n.y, z: n.z } : { x: rand(-10, 10), y: 0, z: rand(-10, 10) }; }
  steer(b, goal) {
    if (!b.path || !b.pathGoal || dist(b.pathGoal, goal) > 2 || this.T > b.repathAt) { b.path = this.nav.path(b.pos, goal) || []; b.pathGoal = { ...goal }; b.repathAt = this.T + rand(2.5, 3.5); }
    const P = b.path;
    while (P.length) { const n = P[0], dx = n.x - b.pos.x, dz = n.z - b.pos.z; if (dx * dx + dz * dz < 0.8 && Math.abs(n.y - b.pos.y) < 1.4) P.shift(); else break; }
    let tgt = P.length ? P[0] : goal;
    if (P.length > 1 && this.T > (b.nextShortcut || 0)) { b.nextShortcut = this.T + 0.25; const n2 = P[1]; if (Math.abs(n2.y - b.pos.y) < 0.3 && Math.abs(P[0].y - b.pos.y) < 0.3 && Math.hypot(n2.x - b.pos.x, n2.z - b.pos.z) < 3.2 && this.nav.walk(b.pos, n2) >= 0) { P.shift(); tgt = n2; } }
    const vx = tgt.x - b.pos.x, vz = tgt.z - b.pos.z, L = Math.hypot(vx, vz); return L > 0.1 ? { x: vx / L, z: vz / L } : null;
  }
  // Dominação: ponto dentro da zona pra onde o bot vai (null = já está dentro, ou modo sem zona)
  zoneGoal(b) {
    const z = this.zone; if (!z) return null;
    if (inZone(z, b.pos) && Math.hypot(b.pos.x - z.x, b.pos.z - z.z) < DOM.RADIUS * 0.7) return null;
    if (!b.zoneOff || b.zoneOff.z !== z) { const a = rand(0, Math.PI * 2), r = rand(0, DOM.RADIUS * 0.5); b.zoneOff = { z, x: Math.cos(a) * r, zz: Math.sin(a) * r }; }
    return { x: z.x + b.zoneOff.x, y: z.y, z: z.z + b.zoneOff.zz };
  }
  botWeaponFor(b, d) {
    if (d < 3 && this.T > (b.knifeRoll || 0)) { b.knifeRoll = this.T + 1.5; b.knifeMode = Math.random() < 0.45; } // às vezes saca a faca colado no alvo
    if (b.knifeMode && d < 7) return b.slots[2] ?? KNIFE; if (d >= 7) b.knifeMode = false;
    const side = b.slots[1] ?? PISTOL;
    const pr = b.primary; if (pr === 1) return d < 14 ? pr : side;
    if (WEAPONS[pr] && WEAPONS[pr].scope) { const min = pr === 5 ? 14 : pr === 6 ? 6 : 9; return d >= min ? pr : side; }
    if (pr === 3) return d >= 6 && d <= 28 ? pr : side;
    if (pr === UZI) return d < 24 ? pr : side;
    if (pr === P90) return d < 36 ? pr : side;
    if (pr === SEMI) return d < 16 ? pr : side;
    return pr;
  }
  updateBot(b, dt) {
    if (!b.alive) return;
    if (b.dummy) { this.placeDummy(b); return; } // Treino: alvo não pensa, não mira, não atira
    if (b.reloadEnd && this.T >= b.reloadEnd) { b.mag[b.weapon] = WEAPONS[b.weapon].mag; b.reloadEnd = 0; }
    b.think -= dt;
    if (b.think <= 0) {
      b.think = rand(0.18, 0.32); let best = null, bs = 1e9; const eye = center(b, 1.5);
      for (const o of this.ents.values()) {
        if (o === b || !o.alive || (!o.bot && !o.connected) || this.friends(o, b)) continue; const d = dist(o.pos, b.pos); if (d > 55) continue;
        const score = d * (o.id === b.lastAttacker ? 0.5 : 1) * (!o.bot ? 0.85 : 1);
        if (score < bs && this.P.losClear(eye, center(o, 1.2))) { best = o; bs = score; }
      }
      if (best !== b.target) { b.target = best; b.aim = 0; }
      if (best) { b.lastSeen = { ...best.pos }; b.lastSeenAt = this.T; }
    }
    if (b.target && !b.target.alive) b.target = null;
    const t = b.target; let mx = 0, mz = 0, desiredYaw = b.yaw;
    const face = (x, z) => Math.atan2(x, z); // yaw do modelo (o boneco olha pra +z)
    if (t) {
      let tx = t.pos.x - b.pos.x, tz = t.pos.z - b.pos.z; const d = Math.hypot(tx, tz) || 1; tx /= d; tz /= d; desiredYaw = face(tx, tz);
      const want = this.botWeaponFor(b, d); if (want !== b.weapon && !b.reloadEnd) { b.weapon = want; b.nextFire = Math.max(b.nextFire, this.T + 0.35); }
      const range = BOT_RANGE[b.weapon];
      const zg = this.zoneGoal(b);
      if (zg) { const st = this.steer(b, zg); if (st) { mx += st.x * 1.5; mz += st.z * 1.5; } } // Dominação: vai pra zona atirando
      else if (this.zone) { /* dentro da zona: segura a posição, só strafe */ }
      else if (Math.abs(t.pos.y - b.pos.y) > 1.2 && d > 3) { const st = this.steer(b, t.pos); if (st) { mx += st.x; mz += st.z; } }
      else if (b.weapon === KNIFE) { if (d > 1.1) { mx += tx; mz += tz; } } // faca: cola no alvo
      else if (d > range + 3) { mx += tx; mz += tz; } else if (d < range - 3) { mx -= tx; mz -= tz; }
      b.strafeT -= dt; if (b.strafeT <= 0) { b.strafeDir = pick([-1, 1, 1, -1, 0]); b.strafeT = rand(0.6, 1.8); if (Math.random() < 0.15 && b.onGround) b.vel.y = JUMP; }
      mx += tz * b.strafeDir * 0.8; mz += -tx * b.strafeDir * 0.8;
      if (b.nades > 0 && d > 8 && d < 24 && this.T > b.nextNade && b.aim > b.reaction && Math.abs(t.pos.y - b.pos.y) < 3) { if (Math.random() < 0.35) this.botThrow(b, t); else b.nextNade = this.T + rand(1.5, 3); }
      b.aim += dt;
      let diff = desiredYaw - b.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const scopeWait = WEAPONS[b.weapon].scope ? (b.weapon === 5 ? 1.15 : b.weapon === 6 ? 0.45 : 0.8) : 0;
      if (b.aim > b.reaction + scopeWait && Math.abs(diff) < 0.35) this.botShoot(b, t, d);
    } else {
      this.botShootHeli(b); // sem alvo no chão: atira no Gavião inimigo que estiver à vista (como os bots offline)
      let goal = null;
      const near = (type, maxD) => this.pickups.filter((p) => p.active && p.type === type && dist(p.pos, b.pos) < maxD).sort((a, c) => dist(a.pos, b.pos) - dist(c.pos, b.pos))[0];
      const hp = b.hp < 45 ? near('health', 1e9) : null, np = !hp && b.nades < 2 ? near('grenade', 22) : null;
      const zg = this.zoneGoal(b);
      let bc = null; if (b.hp < 60) { let bd = 12; for (const x of this.bacons) { if (x.id === b.id || this.T - x.born < BACON_ITEM.from || Math.abs(x.y - b.pos.y) >= BACON_ITEM.dy) continue; const d = dist(x, b.pos); if (d < bd) { bd = d; bc = x; } } }
      if (bc) goal = bc; else if (hp && b.hp < 30) goal = hp.pos; else if (zg) goal = zg; else if (this.zone) goal = b.pos; else if (hp) goal = hp.pos; else if (np) goal = np.pos; else if (b.lastSeen && this.T - b.lastSeenAt < 4) goal = b.lastSeen; else { if (!b.wp) b.wp = this.randomWaypoint(); goal = b.wp; }
      const gx = goal.x - b.pos.x, gz = goal.z - b.pos.z;
      if (Math.hypot(gx, gz) < 1.5 && Math.abs(goal.y - b.pos.y) < 1.5 && !(bc && Math.hypot(gx, gz) > 0.1)) { if (goal === b.wp) b.wp = null; else b.lastSeenAt = -99; }
      else { const st = this.steer(b, goal) || { x: gx / Math.hypot(gx, gz), z: gz / Math.hypot(gx, gz) }; mx = st.x; mz = st.z; desiredYaw = face(st.x, st.z); }
      if (b.mag[b.weapon] < WEAPONS[b.weapon].mag * 0.5 && !b.reloadEnd) b.reloadEnd = this.T + WEAPONS[b.weapon].reload;
    }
    const sp = BOT_SPEED * (WEAPONS[b.weapon].move || (b.weapon === KNIFE ? MELEE.speedMul : 1)), ml = Math.hypot(mx, mz); if (ml > 0) { mx = mx / ml * sp; mz = mz / ml * sp; }
    const acc = b.onGround ? 10 : 3; b.vel.x += (mx - b.vel.x) * Math.min(1, acc * dt); b.vel.z += (mz - b.vel.z) * Math.min(1, acc * dt);
    const blocked = this.P.moveEntity(b, dt);
    if (blocked) { b.stuck += dt; if (b.onGround) b.vel.y = JUMP; if (b.stuck > 1.2) { b.wp = this.randomWaypoint(); b.path = null; b.lastSeenAt = -99; b.strafeDir *= -1; b.stuck = 0; b.stuckCount = (b.stuckCount || 0) + 1; } }
    else b.stuck = Math.max(0, b.stuck - dt);
    let d = desiredYaw - b.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); b.yaw += d * Math.min(1, dt * 9);
    for (const i of b.slots) if (b.reserve[i] < WEAPONS[i].mag && !(WEAPONS[i].rocket && b.reserve[i] > 0)) b.reserve[i] = WEAPONS[i].reserve;
  }
  botShoot(b, t, d) {
    const w = WEAPONS[b.weapon];
    if (b.weapon === SABER) {
      if (this.T < b.nextFire || d > w.reach) return;
      b.nextFire = this.T + w.rate;
      this.damage(t, w.dmg, b, b.weapon, false);
      return;
    }
    if (this.T < b.nextFire || b.reloadEnd > this.T) return;
    if (w.melee) { // faca dos bots: mesma regra dos humanos
      if (d > MELEE.slash.range + 0.8) return;
      const kind = Math.random() < 0.3 ? 'stab' : 'slash', o = center(b, 1.5), at = center(t, 1.1);
      b.nextFire = this.T + MELEE[kind].rate * rand(1.3, 1.9); b.invulnUntil = Math.min(b.invulnUntil, this.T);
      this.melee(b, kind, o, norm({ x: at.x - o.x, y: at.y - o.y, z: at.z - o.z })); return;
    }
    if (b.mag[b.weapon] <= 0) { b.reloadEnd = this.T + w.reload; return; }
    if (w.rocket && d < 6) return;
    b.mag[b.weapon]--; b.nextFire = this.T + w.rate * ([rand(2.2, 3.4), 1.4, 1.6, 1, rand(1.8, 2.6), 1.15, 1.05][b.weapon] || 1.2); b.invulnUntil = Math.min(b.invulnUntil, this.T);
    const o = center(b, 1.3), tMoving = Math.hypot(t.vel.x, t.vel.z) > 2 ? 1.5 : 1;
    if (w.rocket) { const lead = d / w.rocket.speed, at = { x: t.pos.x + t.vel.x * lead + rand(-0.8, 0.8), y: t.pos.y + 0.25, z: t.pos.z + t.vel.z * lead + rand(-0.8, 0.8) }; const oo = center(b, 1.4); this.launchRocket(b, oo, norm({ x: at.x - oo.x, y: at.y - oo.y, z: at.z - oo.z })); return; }
    const aim = w.scope ? center(t, rand(0.75, 1.15)) : center(t, rand(0.7, 1.6)); aim.x += rand(-0.3, 0.3); aim.z += rand(-0.3, 0.3);
    const base = norm({ x: aim.x - o.x, y: aim.y - o.y, z: aim.z - o.z });
    const spread = w.pellets > 1 ? w.spread * 1.2 : w.scope ? 0.02 * tMoving : b.accuracy * tMoving * (b.weapon === PISTOL ? 0.9 : 1);
    const dirs = []; for (let p = 0; p < Math.max(1, w.pellets); p++) dirs.push(norm({ x: base.x + (Math.random() - 0.5) * 2 * spread, y: base.y + (Math.random() - 0.5) * 2 * spread, z: base.z + (Math.random() - 0.5) * 2 * spread }));
    this.hitscan(b, o, dirs, b.weapon);
    if (w.scope) b.aim = b.reaction * 0.4;
  }
  botShootHeli(b) {
    if (!this.helis.length || this.T < b.nextFire || b.reloadEnd > this.T) return;
    const eye = center(b, 1.5); let hl = null, hp = null;
    for (const h of this.helis) { if (!h.alive || !this.heliFoe(h, b)) continue; const p = this.heliAt(h), d = dist(eye, p); if (d <= 62 && d >= 4 && this.P.losClear(eye, p)) { hl = h; hp = p; break; } }
    if (!hl) return;
    const w = WEAPONS[b.weapon]; if (w.melee || w.rocket || b.weapon === SABER) return;
    if (b.mag[b.weapon] <= 0) { b.reloadEnd = this.T + w.reload; return; }
    b.yaw = Math.atan2(hp.x - b.pos.x, hp.z - b.pos.z);
    b.mag[b.weapon]--; b.nextFire = this.T + w.rate * 1.6; b.invulnUntil = Math.min(b.invulnUntil, this.T);
    const o = center(b, 1.3), base = norm({ x: hp.x - o.x, y: hp.y - o.y, z: hp.z - o.z }), sp = 0.05, dirs = [];
    for (let i = 0; i < Math.max(1, w.pellets); i++) dirs.push(norm({ x: base.x + (Math.random() - 0.5) * 2 * sp, y: base.y + (Math.random() - 0.5) * 2 * sp, z: base.z + (Math.random() - 0.5) * 2 * sp }));
    this.hitscan(b, o, dirs, b.weapon);
  }
  botThrow(b, t) {
    const from = center(b, 1.6), to = { x: t.pos.x + t.vel.x * 0.6 + rand(-1.2, 1.2), y: t.pos.y + 0.2, z: t.pos.z + t.vel.z * 0.6 + rand(-1.2, 1.2) };
    const dx = to.x - from.x, dz = to.z - from.z, T = 0.55 + Math.hypot(dx, dz) / 16, g = -NADE.grav;
    b.nades--; this.throwNade(b, from, { x: dx / T, y: (to.y - from.y + 0.5 * g * T * T) / T, z: dz / T }); b.nextNade = this.T + rand(7, 13);
  }
}
