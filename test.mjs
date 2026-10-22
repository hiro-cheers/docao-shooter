import { chromium } from 'playwright';
const errors = [];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
await page.goto(process.env.SITE || 'http://localhost:8123/', { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'screenshots/01-menu.png' });
await page.click('#skinNext'); await page.waitForTimeout(600);
await page.screenshot({ path: 'screenshots/08-menu-skin-clube.png' });
console.log('skin salva:', await page.evaluate(() => localStorage.getItem('docao.skin')));
// loadout: escolhe o Sniper no menu e confere que fica salvo
await page.click('#primList .primchip[data-i="2"]'); await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshots/12-menu-loadout.png' });
console.log('primária salva:', await page.evaluate(() => localStorage.getItem('docao.primary')));
await page.reload(); await page.waitForTimeout(1500);
console.log('primária após recarregar:', await page.evaluate(() => document.querySelector('#primList .primchip.active').textContent));
await page.click('#primList .primchip[data-i="0"]'); // começa de Fuzil pros testes antigos
console.log('skin após recarregar:', await page.evaluate(() => document.getElementById('skinName').textContent));
await page.click('#skinNext'); await page.waitForTimeout(600);
await page.screenshot({ path: 'screenshots/09-menu-skin-rei-do-pop.png' });
await page.fill('#nameInput', 'Matheus');
await page.click('#playBtn');
await page.waitForTimeout(1500);
// vira pro bot mais próximo e anda
const aim = () => page.evaluate(() => {
  const g = window.__docao, p = g.player; let best = null, bd = 1e9;
  for (const e of g.entities) if (!e.isPlayer && e.alive && g.visible(e)) { const d = e.pos.distanceTo(p.pos); if (d < bd) { bd = d; best = e; } }
  if (!best) return null;
  const dx = best.pos.x - p.pos.x, dz = best.pos.z - p.pos.z, dy = best.pos.y + 1 - (p.pos.y + 1.6);
  p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(dy, Math.hypot(dx, dz)); return { name: best.name, d: bd };
});
await page.keyboard.down('KeyW'); await page.waitForTimeout(1200); await page.keyboard.up('KeyW');
console.log('aim', await aim());
// posiciona o jogador perto de um bot pra screenshot de gameplay
await page.evaluate(() => { const g = window.__docao, p = g.player; const b = g.entities.find((e) => !e.isPlayer && e.alive);
  for (const e of g.entities) if (!e.isPlayer) { e.think = 99; e.target = null; }
  b.pos.set(0, 0, 18.5); b.vel.set(0,0,0); b.frozen = true; b.invulnUntil = 0; b.bubble.visible = false; window.__frozen = b; b.yaw = 0.25; b.model.group.rotation.y = 0.25; p.pos.set(1.2, 0, 24.5); p.vel.set(0,0,0); g.time = 10; });
await page.waitForTimeout(400); await aim();
await page.waitForTimeout(200); await page.screenshot({ path: 'screenshots/02-gameplay.png' });
await page.evaluate(() => { window.__frozen.frozen = false; for (const e of window.__docao.entities) if (!e.isPlayer) e.think = 0; });
// atira algumas vezes
for (let i = 0; i < 3; i++) { await aim(); await page.mouse.down(); await page.waitForTimeout(350); await page.mouse.up(); }
await page.waitForTimeout(100);
await aim(); await page.mouse.down(); await page.waitForTimeout(120);
await page.screenshot({ path: 'screenshots/03-tiroteio.png' });
await page.mouse.up();
await page.keyboard.press('Digit2'); await page.waitForTimeout(600);
await aim(); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); await page.waitForTimeout(40);
await page.screenshot({ path: 'screenshots/04-pistola.png' });
// deixa rodar um tempo pros bots lutarem
await page.waitForTimeout(12000);
const st = await page.evaluate(() => window.__docao.entities.map((e) => `${e.name}: ${e.kills}/${e.deaths} hp${Math.round(e.hp)} (${e.pos.x.toFixed(1)},${e.pos.y.toFixed(1)},${e.pos.z.toFixed(1)})`));
console.log(st.join('\n'));

