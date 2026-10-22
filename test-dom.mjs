// Teste offline: Dominação, placar no canto, fogo amigo, explosões, Sniper e tela de morte clicável.
// Uso: SITE=http://localhost:8124/ node test-dom.mjs
import { chromium } from 'playwright';
const SITE = process.env.SITE || 'http://localhost:8124/', SHOTS = process.env.SHOTS || 'screenshots';
const errors = [], fails = []; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FALHA') + ' ' + m); if (!c) fails.push(m); };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message + ' ' + e.stack));
await page.addInitScript(() => { localStorage.setItem('docao.primary', '0'); localStorage.setItem('docao.map', 'arena'); localStorage.setItem('docao.name', 'Matheus'); });
await page.goto(SITE, { waitUntil: 'load' }); await page.waitForTimeout(2000);
const G = (fn, a) => page.evaluate(fn, a); const wait = (ms) => page.waitForTimeout(ms);
const until = async (fn, ms = 8000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, a)) return true; await wait(100); } return false; };
// ---- menu: modo + time
await page.selectOption('#modeSel', 'dom'); await wait(200);
ok(await G(() => !document.getElementById('menuTeam').classList.contains('hidden')), 'menu: seletor de time aparece na Dominação');
await page.click('#menuTeamBtns .teambtn.t0'); await page.selectOption('#botCount', '5');
await G(() => document.getElementById('playBtn').scrollIntoView({ block: 'center' })); await wait(200);
await page.screenshot({ path: `${SHOTS}/17-menu-modo-time.png` });
await page.click('#playBtn'); await wait(1200);
const teams = await G(() => window.__docao.entities.map((e) => [e.name, e.team]));
console.log('times:', JSON.stringify(teams));
ok(await G(() => window.__docao.mode === 'dom' && window.__docao.player.team === 0), 'Dominação offline, jogador no time Vermelho (escolhido)');
const tc = teams.reduce((c, [, t]) => (c[t]++, c), [0, 0]); ok(tc[0] === 3 && tc[1] === 3, `bots completam os dois times (${tc[0]} × ${tc[1]})`);
ok(await G(() => window.__docao.entities.filter((e) => !e.isPlayer).every((e) => e.teamRing && e.teamRing.visible)), 'anel do time no pé dos bots');
// ---- placar no canto
await wait(600);
const rects = await G(() => { const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }; return { lb: r('lb'), score: r('score'), top: r('topbar'), kf: r('killfeed'), dom: r('domhud'), hp: r('bottomleft'), rows: document.querySelectorAll('#lb .row').length, me: !!document.querySelector('#lb .row.me') }; });
const inter = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
ok(rects.lb[0] < 40 && rects.lb[1] < 40 && rects.rows === 6 && rects.me, `placar no canto superior esquerdo com 6 linhas e você destacado (${rects.lb.map(Math.round)})`);
ok(!['score', 'top', 'kf', 'dom', 'hp'].some((k) => inter(rects.lb, rects[k])), 'placar não sobrepõe nada do HUD');
// ---- zona: 1 vs 2 jogadores, contestada
const prep = () => G(() => { const g = window.__docao; for (const e of g.entities) if (!e.isPlayer) { e.frozen = true; e.pos.set(-30 + Math.random(), 0, -30 + Math.random()); e.invulnUntil = g.time + 999; } const p = g.player; p.invulnUntil = g.time + 999; });
await prep(); await wait(300);
const place = (who, dx = 0) => G(([who, dx]) => { const g = window.__docao, z = g.zone; const e = who === 'me' ? g.player : g.entities.find((x) => x.name === who); e.pos.set(z.x + dx, z.y, z.z); e.vel.set(0, 0, 0); if (e.model) e.model.group.position.copy(e.pos); }, [who, dx]);
const away = (who) => G((who) => { const e = window.__docao.entities.find((x) => x.name === who); e.pos.set(-30, 0, 30); }, who);
const rate = async (ms = 1500) => { const a = await G(() => [window.__docao.zone.progress, window.__docao.time]); await wait(ms); const b = await G(() => [window.__docao.zone.progress, window.__docao.time]); return (b[0] - a[0]) / (b[1] - a[1]); };
const mates = await G(() => window.__docao.entities.filter((e) => !e.isPlayer && e.team === 0).map((e) => e.name));
const foes = await G(() => window.__docao.entities.filter((e) => e.team === 1).map((e) => e.name));
await G(() => { const z = window.__docao.zone; z.progress = 0; z.team = -1; });
await place('me'); await wait(200);
const r1 = await rate();
await place(mates[0], 1); await wait(200);
const r2 = await rate();
console.log('progresso/s com 1 e 2:', r1.toFixed(3), r2.toFixed(3));
ok(r1 > 0.1 && r2 > r1 * 1.7, `captura mais rápida com 2 do que com 1 (${(r2 / r1).toFixed(2)}×)`);
await place(foes[0], -1); await wait(300);
const rc = await rate(1000); const cont = await G(() => window.__docao.zone.contested);
ok(cont && Math.abs(rc) < 0.005, 'inimigo dentro: zona contestada, progresso parado');
await page.screenshot({ path: `${SHOTS}/17-zona-contestada.png` });
await away(foes[0]); await wait(300);
await page.screenshot({ path: `${SHOTS}/17-zona-dominacao.png` });
// ---- marcador fora da tela
await G(() => { const g = window.__docao, p = g.player, z = g.zone; p.pos.set(z.x + 12, z.y, z.z); p.yaw = Math.atan2(-(12), 0) + Math.PI * 0; });
await G(() => { const g = window.__docao, p = g.player; p.yaw = Math.atan2(1, 0) + Math.PI; }); await wait(300);
const mk = await G(() => { const m = document.getElementById('zoneMark'); return { vis: !m.classList.contains('hidden'), off: m.dataset.off, x: parseFloat(m.style.left), y: parseFloat(m.style.top) }; });
ok(mk.vis && mk.x >= 0 && mk.x <= 1280 && mk.y >= 0 && mk.y <= 720, `marcador da zona na tela (fora de vista = ${mk.off}, ${JSON.stringify(mk)})`);
await page.screenshot({ path: `${SHOTS}/17-zona-marcador.png` });
let overlapMk = false; // gira 360° com a zona fora de vista: a seta nunca cobre o placar
for (let k = 0; k < 16; k++) { await G((k) => { window.__docao.player.yaw = k * Math.PI / 8; }, k); await wait(120);
  overlapMk ||= await G(() => { const m = document.getElementById('zoneMark'); if (m.classList.contains('hidden')) return false; const a = m.getBoundingClientRect(), b = document.getElementById('tl').getBoundingClientRect(); return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; }); }
