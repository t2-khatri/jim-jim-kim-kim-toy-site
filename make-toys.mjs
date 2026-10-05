// Builds three toy models from Three.js primitives and exports them as .glb files.
// Every toy uses the same named parts so the website can animate any of them:
//   armL / armR  -> parts that wave (arms, ears, fins)
//   glow         -> part that lights up
//   pop          -> part that pops out (head, nose cone)
//   eyeL / eyeR  -> eye groups that blink (scaled on Y by the website)
// The website's "Build your own" section also reuses the head (pop), the arms and the body.
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Minimal FileReader polyfill so GLTFExporter can write binary in Node
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(b => { this.result = b; this.onloadend && this.onloadend(); this.onload && this.onload({ target: this }); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(b => { this.result = 'data:application/octet-stream;base64,' + Buffer.from(b).toString('base64'); this.onloadend && this.onloadend(); }); }
};

THREE.Object3D.prototype.scl = function (x, y, z) { this.scale.set(x, y, z); return this; };
const C = { red: 0xF0533A, yellow: 0xFFC83D, blue: 0x3FA7F5, mint: 0x52D6A6, ink: 0x2B2240, white: 0xFFFFFF, pink: 0xFF8FB1, cream: 0xFFF1DC };
const mat = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...opts });
const glowMat = (color) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.3 });

function mesh(geo, m, pos = [0, 0, 0], name) {
  const o = new THREE.Mesh(geo, m); o.position.set(...pos); if (name) o.name = name; return o;
}
function pivot(name, pos, ...children) {
  const g = new THREE.Group(); g.name = name; g.position.set(...pos); children.forEach(c => g.add(c)); return g;
}
function eyes(parent, y, z, spread, r = 0.11) {
  // Each eye is a group (pupil + shine) so the website can blink it by scaling Y
  for (const [name, s] of [['eyeL', -1], ['eyeR', 1]]) {
    const g = new THREE.Group(); g.name = name; g.position.set(s * spread, y, z);
    g.add(mesh(new THREE.SphereGeometry(r, 16, 12), mat(C.ink, { roughness: 0.2 })));
    g.add(mesh(new THREE.SphereGeometry(r * 0.35, 8, 6), mat(C.white), [r * 0.3, r * 0.35, r * 0.8]));
    parent.add(g);
  }
}

// ---------- JIM: the build-bot ----------
function makeJim() {
  const root = new THREE.Group(); root.name = 'JIM';
  root.add(mesh(new RoundedBoxGeometry(1.3, 1.2, 0.9, 3, 0.22), mat(C.red), [0, 0, 0], 'body'));
  root.add(mesh(new RoundedBoxGeometry(0.62, 0.42, 0.06, 3, 0.08), glowMat(C.mint), [0, 0.05, 0.46], 'glow'));
  // head (pops up)
  const head = new THREE.Group(); head.name = 'pop'; head.position.set(0, 0.98, 0);
  head.add(mesh(new RoundedBoxGeometry(1.05, 0.78, 0.85, 3, 0.24), mat(C.yellow)));
  eyes(head, 0.06, 0.43, 0.22, 0.12);
  head.add(mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 24, Math.PI), mat(C.ink), [0, -0.16, 0.43]).rotateZ(Math.PI));
  head.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35), mat(C.ink), [0, 0.55, 0]));
  head.add(mesh(new THREE.SphereGeometry(0.1, 16, 10), glowMat(C.red), [0, 0.76, 0]));
  root.add(head);
  // arms (wave from the shoulder)
  for (const [name, s] of [['armL', -1], ['armR', 1]]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 12), mat(C.blue), [0, -0.38, 0]);
    const hand = mesh(new THREE.SphereGeometry(0.17, 16, 10), mat(C.yellow), [0, -0.78, 0]);
    root.add(pivot(name, [s * 0.8, 0.35, 0], arm, hand));
  }
  for (const s of [-1, 1]) root.add(mesh(new RoundedBoxGeometry(0.36, 0.42, 0.5, 3, 0.12), mat(C.blue), [s * 0.34, -0.78, 0]));
  return root;
}