// ===== Copo Bomba =====
const prep = () => page.evaluate(() => {
  const g = window.__docao, p = g.player;
  for (const e of g.entities) if (!e.isPlayer) { e.think = 999; e.target = null; e.nades = 0; }
  for (const n of g.grenades) n.explodeAt = g.time + 0.01;
  p.alive = true; p.hp = 100; p.invulnUntil = g.time + 999; p.nades = 3; p.vel.set(0, 0, 0);
});
await prep(); await page.waitForTimeout(300); await prep();
await page.evaluate(() => { const g = window.__docao, p = g.player; const b = g.entities.find((e) => !e.isPlayer);
  b.frozen = true; b.alive = true; b.hp = 100; b.invulnUntil = 0; b.bubble.visible = false; b.model.group.visible = true; b.model.group.scale.set(1, 1, 1);
  b.pos.set(0, 0, 14); b.yaw = 0; p.pos.set(0, 0, 25); p.yaw = 0; p.pitch = 0.05; window.__victim = b; });
await page.waitForTimeout(300);
await page.keyboard.down('KeyQ'); await page.waitForTimeout(900);
await page.screenshot({ path: 'screenshots/10-granada-carregando.png' });
const charging = await page.evaluate(() => window.__docao.player.charging);
await page.keyboard.up('KeyQ');
const thrown = await page.evaluate(() => ({ n: window.__docao.grenades.length, nades: window.__docao.player.nades }));
// quando o copo estiver quase explodindo, coloca a vítima do lado (teste determinístico do dano/abate)
await page.waitForFunction(() => { const n = window.__docao.grenades.find((x) => x.owner.isPlayer); return n && n.explodeAt - window.__docao.time < 0.35; }, null, { timeout: 30000 });
const ex0 = await page.evaluate(() => { const g = window.__docao; const n = g.grenades.find((x) => x.owner.isPlayer); const v = window.__victim;
  v.pos.set(n.pos.x + 1.2, 0, n.pos.z + 0.6); v.yaw = Math.PI; const p = g.player; p.yaw = Math.atan2(-(n.pos.x - p.pos.x), -(n.pos.z - p.pos.z)); p.pitch = -0.12; return g.explosions; });
await page.waitForFunction((e0) => window.__docao.explosions > e0, ex0, { timeout: 30000, polling: 16 });
await page.waitForTimeout(60);
await page.screenshot({ path: 'screenshots/10-granada-explosao.png' });
await page.waitForTimeout(250);
await page.screenshot({ path: 'screenshots/10-granada-explosao-confete.png' });
const result = await page.evaluate(() => ({ victimAlive: window.__victim.alive, victimHp: Math.round(window.__victim.hp), feed: (window.__feedLog || []).filter((t) => t.includes('Copo Bomba')).pop() || '' }));
console.log('granada:', JSON.stringify({ charging, thrown, ...result }));
await page.evaluate(() => { window.__victim.frozen = false; });
// pickup no chão
await page.evaluate(() => { const g = window.__docao, p = g.player; const pk = g.pickups.find((x) => x.type === 'grenade' && x.pos.y < 0.5);
  pk.active = true; pk.mesh.visible = true; p.nades = 1; p.pos.set(pk.pos.x - 2.6, 0, pk.pos.z + 2.6); p.vel.set(0, 0, 0);
  p.yaw = Math.atan2(-(pk.pos.x - p.pos.x), -(pk.pos.z - p.pos.z)); p.pitch = -0.28; window.__pk = pk; });
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshots/10-granada-pickup.png' });
await page.evaluate(() => { const p = window.__docao.player; p.pos.set(window.__pk.pos.x, 0, window.__pk.pos.z); });
await page.waitForTimeout(300);
console.log('pickup:', JSON.stringify(await page.evaluate(() => ({ nades: window.__docao.player.nades, pickupActive: window.__pk.active, hud: [0, 1, 2].map((i) => document.getElementById('nade' + i).classList.contains('on')) }))));