ok(!overlapMk, 'seta da zona nunca cobre o placar do canto (16 direções)');
// ---- 5 capturas → vitória
for (let i = 0; i < 6; i++) {
  if ((await G(() => window.__docao.state)) !== 'playing') break;
  const n0 = await G(() => (window.__capLog || []).length);
  await place('me'); for (const [k, m] of mates.entries()) await place(m, k ? -1 : 1);
  await G(() => { const g = window.__docao, z = g.zone; const cs = [[-30, -30], [30, 30], [-30, 30], [30, -30]].sort((a, b) => Math.hypot(b[0] - z.x, b[1] - z.z) - Math.hypot(a[0] - z.x, a[1] - z.z)); for (const e of g.entities) if (e.team !== g.player.team) { e.pos.set(cs[0][0], 0, cs[0][1]); e.vel.set(0, 0, 0); } });
  const got = await until((n) => (window.__capLog || []).length > n || window.__docao.state !== 'playing', 30000, n0);
  if (!got) console.log('captura travada:', JSON.stringify(await G(() => { const z = window.__docao.zone; return { x: z.x, y: z.y, z: z.z, p: z.progress, t: z.team, c: z.contested, me: window.__docao.player.pos.toArray() }; })));
}
ok(await G(() => window.__docao.state === 'over'), 'fim de partida após 5 zonas');
ok(await G(() => window.__docao.teamScore[0] === 5), 'Vermelho com 5 zonas');
ok(await G(() => document.getElementById('winner').textContent.includes('Time Vermelho venceu')), `tela final: "${await G(() => document.getElementById('winner').textContent)}"`);
await page.screenshot({ path: `${SHOTS}/17-vitoria-time.png` });
// ---- fogo amigo + explosões (nova partida)
await page.click('#againBtn'); await wait(1200); await prep();
const ff = await G(() => { const g = window.__docao, p = g.player; const mate = g.entities.find((e) => !e.isPlayer && e.team === p.team), foe = g.entities.find((e) => e.team !== p.team);
  for (const e of [mate, foe]) { e.invulnUntil = 0; e.hp = 100; }
  g.damage(mate, 50, p, 0, false); g.damage(foe, 50, p, 0, false);
  mate.pos.set(0, 0, 0); foe.pos.set(1.5, 0, 0); p.pos.set(25, 0, 25); g.blastAt(0.8, 0.2, 0, 'n', p);
  return { mate: mate.hp, foe: Math.round(foe.hp) }; });