// ---------- KIM: the cloud bunny ----------
function makeKim() {
  const root = new THREE.Group(); root.name = 'KIM';
  root.add(mesh(new THREE.SphereGeometry(0.72, 22, 14), mat(C.blue), [0, -0.1, 0], 'body').scl(1, 1.05, 0.95));
  root.add(mesh(new THREE.SphereGeometry(0.42, 18, 12), mat(C.cream), [0, -0.2, 0.42]).scl(1, 1, 0.5));
  const heart = new THREE.Shape();
  heart.moveTo(0, -0.12); heart.bezierCurveTo(-0.25, 0.05, -0.12, 0.22, 0, 0.1); heart.bezierCurveTo(0.12, 0.22, 0.25, 0.05, 0, -0.12);
  root.add(mesh(new THREE.ExtrudeGeometry(heart, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 }), glowMat(C.pink), [0, -0.15, 0.62], 'glow'));
  const head = new THREE.Group(); head.name = 'pop'; head.position.set(0, 0.92, 0);
  head.add(mesh(new THREE.SphereGeometry(0.55, 22, 14), mat(C.blue)));
  eyes(head, 0.06, 0.48, 0.2, 0.1);
  head.add(mesh(new THREE.SphereGeometry(0.06, 16, 10), mat(C.pink), [0, -0.08, 0.54]));
  for (const s of [-1, 1]) head.add(mesh(new THREE.SphereGeometry(0.08, 16, 10), mat(C.pink, { roughness: 0.8 }), [s * 0.33, -0.12, 0.43]).scl(1, 0.6, 0.4));
  // ears wave
  for (const [name, s] of [['armL', -1], ['armR', 1]]) {
    const ear = mesh(new THREE.CapsuleGeometry(0.13, 0.55, 4, 12), mat(C.blue), [0, 0.38, 0]);
    const inner = mesh(new THREE.CapsuleGeometry(0.07, 0.4, 4, 12), mat(C.pink), [0, 0.38, 0.08]);
    head.add(pivot(name, [s * 0.22, 0.4, 0], ear, inner));
  }
  root.add(head);
  root.add(mesh(new THREE.SphereGeometry(0.18, 16, 10), mat(C.white), [0, -0.3, -0.7]));
  for (const s of [-1, 1]) root.add(mesh(new THREE.SphereGeometry(0.22, 16, 10), mat(C.cream), [s * 0.32, -0.82, 0.18]).scl(1, 0.6, 1.3));
  return root;
}

// ---------- JIM-KIM ROCKET ----------
function makeRocket() {
  const root = new THREE.Group(); root.name = 'ROCKET';
  const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(0.55 * Math.sin(Math.PI * (0.15 + 0.7 * t)) + 0.05, -1 + 2 * t)); }
  root.add(mesh(new THREE.LatheGeometry(pts, 24), mat(C.white), [0, 0, 0], 'body'));
  root.add(mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 24), mat(C.red), [0, -0.2, 0]).rotateX(Math.PI / 2));
  root.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 24), mat(C.blue), [0, 0.25, 0.52]).rotateX(Math.PI / 2));
  root.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24), glowMat(C.yellow), [0, 0.25, 0.55], 'glow').rotateX(Math.PI / 2));
  const nose = new THREE.Group(); nose.name = 'pop'; nose.position.set(0, 1.0, 0);
  nose.add(mesh(new THREE.ConeGeometry(0.32, 0.6, 24), mat(C.red), [0, 0.28, 0]));
  eyes(nose, 0.12, 0.25, 0.1, 0.055);
  root.add(nose);
  // fins wave
  const finShape = new THREE.Shape(); finShape.moveTo(0, 0); finShape.lineTo(0.45, -0.35); finShape.lineTo(0.45, -0.6); finShape.lineTo(0, -0.35); finShape.lineTo(0, 0);
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3 });
  for (const [name, s] of [['armL', -1], ['armR', 1]]) {
    const fin = mesh(finGeo, mat(C.mint), [0, 0, -0.04]); fin.scale.x = s;
    root.add(pivot(name, [s * 0.42, -0.45, 0], fin));
  }
  const back = mesh(finGeo, mat(C.mint), [0, -0.45, -0.42]); back.rotation.y = Math.PI / 2; root.add(back);
  root.add(mesh(new THREE.ConeGeometry(0.22, 0.5, 24), glowMat(C.yellow), [0, -1.25, 0], 'flame').rotateX(Math.PI));
  return root;
}

const exporter = new GLTFExporter();
fs.mkdirSync('models', { recursive: true });
for (const [file, make] of [['jim.glb', makeJim], ['kim.glb', makeKim], ['rocket.glb', makeRocket]]) {
  const scene = new THREE.Scene(); scene.add(make());
  // No textures are used, so drop UV coordinates to keep the files small
  // and share duplicate vertices (rounded boxes are built without an index)
  scene.traverse(o => { if (o.isMesh) { o.geometry.deleteAttribute('uv'); o.geometry = mergeVertices(o.geometry); } });
  const buf = await new Promise((res, rej) => exporter.parse(scene, res, rej, { binary: true }));
  fs.writeFileSync('models/' + file, Buffer.from(buf));
  console.log(file, (buf.byteLength / 1024).toFixed(0) + 'KB');
}
