// Postura compartilhada pela câmera, animação, colisão e combate.
import { HEIGHT, EYE } from './rules.js';

export const CROUCH = { scale: 0.65, speed: 0.5, duration: 0.2 };
export const crouchAmount = (value = 0) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export const stanceScale = (crouch = 0) => 1 - (1 - CROUCH.scale) * crouchAmount(crouch);
export const stanceHeight = (e) => HEIGHT * stanceScale(e.crouch);
export const eyeHeight = (e) => EYE * stanceScale(e.crouch);

// Pés fixos no chão. Ao levantar, só expande se a nova altura couber no mundo.
export function stepCrouch(e, target, dt, physics) {
  const from = crouchAmount(e.crouch), to = crouchAmount(target);
  const step = Math.max(0, dt) / CROUCH.duration;
  const next = from + Math.max(-step, Math.min(step, to - from));
  if (next < from && physics.overlapping(e.pos.x, e.pos.y, e.pos.z, 0, HEIGHT * stanceScale(next))) return from;
  e.crouch = next;
  return next;
}