ok(ff.mate === 100 && ff.foe < 50, `sem fogo amigo (tiro e Copo Bomba): companheiro ${ff.mate}, inimigo ${ff.foe}`);
// explosão perto do corpo, mas longe do centro (antes não pegava quase nada)
const edge = await G(() => { const g = window.__docao, foe = g.entities.filter((e) => e.team !== g.player.team)[1]; foe.invulnUntil = 0; foe.hp = 100; foe.pos.set(-10, 0, 10);
  g.blastAt(-10 + 4.9, 1.0, 10, 'r'); return Math.round(100 - foe.hp); });
ok(edge >= 20, `Bazuca a 4,9 m do centro (4,3 m do corpo): ${edge} de dano`);
// acerto direto do foguete no corpo: dano máximo
const dir = await G(async () => { const g = window.__docao, p = g.player, foe = g.entities.filter((e) => e.team !== p.team)[2]; foe.invulnUntil = 0; foe.hp = 300; foe.pos.set(-30, 0, -30); foe.vel.set(0, 0, 0);
  p.pos.set(-22, 0, -22); g.rocketAt([-23, 1.2, -30], [-1, 0, 0], p);
  window.__lastBlast = null; for (let i = 0; i < 200 && !window.__lastBlast; i++) await new Promise((r) => setTimeout(r, 100)); await new Promise((r) => setTimeout(r, 100)); return Math.round(300 - foe.hp); });
