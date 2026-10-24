import * as THREE from 'three';
import { BOARD } from '../core/constants';

function canvas(size, height = size) {
  const element = document.createElement('canvas');
  element.width = size;
  element.height = height;
  return element;
}

function hash(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function toTexture(element, { repeat, anisotropy = 4 } = {}) {
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

/** Warm laminated maple with wavy grain and a few knots. */
export function makeWoodTexture() {
  const size = 512;
  const element = canvas(size);
  const ctx = element.getContext('2d');
  const rand = hash(20261024);

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#d9b07a');
  base.addColorStop(0.5, '#cfa06a');
  base.addColorStop(1, '#c4935f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i++) {
    const offset = rand() * size;
    const amplitude = 4 + rand() * 10;
    const phase = rand() * Math.PI * 2;
    const alpha = 0.05 + rand() * 0.12;
    const width = 0.6 + rand() * 2.2;
    ctx.strokeStyle = `rgba(120, 78, 40, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let y = 0; y <= size; y += 8) {
      const x = offset + Math.sin(y / 60 + phase) * amplitude + Math.sin(y / 17 + phase * 2) * 2;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let k = 0; k < 5; k++) {
    const x = rand() * size;
    const y = rand() * size;
    const radius = 4 + rand() * 8;
    const knot = ctx.createRadialGradient(x, y, 0, x, y, radius);
    knot.addColorStop(0, 'rgba(92, 58, 30, 0.55)');
    knot.addColorStop(1, 'rgba(92, 58, 30, 0)');
    ctx.fillStyle = knot;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  return toTexture(element, { repeat: [2, 2] });
}

/** Printed play surface: target circle, dashed centre line, ticks and title. */
export function makeBoardTexture() {
  const width = 1024;
  const height = Math.round((width * BOARD.height) / BOARD.width);
  const element = canvas(width, height);
  const ctx = element.getContext('2d');
  const cx = width / 2;
  const cy = height / 2;
  const unit = width / BOARD.width;

  const surface = ctx.createLinearGradient(0, 0, 0, height);
  surface.addColorStop(0, '#f3eadb');
  surface.addColorStop(0.5, '#efe3d0');
  surface.addColorStop(1, '#f3eadb');
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, width, height);

  // Subtle woven panel lines.
  ctx.strokeStyle = 'rgba(160, 130, 96, 0.16)';
  ctx.lineWidth = 2;
  const panel = 64 * unit;
  for (let x = panel; x < width; x += panel) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Centre target.
  ctx.strokeStyle = 'rgba(178, 34, 34, 0.55)';
  ctx.lineWidth = 3 * unit;
  ctx.beginPath();
  ctx.arc(cx, cy, 66 * unit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5 * unit;
  ctx.beginPath();
  ctx.arc(cx, cy, 30 * unit, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(178, 34, 34, 0.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, 12 * unit, 0, Math.PI * 2);
  ctx.fill();

  // Dashed centre line along the divider.
  ctx.strokeStyle = 'rgba(120, 90, 60, 0.35)';
  ctx.lineWidth = 2 * unit;
  ctx.setLineDash([14 * unit, 10 * unit]);
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tick marks down both sides.
  ctx.strokeStyle = 'rgba(120, 90, 60, 0.3)';
  for (let i = 1; i < 12; i++) {
    const y = (height * i) / 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(12 * unit, y);
    ctx.moveTo(width, y);
    ctx.lineTo(width - 12 * unit, y);
    ctx.stroke();
  }

  // Title on the opponent's side, readable from the player's oblique camera.
  ctx.save();
  ctx.translate(cx, 150 * unit);
  ctx.fillStyle = 'rgba(92, 64, 38, 0.5)';
  ctx.font = `bold ${30 * unit}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SLING PUCK', 0, 0);
  ctx.restore();

  return toTexture(element, { anisotropy: 8 });
}

/** Concentric lathe rings with an off-centre dot, tinted by puck colour. */
export function makePuckTopTexture(color) {
  const size = 256;
  const element = canvas(size);
  const ctx = element.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const ivory = color === 'ivory';

  ctx.fillStyle = ivory ? '#f1e6cf' : '#241d18';
  ctx.fillRect(0, 0, size, size);

  for (const [radius, wide, alpha] of [[118, 6, 0.5], [96, 2, 0.35], [74, 4, 0.45], [52, 1.5, 0.3]]) {
    ctx.strokeStyle = ivory ? `rgba(140, 110, 70, ${alpha})` : `rgba(214, 188, 140, ${alpha})`;
    ctx.lineWidth = wide;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const dot = ctx.createRadialGradient(cx + 34, cy - 34, 0, cx + 34, cy - 34, 40);
  dot.addColorStop(0, ivory ? 'rgba(120, 92, 56, 0.6)' : 'rgba(230, 206, 160, 0.6)');
  dot.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(cx + 34, cy - 34, 40, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(element, { anisotropy: 8 });
}

export function makeGlowTexture() {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 214, 120, 0.9)');
  gradient.addColorStop(0.45, 'rgba(255, 190, 80, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return toTexture(element);
}

export function makeEnvironmentTexture() {
  const element = canvas(1024, 512);
  const ctx = element.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#f4f1ea');
  gradient.addColorStop(0.4, '#c8c2b6');
  gradient.addColorStop(0.6, '#5d5850');
  gradient.addColorStop(1, '#1c1a17');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  // A soft window highlight used for glossy reflections.
  const window = ctx.createRadialGradient(300, 110, 10, 300, 110, 220);
  window.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  window.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = window;
  ctx.fillRect(0, 0, 1024, 512);
  const texture = toTexture(element);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}

export function makeSoftShadowTexture() {
  const size = 128;
  const element = canvas(size);
  const ctx = element.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return toTexture(element);
}