// mira com zoom (botão direito)
const waitGame = async (sec) => { const t0 = await page.evaluate(() => window.__docao.time); await page.waitForFunction((t) => window.__docao.time >= t, t0 + sec, { timeout: 30000, polling: 16 }); };
await page.evaluate(() => { const g = window.__docao, p = g.player; p.alive = true; p.hp = 100; p.weapon = 0; p.reloadEnd = 0; p.switchEnd = 0; p.mag[0] = 30; p.mag[1] = 6; p.vel.set(0, 0, 0);
  p.pos.set(0, 0, 26); p.yaw = 0; p.pitch = 0.02; p.invulnUntil = g.time + 999;
  const b = g.entities.find((e) => !e.isPlayer); b.frozen = true; b.alive = true; b.hp = 100; b.bubble.visible = false; b.model.group.visible = true; b.model.group.scale.set(1, 1, 1); b.pos.set(0.3, 0, 17.5); b.yaw = 0; });
const zoomRes = {};
await page.mouse.click(640, 360); await waitGame(0.1);
zoomRes.locked = await page.evaluate(() => !!document.pointerLockElement);
const yawAfterMove = () => page.evaluate(() => { const p = window.__docao.player, y0 = p.yaw; document.dispatchEvent(new MouseEvent('mousemove', { movementX: 100 })); const d = y0 - p.yaw; p.yaw = y0; return +d.toFixed(4); });
zoomRes.fovNormal = await page.evaluate(() => window.__docao.fov);
zoomRes.yawNormal = await yawAfterMove();
await page.mouse.down({ button: 'right' }); await waitGame(0.3);
zoomRes.fovRifle = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
zoomRes.yawZoom = await yawAfterMove();
await page.evaluate(() => { window.__docao.player.yaw = 0; window.__docao.player.pitch = 0.02; }); await waitGame(0.1);
await page.screenshot({ path: 'screenshots/11-zoom.png' });
await page.keyboard.down('KeyW'); await waitGame(0.6);
zoomRes.speedZoom = +(await page.evaluate(() => Math.hypot(window.__docao.player.vel.x, window.__docao.player.vel.z))).toFixed(2);
await page.mouse.up({ button: 'right' }); await waitGame(0.6);
zoomRes.speedNormal = +(await page.evaluate(() => Math.hypot(window.__docao.player.vel.x, window.__docao.player.vel.z))).toFixed(2);
await page.keyboard.up('KeyW');
await page.mouse.down({ button: 'right' }); await page.keyboard.press('Digit2'); await waitGame(0.7);
zoomRes.fovPistol = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
await page.evaluate(() => { window.__docao.player.nades = 2; });
await page.keyboard.down('KeyQ'); await waitGame(0.5);
zoomRes.chargingWhileZoom = await page.evaluate(() => window.__docao.player.charging && window.__docao.ads === 1);
await page.screenshot({ path: 'screenshots/11-zoom-copo.png' });
await page.keyboard.up('KeyQ'); await waitGame(0.05);
zoomRes.thrownWhileZoom = await page.evaluate(() => window.__docao.player.nades === 1 && !window.__docao.player.charging);
await page.evaluate(() => { window.__docao.player.mag[4] = 2; }); await page.keyboard.press('KeyR'); await waitGame(0.4);
zoomRes.fovDuringReload = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
await waitGame(2.0);
zoomRes.fovAfterReload = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
await page.mouse.up({ button: 'right' }); await waitGame(0.4);
zoomRes.fovReleased = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
console.log('zoom:', JSON.stringify(zoomRes));
await page.evaluate(() => { window.__docao.entities.forEach((e) => (e.frozen = false)); window.__docao.player.weapon = 0; });



// ===== Armas: cada primária escolhida pela tela de morte + pistola =====
const W = {};
const setupTarget = (z, x = 6) => page.evaluate(([z, x]) => { const g = window.__docao, p = g.player;
  for (const e of g.entities) if (!e.isPlayer) { e.think = 999; e.target = null; e.nades = 0; e.frozen = true; }
  const b = g.entities.find((e) => !e.isPlayer); b.frozen = true; b.alive = true; b.hp = 100; b.invulnUntil = 0; b.bubble.visible = false; b.model.group.visible = true; b.model.group.scale.set(1, 1, 1);
  b.pos.set(x, 0, z); b.yaw = 0; window.__t = b;
  p.alive = true; p.hp = 100; p.pos.set(6, 0, 26); p.vel.set(0, 0, 0); p.invulnUntil = g.time + 999; p.reloadEnd = 0; p.switchEnd = 0; p.nextFire = 0; p.mag = g.WEAPONS.map((w) => w.mag);
  const dx = b.pos.x - p.pos.x, dz = b.pos.z - p.pos.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(b.pos.y + 0.85 - (p.pos.y + 1.6), Math.hypot(dx, dz)); }, [z, x]);