console.log('explosão do foguete:', JSON.stringify(await G(() => window.__lastBlast)));
ok(dir >= 119, `foguete direto no Docão: ${dir} de dano (máx. 120)`);
// ---- Sniper: luneta parado = dispersão 0, sem desvio da mira no 1º tiro
await G(() => { window.__docao.setPrimary(2); const g = window.__docao, p = g.player; g.kill(p); }); await wait(3500);
await until(() => window.__docao.player.alive && window.__docao.player.weapon === 2, 20000);
await G(() => { const p = window.__docao.player; p.vel.set(0, 0, 0); p.pitch = 0.05; p.yaw = 0.3; p.invulnUntil = 0; p.mag[2] = 5; });
await page.click('#game'); await wait(300); await G(() => { const p = window.__docao.player; p.pitch = 0.05; p.yaw = 0.3; });
await page.mouse.move(640, 360); await page.mouse.down({ button: 'right' }); await wait(500);
const sc = await G(() => window.__docao.scoped);
console.log('antes do tiro:', JSON.stringify(await G(() => { const g = window.__docao, p = g.player; return { st: g.state, lock: !!document.pointerLockElement, alive: p.alive, w: p.weapon, mag: p.mag[p.weapon], nf: p.nextFire - g.time, sw: p.switchEnd - g.time, rl: p.reloadEnd - g.time, sc: g.scoped, ads: g.ads }; })));
await page.mouse.down(); await wait(80); await page.mouse.up(); await wait(150);
const shot = await G(() => ({ s: window.__lastShot, pitch: window.__docao.player.pitch, yaw: window.__docao.player.yaw }));
await page.mouse.up({ button: 'right' });
const fwd = [-Math.sin(0.3) * Math.cos(0.05), Math.sin(0.05), -Math.cos(0.3) * Math.cos(0.05)];
const dot = shot.s ? shot.s.dir.reduce((a, v, i) => a + v * fwd[i], 0) : 0;
console.log('tiro:', JSON.stringify(shot));
ok(sc && shot.s && shot.s.w === 2 && shot.s.spread === 0, 'Sniper com luneta e parado: dispersão 0');
ok(dot > 0.99999, `raio sai exatamente pelo centro da mira (cos = ${dot.toFixed(6)})`);
ok(Math.abs(shot.pitch - 0.05) < 1e-6 && Math.abs(shot.yaw - 0.3) < 1e-6, 'sem coice deslocando a mira depois do tiro');
await until(() => window.__docao.time >= window.__docao.player.nextFire + 0.05 && window.__docao.ads < 0.05, 20000); await page.mouse.down(); await wait(80); await page.mouse.up(); await wait(100);
await until(() => window.__lastShot && window.__lastShot.spread > 0, 5000);
ok(await G(() => window.__lastShot.spread >= 0.1), `Torresmo sem luneta: dispersão larga (${await G(() => window.__lastShot.spread)})`);
// ---- tela de morte clicável
await G(() => { window.__docao.player.invulnUntil = 0; window.__docao.kill(window.__docao.player); }); await until(() => !document.getElementById('deathpick').classList.contains('hidden'), 6000); // câmera do bacon (1,1 s de jogo) antes dos cartões
const dstate = await G(() => ({ lock: !!document.pointerLockElement, state: window.__docao.state, pick: !document.getElementById('deathpick').classList.contains('hidden') }));
ok(!dstate.lock && dstate.state === 'playing' && dstate.pick, 'ao morrer: mouse solto, sem pausar, cartões de arma visíveis');
await page.screenshot({ path: `${SHOTS}/17-tela-morte-clicavel.png` });
await page.click('#deathList .primchip[data-i="1"]'); await page.click('#deathSec .primchip');
ok(await G(() => window.__docao.selectedPrimary === 1 && window.__docao.spawnHold === 'secondary'), 'clique escolhe a Calibre 12 e "renascer com a pistola na mão"');
await until(() => window.__docao.player.alive, 20000); await wait(300);
ok(await G(() => window.__docao.player.primary === 1 && window.__docao.player.weapon === 4), 'renasceu com Calibre 12 de primária e a pistola na mão');
await page.click('#game'); await wait(300);
ok(await G(() => !!document.pointerLockElement), 'clique trava o mouse de novo');
await G(() => { window.__docao.player.invulnUntil = 0; window.__docao.kill(window.__docao.player); }); await until(() => !document.getElementById('deathpick').classList.contains('hidden'), 6000); // câmera do bacon (1,1 s de jogo) antes dos cartões
await page.keyboard.press('Digit3'); ok(await G(() => window.__docao.selectedPrimary === 2), 'atalho de teclado (3) continua valendo');
await page.waitForFunction(() => !document.getElementById('respawnBtn').disabled, null, { timeout: 8000 }); await page.click('#respawnBtn'); await wait(300); ok(await G(() => !!document.pointerLockElement), 'botão RENASCER trava o mouse');
// ---- placar no mata-mata também
await G(() => window.__docao.endGame()); await page.click('#menuBtn'); await wait(500);
await page.selectOption('#modeSel', 'dm'); await page.click('#playBtn'); await wait(1500);
ok(await G(() => window.__docao.mode === 'dm' && document.querySelectorAll('#lb .row').length >= 5 && document.getElementById('domhud').classList.contains('hidden')), 'mata-mata: placar no canto, sem HUD de zona');
await page.screenshot({ path: `${SHOTS}/17-placar-canto.png` });
console.log('\nERROS:', errors.length ? errors : 'nenhum'); if (errors.length) fails.push('erros de console');
await browser.close(); console.log(fails.length ? `\n${fails.length} FALHA(S)` : '\nTUDO OK'); process.exit(fails.length ? 1 : 0);
