import * as THREE from 'three';
import { BOARD, PHYSICS } from '../core/constants';
import { isWithinBoard, physicsToScene, sceneToPhysics } from './coordinates';
import {
  makeBoardTexture,
  makeEnvironmentTexture,
  makeGlowTexture,
  makePuckTopTexture,
  makeSoftShadowTexture,
  makeWoodTexture,
} from './textures';

const WIDTH = BOARD.width * 0.01;
const HEIGHT = BOARD.height * 0.01;
const HALF_WIDTH = WIDTH / 2;
const HALF_HEIGHT = HEIGHT / 2;
const PUCK_RADIUS = BOARD.puckRadius * 0.01;
const PUCK_HEIGHT = BOARD.puckHeight * 0.01;
const DIVIDER_HALF = (BOARD.dividerThickness * 0.01) / 2;
const GAP_HALF = (BOARD.gapWidth * 0.01) / 2;
const CAP_RADIUS = BOARD.dividerCapRadius * 0.01;
const BAND_INSET = 0.2;
const BAND_Z = 4;

const FRAME_TIME = 1000 / 60;
const RETURN_TIME = 90;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function disposeObject(object) {
  object.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => material.dispose());
    }
  });
}

export class SlingPuckScene {
  constructor(canvas, container, { audio = null } = {}) {
    this.canvas = canvas;
    this.container = container;
    this.audio = audio;
    this.views = new Map();
    this.puckMeshes = [];
    this.disposables = [];
    this.textures = [];
    this.dragging = null;
    this.interactiveSide = null;
    this.lastPucks = [];
    this.playback = null;
    this.playbackRate = 1;
    this.shake = 0;
    this.frames = 0;
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setClearColor(0x111315, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111315);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.cameraBase = new THREE.Vector3(0, 9.4, 8.2);
    this.camera.position.copy(this.cameraBase);
    this.camera.lookAt(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.hitPoint = new THREE.Vector3();

    this.buildTextures();
    this.buildEnvironment();
    this.buildLights();
    this.buildBoard();
    this.buildBands();
    this.buildArrow();
    this.buildRings();

    this.observer = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      this.observer = new ResizeObserver(() => this.resize());
      this.observer.observe(container);
    }
    this.handleWindowResize = () => this.resize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleWindowResize);
    }

    this.animate = this.animate.bind(this);
    this.resize();
    this.raf = requestAnimationFrame(this.animate);
  }

  track(resource) {
    this.disposables.push(resource);
    return resource;
  }

  buildTextures() {
    this.textures = [
      makeWoodTexture(),
      makeBoardTexture(),
      makeGlowTexture(),
      makeSoftShadowTexture(),
      makePuckTopTexture('black'),
      makePuckTopTexture('ivory'),
      makeEnvironmentTexture(),
    ];
    const [wood, board, glow, shadow, blackTop, ivoryTop, environment] = this.textures;
    this.woodTexture = wood;
    this.boardTexture = board;
    this.glowTexture = glow;
    this.shadowTexture = shadow;
    this.puckTops = { black: blackTop, ivory: ivoryTop };
    this.environmentTexture = environment;
  }

  buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromEquirectangular(this.environmentTexture).texture;
    this.scene.environment = this.environment;
    pmrem.dispose();
  }

  buildLights() {
    const ambient = new THREE.HemisphereLight(0xfdf6e3, 0x24201b, 1.15);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe6bd, 2.6);
    key.position.set(-4.5, 12, 6.5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0006;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x88a6c8, 0.8);
    rim.position.set(5, 6, -7);
    this.scene.add(rim);
  }

  buildBoard() {
    const group = new THREE.Group();

    const base = new THREE.Mesh(
      this.track(new THREE.BoxGeometry(WIDTH, 0.5, HEIGHT)),
      this.track(new THREE.MeshStandardMaterial({ color: 0x6f4a2d, roughness: 0.72, metalness: 0.05 }))
    );
    base.position.y = -0.25;
    base.receiveShadow = true;
    group.add(base);

    const playmat = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(WIDTH - 0.5, HEIGHT - 0.5)),
      this.track(new THREE.MeshStandardMaterial({
        map: this.woodTexture,
        color: 0xf0dcc0,
        roughness: 0.82,
        metalness: 0.02,
      }))
    );
    playmat.rotation.x = -Math.PI / 2;
    playmat.position.y = 0.002;
    playmat.receiveShadow = true;
    group.add(playmat);

    const print = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(WIDTH - 0.62, HEIGHT - 0.62)),
      this.track(new THREE.MeshStandardMaterial({
        map: this.boardTexture,
        transparent: true,
        roughness: 0.9,
        metalness: 0,
        depthWrite: false,
      }))
    );
    print.rotation.x = -Math.PI / 2;
    print.position.y = 0.006;
    print.receiveShadow = true;
    group.add(print);
    this.boardSurface = print;

    const railMaterial = this.track(new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      color: 0x8a5a34,
      roughness: 0.62,
      metalness: 0.08,
    }));
    const railHeight = 0.16;
    const railWidth = 0.34;
    const rails = [
      { size: [railWidth, railHeight, HEIGHT + railWidth], position: [-HALF_WIDTH - railWidth / 2 + 0.02, railHeight / 2 - 0.06, 0] },
      { size: [railWidth, railHeight, HEIGHT + railWidth], position: [HALF_WIDTH + railWidth / 2 - 0.02, railHeight / 2 - 0.06, 0] },
      { size: [WIDTH + railWidth, railHeight, railWidth], position: [0, railHeight / 2 - 0.06, HALF_HEIGHT + railWidth / 2 - 0.02] },
      { size: [WIDTH + railWidth, railHeight, railWidth], position: [0, railHeight / 2 - 0.06, -HALF_HEIGHT - railWidth / 2 + 0.02] },
    ];
    rails.forEach(({ size, position }) => {
      const rail = new THREE.Mesh(this.track(new THREE.BoxGeometry(...size)), railMaterial);
      rail.position.set(...position);
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);
    });

    // Divider: two rails with rounded caps around the centre gap.
    const dividerMaterial = this.track(new THREE.MeshStandardMaterial({
      map: this.woodTexture,
      color: 0x9b6a3f,
      roughness: 0.58,
      metalness: 0.08,
    }));
    const segmentLength = HALF_WIDTH - GAP_HALF;
    const dividerHeight = 0.2;
    for (const sign of [-1, 1]) {
      const segment = new THREE.Mesh(
        this.track(new THREE.BoxGeometry(segmentLength, dividerHeight, DIVIDER_HALF * 2)),
        dividerMaterial
      );
      segment.position.set(sign * (GAP_HALF + segmentLength / 2), dividerHeight / 2, 0);
      segment.castShadow = true;
      segment.receiveShadow = true;
      group.add(segment);

      const cap = new THREE.Mesh(
        this.track(new THREE.CylinderGeometry(CAP_RADIUS, CAP_RADIUS, dividerHeight, 24)),
        dividerMaterial
      );
      cap.position.set(sign * GAP_HALF, dividerHeight / 2, 0);
      cap.castShadow = true;
      group.add(cap);
    }

    this.scene.add(group);
    this.boardGroup = group;
  }

  bandCurve(side, dragPoint) {
    const z = side === 'player' ? BAND_Z : -BAND_Z;
    const left = new THREE.Vector3(-HALF_WIDTH + BAND_INSET, 0.22, z);
    const right = new THREE.Vector3(HALF_WIDTH - BAND_INSET, 0.22, z);
    if (!dragPoint) {
      const sag = side === 'player' ? -0.16 : 0.16;
      return new THREE.CatmullRomCurve3([
        left,
        new THREE.Vector3(-1.4, 0.2, z + sag),
        new THREE.Vector3(0, 0.19, z + sag * 1.4),
        new THREE.Vector3(1.4, 0.2, z + sag),
        right,
      ]);
    }
    return new THREE.CatmullRomCurve3([
      left,
      new THREE.Vector3((-HALF_WIDTH + BAND_INSET + dragPoint.x) / 2, 0.2, (z + dragPoint.z) / 2),
      new THREE.Vector3(dragPoint.x, dragPoint.y, dragPoint.z),
      new THREE.Vector3((dragPoint.x + HALF_WIDTH - BAND_INSET) / 2, 0.2, (z + dragPoint.z) / 2),
      right,
    ]);
  }

  buildBands() {
    this.bands = {};
    const material = this.track(new THREE.MeshStandardMaterial({
      color: 0x171412,
      roughness: 0.45,
      metalness: 0.15,
    }));
    const posts = this.track(new THREE.MeshStandardMaterial({
      color: 0xc9a44c,
      roughness: 0.3,
      metalness: 0.85,
    }));

    for (const side of ['player', 'opponent']) {
      const z = side === 'player' ? BAND_Z : -BAND_Z;
      const band = new THREE.Mesh(
        this.track(new THREE.TubeGeometry(this.bandCurve(side, null), 24, 0.026, 6, false)),
        material
      );
      band.castShadow = true;
      this.scene.add(band);
      this.bands[side] = band;

      for (const sign of [-1, 1]) {
        const post = new THREE.Mesh(
          this.track(new THREE.CylinderGeometry(0.045, 0.06, 0.36, 16)),
          posts
        );
        post.position.set(sign * (HALF_WIDTH - BAND_INSET), 0.18, z);
        post.castShadow = true;
        this.scene.add(post);
      }
    }
  }

  buildArrow() {
    this.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, 0xffc857, 0.35, 0.16);
    this.arrow.visible = false;
    this.arrow.traverse(child => {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = 0.85;
        child.material.depthTest = false;
      }
    });
    this.scene.add(this.arrow);
  }

  buildRings() {
    this.rings = [];
    for (let i = 0; i < 12; i++) {
      const material = this.track(new THREE.MeshBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
      const mesh = new THREE.Mesh(this.track(new THREE.RingGeometry(0.32, 0.4, 40)), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.04;
      mesh.visible = false;
      this.scene.add(mesh);
      this.rings.push({ mesh, age: 0, active: false });
    }
  }

  spawnRing(x, y, strength) {
    const scenePoint = physicsToScene(x, y);
    const ring = this.rings.find(item => !item.active) ?? this.rings[0];
    ring.active = true;
    ring.age = 0;
    ring.strength = clamp(strength, 0.12, 1);
    ring.mesh.position.set(scenePoint.x, 0.04, scenePoint.z);
    ring.mesh.visible = true;
    ring.mesh.scale.setScalar(0.5 + strength * 0.5);
    ring.mesh.material.opacity = 0.55;
  }

  addPuck(puck) {
    const topTexture = this.puckTops[puck.color] ?? this.puckTops.black;
    const sideColor = puck.color === 'ivory' ? 0xe8dcc2 : 0x241d18;
    const sideMaterial = this.track(new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.34,
      metalness: 0.18,
    }));
    const topMaterial = this.track(new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.38,
      metalness: 0.12,
    }));
    const body = new THREE.Mesh(
      this.track(new THREE.CylinderGeometry(PUCK_RADIUS, PUCK_RADIUS, PUCK_HEIGHT, 48)),
      [sideMaterial, topMaterial, sideMaterial]
    );
    body.position.y = PUCK_HEIGHT / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.puckId = puck.id;

    const group = new THREE.Group();
    group.add(body);

    const rim = new THREE.Mesh(
      this.track(new THREE.TorusGeometry(PUCK_RADIUS - 0.012, 0.018, 8, 48)),
      this.track(new THREE.MeshStandardMaterial({
        color: puck.color === 'ivory' ? 0x9c7a3a : 0xc9a44c,
        roughness: 0.35,
        metalness: 0.8,
      }))
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = PUCK_HEIGHT - 0.004;
    group.add(rim);

    const shadow = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(PUCK_RADIUS * 2.6, PUCK_RADIUS * 2.6)),
      this.track(new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }))
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.009;
    group.add(shadow);

    const glow = new THREE.Mesh(
      this.track(new THREE.PlaneGeometry(PUCK_RADIUS * 3.4, PUCK_RADIUS * 3.4)),
      this.track(new THREE.MeshBasicMaterial({
        map: this.glowTexture,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }))
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.012;
    glow.visible = false;
    group.add(glow);

    const scenePoint = physicsToScene(puck.x, puck.y);
    group.position.set(scenePoint.x, 0, scenePoint.z);
    group.rotation.y = -(puck.angle ?? 0);

    this.scene.add(group);
    this.views.set(puck.id, { group, body, glow, shadow, angle: puck.angle ?? 0, color: puck.color });
    this.puckMeshes.push(body);
  }

  placeView(puck) {
    let view = this.views.get(puck.id);
    if (!view) {
      this.addPuck(puck);
      view = this.views.get(puck.id);
    }
    const scenePoint = physicsToScene(puck.x, puck.y);
    view.group.position.set(scenePoint.x, 0, scenePoint.z);
    view.group.rotation.y = -(puck.angle ?? 0);
    view.angle = puck.angle ?? 0;
    return view;
  }

  syncPucks(pucks) {
    if (!pucks) return;
    this.lastPucks = pucks.map(puck => ({ ...puck }));
    pucks.forEach(puck => this.placeView(puck));
    this.applyGlow();
  }

  syncLive(pucks, { skipId = null } = {}) {
    if (!pucks) return;
    this.lastPucks = pucks.map(puck => ({ ...puck }));
    pucks.forEach(puck => {
      if (puck.id !== skipId) this.placeView(puck);
    });
    this.applyGlow();
  }

  setLiveMode(on) {
    this.liveMode = Boolean(on);
    this.applyGlow();
  }

  applyGlow() {
    this.views.forEach((view, id) => {
      const puck = this.lastPucks.find(item => item.id === id);
      if (this.liveMode) {
        view.glow.visible = Boolean(puck && puck.y < 0 && (puck.speed ?? 0) < PHYSICS.settleSpeed);
        return;
      }
      view.glow.visible = Boolean(this.interactiveSide && puck && (puck.y < 0 ? 'player' : 'opponent') === this.interactiveSide);
    });
  }

  setInteractiveSide(side) {
    this.interactiveSide = side;
    this.applyGlow();
  }

  beginDrag(puckId) {
    const view = this.views.get(puckId);
    if (!view) return;
    this.dragging = puckId;
    view.group.position.y = 0.08;
  }

  updateDrag({ puckId, start, dragPoint, power, side }) {
    const view = this.views.get(puckId);
    if (!view) return;
    // The pull point may sit past the board edge for a puck on the end rail;
    // the drawn puck still has to stay on the mat.
    const matX = HALF_WIDTH - PUCK_RADIUS - 0.02;
    const matZ = HALF_HEIGHT - PUCK_RADIUS - 0.02;
    const point = physicsToScene(dragPoint.x, dragPoint.y);
    point.x = clamp(point.x, -matX, matX);
    point.z = clamp(point.z, -matZ, matZ);
    view.group.position.set(point.x, 0.08, point.z);

    const dragScenePoint = new THREE.Vector3(point.x, 0.22, point.z);
    this.setBand(side, dragScenePoint);
    this.setBand(side === 'player' ? 'opponent' : 'player', null);

    const startScene = physicsToScene(start.x, start.y);
    const forward = new THREE.Vector3(startScene.x - point.x, 0, startScene.z - point.z);
    if (forward.lengthSq() < 1e-6) {
      forward.set(0, 0, side === 'player' ? 1 : -1);
    }
    forward.normalize();
    const length = 0.7 + clamp(power, 0, 1) * 2.6;
    this.arrow.position.set(startScene.x, 0.5, startScene.z);
    this.arrow.setDirection(forward);
    this.arrow.setLength(length, Math.min(0.42, length * 0.28), 0.15);
    this.arrow.visible = true;
  }

  setBand(side, dragPoint) {
    const band = this.bands[side];
    if (!band) return;
    const key = dragPoint
      ? `${dragPoint.x},${dragPoint.y},${dragPoint.z}`
      : 'rest';
    if (band.userData.bandKey === key) return;
    band.userData.bandKey = key;
    band.geometry.dispose();
    // Drag geometry is replaced on every pointer move, so it must not be added
    // to the lifetime disposables list; disposeObject still releases the one
    // that is mounted when the scene is torn down.
    band.geometry = new THREE.TubeGeometry(this.bandCurve(side, dragPoint), 24, 0.026, 6, false);
  }

  clearDrag() {
    this.dragging = null;
    this.arrow.visible = false;
    this.setBand('player', null);
    this.setBand('opponent', null);
    if (this.lastPucks.length) {
      this.syncPucks(this.lastPucks);
    }
  }

  cancelDrag() {
    this.clearDrag();
  }

  pickPuck(clientX, clientY) {
    this.setPointer(clientX, clientY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.puckMeshes, false);
    if (!hits.length) return null;
    const mesh = hits[0].object;
    const id = mesh.userData.puckId;
    const point = sceneToPhysics(hits[0].point.x, hits[0].point.z);
    const puck = this.lastPucks.find(item => item.id === id);
    return {
      id,
      x: point.x,
      y: point.y,
      angle: puck?.angle ?? 0,
    };
  }

  boardPoint(clientX, clientY) {
    this.setPointer(clientX, clientY);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.floorPlane, this.hitPoint);
    if (!hit) return null;
    const point = sceneToPhysics(hit.x, hit.z);
    if (!isWithinBoard(point.x, point.y)) return null;
    return point;
  }

  setPointer(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      this.pointer.set(0, 0);
      return;
    }
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  screenPointFromWorld(x, y, z) {
    const vector = new THREE.Vector3(x, y, z).project(this.camera);
    const width = this.canvas.clientWidth || this.canvas.width;
    const height = this.canvas.clientHeight || this.canvas.height;
    return {
      x: (vector.x + 1) * 0.5 * width,
      y: (1 - vector.y) * 0.5 * height,
    };
  }

  getPuckScreenPoint(puckId) {
    const view = this.views.get(puckId);
    if (!view) return null;
    const position = view.group.position;
    return this.screenPointFromWorld(position.x, PUCK_HEIGHT, position.z);
  }

  getBoardScreenPoint(x, y) {
    const scenePoint = physicsToScene(x, y);
    return this.screenPointFromWorld(scenePoint.x, 0.01, scenePoint.z);
  }

  getSize() {
    return {
      width: this.canvas.clientWidth || this.canvas.width,
      height: this.canvas.clientHeight || this.canvas.height,
    };
  }

  cancelPlayback() {
    if (this.playback) {
      this.playback.cancelled = true;
      this.playback = null;
    }
    this.arrow.visible = false;
  }

  playShot({ startPucks, frames, events, shot, onDone }) {
    if (this.playback) {
      this.playback.cancelled = true;
    }
    this.arrow.visible = false;

    if (!frames || !frames.length) {
      if (startPucks) this.syncPucks(startPucks);
      this.setBand('player', null);
      this.setBand('opponent', null);
      if (onDone) onDone();
      return;
    }

    const first = frames[0].pucks;
    const final = frames[frames.length - 1].pucks;
    const draggedId = shot?.puckId ?? this.dragging;
    const draggedView = draggedId != null ? this.views.get(draggedId) : null;
    const from = draggedView ? draggedView.group.position.clone() : null;

    // Snap every puck to frame 0 except the dragged one, which eases back into place.
    first.forEach(puck => {
      if (puck.id === draggedId) return;
      const view = this.views.get(puck.id);
      if (view) {
        const scenePoint = physicsToScene(puck.x, puck.y);
        view.group.position.set(scenePoint.x, 0, scenePoint.z);
        view.group.rotation.y = -(puck.angle ?? 0);
      }
    });
    if (draggedView && from) {
      const target = physicsToScene(first.find(puck => puck.id === draggedId)?.x ?? 0, first.find(puck => puck.id === draggedId)?.y ?? 0);
      this.playback = {
        frames,
        events: events ?? [],
        draggedId,
        from,
        to: new THREE.Vector3(target.x, 0, target.z),
        phase: 'return',
        elapsed: 0,
        lastIndex: 0,
        eventIndex: -1,
        lastNow: performance.now(),
        onDone,
        cancelled: false,
      };
    } else {
      this.playback = {
        frames,
        events: events ?? [],
        draggedId,
        phase: 'frames',
        elapsed: 0,
        lastIndex: 0,
        eventIndex: -1,
        lastNow: performance.now(),
        onDone,
        cancelled: false,
      };
      this.syncPucks(first);
    }

    this.setBand('player', null);
    this.setBand('opponent', null);
    this.dragging = null;
    this.lastPucks = final.map(puck => ({ ...puck }));
  }

  tickPlayback(now) {
    const playback = this.playback;
    if (!playback || playback.cancelled) return;
    const dt = Math.max(0, now - playback.lastNow) * this.playbackRate;
    playback.lastNow = now;
    playback.elapsed += dt;

    if (playback.phase === 'return') {
      const progress = clamp(playback.elapsed / RETURN_TIME, 0, 1);
      const view = this.views.get(playback.draggedId);
      if (view) {
        view.group.position.lerpVectors(playback.from, playback.to, progress);
      }
      if (progress >= 1) {
        playback.phase = 'frames';
        playback.elapsed = 0;
        this.syncPucks(playback.frames[0].pucks);
      }
      return;
    }

    const last = playback.frames.length - 1;
    const index = Math.min(last, Math.floor(playback.elapsed / FRAME_TIME));
    if (index !== playback.lastIndex) {
      playback.lastIndex = index;
      this.syncPucks(playback.frames[index].pucks);
    }

    while (playback.eventIndex + 1 < playback.events.length
      && playback.events[playback.eventIndex + 1].frame <= index) {
      playback.eventIndex += 1;
      const event = playback.events[playback.eventIndex];
      if (this.audio) this.audio.impact(event.strength, event.type);
      this.spawnRing(event.x, event.y, event.strength);
      this.shake = Math.min(0.8, this.shake + event.strength * 0.45);
    }

    if (index >= last) {
      const final = playback.frames[last].pucks;
      this.playback = null;
      this.syncPucks(final);
      if (playback.onDone) playback.onDone();
    }
  }

  setPlaybackRate(rate) {
    this.playbackRate = clamp(Number(rate) || 1, 0.25, 3);
  }

  resize() {
    if (this.disposed || !this.container) return;
    const width = Math.max(1, Math.floor(this.container.clientWidth || 1));
    const height = Math.max(1, Math.floor(this.container.clientHeight || 1));
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
    this.renderer.setSize(width, height, false);

    const aspect = width / height;
    const viewHeight = Math.max(10.8, 8.4 / aspect);
    const viewWidth = viewHeight * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
  }

  animate(now) {
    if (this.disposed) return;
    this.tickPlayback(now);

    this.rings.forEach(ring => {
      if (!ring.active) return;
      ring.age += 1000 / 60;
      const progress = ring.age / 620;
      if (progress >= 1) {
        ring.active = false;
        ring.mesh.visible = false;
        ring.mesh.material.opacity = 0;
        return;
      }
      const scale = (0.6 + ring.strength * 0.6) * (1 + progress * 3.2);
      ring.mesh.scale.setScalar(scale);
      ring.mesh.material.opacity = 0.55 * (1 - progress);
    });

    if (this.shake > 0.001) {
      this.shake *= 0.88;
      this.camera.position.x = this.cameraBase.x + (Math.random() - 0.5) * this.shake * 0.22;
      this.camera.position.y = this.cameraBase.y + (Math.random() - 0.5) * this.shake * 0.14;
      this.camera.lookAt(0, 0, 0);
    } else if (this.shake !== 0) {
      this.shake = 0;
      this.camera.position.copy(this.cameraBase);
      this.camera.lookAt(0, 0, 0);
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.animate);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.playback) this.playback.cancelled = true;
    if (this.raf != null) cancelAnimationFrame(this.raf);
    if (this.observer) this.observer.disconnect();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleWindowResize);
    }
    disposeObject(this.scene);
    this.disposables.forEach(resource => {
      if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    });
    this.textures.forEach(texture => texture?.dispose());
    if (this.environment) this.environment.dispose();
    this.renderer.dispose();
    this.views.clear();
    this.puckMeshes = [];
    this.scene.clear();
  }
}