const equipViaDeath = async (k) => { // morre, aperta [k] na tela de morte, renasce com a primária escolhida
  await page.evaluate(() => { const g = window.__docao, p = g.player; p.alive = false; p.hp = 0; p.deathAt = g.time; p.respawnAt = g.time + 1.8; });
  await waitGame(1.25); // câmera do bacon (1,1 s) antes dos cartões
  const pickVisible = await page.evaluate(() => !document.getElementById('deathpick').classList.contains('hidden'));
  await page.keyboard.press('Digit' + k); await waitGame(0.1);
  if (k === 6) { await page.evaluate(() => { window.__docao.player.respawnAt = window.__docao.time + 30; }); await page.screenshot({ path: 'screenshots/12-tela-morte-escolha.png' }); await page.evaluate(() => { window.__docao.player.respawnAt = window.__docao.time; }); }
  await page.waitForFunction(() => window.__docao.player.alive, null, { timeout: 30000, polling: 16 });
  return { pickVisible, primary: await page.evaluate(() => window.__docao.player.primary), weapon: await page.evaluate(() => window.__docao.player.weapon) };
};
const shoot = async () => { await page.mouse.down(); await waitGame(0.05); await page.mouse.up(); };
const tState = () => page.evaluate(() => ({ alive: window.__t.alive, hp: Math.round(window.__t.hp), feed: (window.__feedLog || []).slice(-1)[0] || '' }));
// 1) Fuzil
W.rifle = await equipViaDeath(1); await setupTarget(16); await waitGame(0.2); await shoot(); await waitGame(0.1); W.rifle.target = await tState();
// 2) Calibre 12: tiro de perto, pump, recarga cartucho a cartucho interrompível
W.cal12 = await equipViaDeath(2); await setupTarget(22.5); await waitGame(0.2);
await shoot(); W.cal12.target = await tState();
W.cal12.pump = await page.evaluate(() => +(window.__docao.player.nextFire - window.__docao.time).toFixed(2));
await waitGame(0.3); await page.screenshot({ path: 'screenshots/12-calibre12.png' });
await waitGame(0.6);
await page.evaluate(() => { window.__docao.player.mag[1] = 3; }); await page.keyboard.press('KeyR'); await waitGame(1.25);
W.cal12.magDuringReload = await page.evaluate(() => window.__docao.player.mag[1]);
await shoot(); await waitGame(0.05);
W.cal12.reloadInterrupted = await page.evaluate(() => window.__docao.player.reloadEnd === 0);
W.cal12.magAfterShot = await page.evaluate(() => window.__docao.player.mag[1]);
// 3) Sniper: luneta parado = abate com 1 tiro no corpo a ~30 m
W.sniper = await equipViaDeath(3); await setupTarget(-4); await waitGame(1.0);
await page.mouse.down({ button: 'right' }); await waitGame(0.35);
W.sniper.scoped = await page.evaluate(() => window.__docao.scoped && !document.getElementById('scope').classList.contains('hidden'));
W.sniper.fov = +(await page.evaluate(() => window.__docao.fov)).toFixed(1);
await page.screenshot({ path: 'screenshots/12-sniper-scope.png' });
await shoot(); await waitGame(0.1); W.sniper.target = await tState();
await page.mouse.up({ button: 'right' }); await waitGame(0.3);
// 4) Bazuca: foguete visível com fumaça, abate em área, rocket jump
// tela de morte: 1 Fuzil · 2 Calibre 12 · 3 Sniper · 4 Canhão · 5 Carabina · 6 Bazuca (ordem do PR #1)
W.bazuca = await equipViaDeath(6); await setupTarget(4); await waitGame(0.5);
const bx0 = await page.evaluate(() => window.__docao.explosions);
await shoot(); await waitGame(0.3);
W.bazuca.rocketsInFlight = await page.evaluate(() => window.__docao.rockets.length);
await page.evaluate(() => { const g = window.__docao, p = g.player, r = g.rockets[0]; if (!r) return; p.pos.set(r.pos.x + 3.2, 0, r.pos.z + 2.2); p.vel.set(0, 0, 0);
  const dx = r.pos.x + r.dir.x * 1.5 - p.pos.x, dz = r.pos.z + r.dir.z * 1.5 - p.pos.z; p.yaw = Math.atan2(-dx, -dz); p.pitch = Math.atan2(r.pos.y - (p.pos.y + 1.6), Math.hypot(dx, dz)); });
