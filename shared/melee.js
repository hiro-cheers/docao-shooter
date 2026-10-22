// ============================================================
//  Faca de churrasqueiro — regra de acerto corpo a corpo (cliente offline + servidor). Sem DOM, sem Three.js.
//  • Alcance: distância do olho do atacante até o PONTO MAIS PRÓXIMO da cápsula do corpo (mesma de shared/combat.js).
//  • Cone: ângulo entre a mira e a direção até esse ponto ≤ cone + "meia largura" aparente do corpo.
//  • Linha de visão livre até o ponto (não corta através de parede).
//  • Pelas costas: o atacante está atrás da vítima (yaw do MODELO da vítima: frente = (sin yaw, cos yaw)) → mata na hora.
//  Escolhe o alvo válido mais próximo (um só por golpe).
// ============================================================
import { MELEE } from './rules.js';
import { bodyClosest, BODY } from './combat.js';
import { stanceScale } from './stance.js';

export const MELEE_KINDS = ['slash', 'stab'];
// eye/dir: {x,y,z} (dir normalizado). targets: [{ e, p: posição (pés), yaw: yaw do modelo }]. los(a, b) → true se livre.
export function meleeHit(eye, dir, kind, targets, los) {
  const K = MELEE[kind] || MELEE.slash; let best = null;
  for (const { e, p, yaw, crouch = e.crouch } of targets) {
    const scale = stanceScale(crouch), bc = bodyClosest(eye, p, crouch); if (bc.d > K.range) continue;
    // direção até o eixo do corpo (na altura do olho, limitada ao tronco)
    const ay = Math.max(p.y + BODY.y0 * scale, Math.min(p.y + BODY.y1 * scale, eye.y));
    const vx = p.x - eye.x, vy = ay - eye.y, vz = p.z - eye.z, L = Math.hypot(vx, vy, vz);
    if (L > 1e-3) {
      const cos = (vx * dir.x + vy * dir.y + vz * dir.z) / L;
      const ang = Math.acos(Math.max(-1, Math.min(1, cos))), half = Math.atan(BODY.r / Math.max(L, BODY.r));
      if (ang > K.cone + half) continue;
    }
    if (bc.d > 0.05 && los && !los(eye, bc.point)) continue;
    if (best && bc.d >= best.dist) continue;
    let back = false;
    const ax = eye.x - p.x, az = eye.z - p.z, al = Math.hypot(ax, az);
    if (al > 0.05 && Number.isFinite(yaw)) back = (Math.sin(yaw) * ax + Math.cos(yaw) * az) / al < MELEE.backDot;
    best = { e, dist: bc.d, back, point: bc.point };
  }
  if (!best) return null;
  best.dmg = best.back ? MELEE.backDmg : K.dmg; best.kind = kind;
  return best;
}