await page.screenshot({ path: 'screenshots/12-bazuca.png' });
await page.waitForFunction((e0) => window.__docao.explosions > e0, bx0, { timeout: 30000, polling: 16 }); await waitGame(0.1);
W.bazuca.target = await tState();
await page.screenshot({ path: 'screenshots/12-bazuca-explosao.png' });
// rocket jump: olha pro chão e atira
await page.evaluate(() => { const g = window.__docao, p = g.player; for (const e of g.entities) if (!e.isPlayer) { e.frozen = true; e.target = null; } p.alive = true; p.pos.set(-20, 0, 6); p.vel.set(0, 0, 0); p.pitch = -1.5; p.mag[3] = 1; p.reloadEnd = 0; p.nextFire = 0; p.hp = 100; p.invulnUntil = 0; window.__maxY = 0;
  window.__rj = setInterval(() => { window.__maxY = Math.max(window.__maxY, g.player.pos.y); }, 10); });
await waitGame(0.2);
const k0 = await page.evaluate(() => window.__docao.lastKnock);
await shoot(); await waitGame(1.2);
W.rocketJump = await page.evaluate((k0) => { clearInterval(window.__rj); const p = window.__docao.player; return { knocked: window.__docao.lastKnock > k0, peakY: +window.__maxY.toFixed(2), hpAfter: Math.round(p.hp), alive: p.alive }; }, k0);
// 5) Pistolinha Leitão (tecla 2)
await setupTarget(16); await page.keyboard.press('Digit2'); await waitGame(0.5);
W.pistol = { weapon: await page.evaluate(() => window.__docao.player.weapon) };
await shoot(); await waitGame(0.1); W.pistol.target = await tState();
await page.mouse.move(640, 300); await page.mouse.wheel(0, 100); await waitGame(0.5); W.pistol.wheelBackTo = await page.evaluate(() => window.__docao.player.weapon);
await page.keyboard.press('Digit2'); await waitGame(0.5);
await page.screenshot({ path: 'screenshots/12-armas-hud.png' });
W.hudChips = await page.evaluate(() => [document.getElementById('slot1').textContent, document.getElementById('slot2').textContent]);
console.log('armas:', JSON.stringify(W));
await page.evaluate(() => { window.__docao.entities.forEach((e) => { e.frozen = false; e.think = 0; }); });
await waitGame(4);
console.log('bots:', await page.evaluate(() => window.__docao.entities.filter((e) => !e.isPlayer).map((e) => `${e.name}:${['Fuzil', 'Cal12', 'Sniper', 'Bazuca'][e.primary]}/${e.weapon}`).join(' ')));
// fantasminha flutuando (bob + rastro) sem erros
console.log('float:', await page.evaluate(async () => { const g = window.__docao; const b = g.entities.find((e) => !e.isPlayer && e.alive); b.float = true; b.frozen = false; b.think = 0;
  const y0 = b.model.group.position.y - b.pos.y; await new Promise((r) => setTimeout(r, 1500)); return { lift: +(b.model.group.position.y - b.pos.y).toFixed(2), y0: +y0.toFixed(2) }; }));
await page.keyboard.down('Tab'); await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshots/05-placar-tab.png' });
await page.keyboard.up('Tab');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.screenshot({ path: 'screenshots/06-pausa.png' });
await page.click('#resumeBtn'); await page.waitForTimeout(300);
await page.evaluate(() => window.__docao.endGame()); await page.waitForTimeout(400);
await page.screenshot({ path: 'screenshots/07-fim-de-jogo.png' });
console.log('state', await page.evaluate(() => window.__docao.state));
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
