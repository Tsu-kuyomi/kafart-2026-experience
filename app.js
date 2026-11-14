import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HALL_ZONES, ENTRY_GATES, TEST_SCHEDULE, LOOP_TOTAL_SECONDS } from "./schedule.js";

const urlParams = new URLSearchParams(window.location.search);
let currentGateKey = ENTRY_GATES[urlParams.get("gate")] ? urlParams.get("gate") : "gate_main";
let simElapsedSec = 0;
let isPaused = false;
let selectedZoneId = null;
let stampedZones = JSON.parse(localStorage.getItem("kafart6_stamps") || "[]");

// --- Three.js Scene Styled as Warm Cream Architectural Maquette ---
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfaf7f0);
scene.fog = new THREE.FogExp2(0xfaf7f0, 0.0042);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 500);
// Positioned slightly higher so the hall sits cleanly above the mobile bottom sheet
camera.position.set(0, 76, 66);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 6);
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 22;
controls.maxDistance = 135;

let targetCamPos = camera.position.clone();
let targetLookAt = new THREE.Vector3(0, 0, 6);
let isFlying = false;

// Warm Studio Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const sunLight = new THREE.DirectionalLight(0xfff5e4, 1.15);
sunLight.position.set(35, 70, 45);
sunLight.castShadow = true;
scene.add(sunLight);

// --- Build Octagonal Hall Maquette ---
function buildHallArchitecture() {
  const hallGroup = new THREE.Group();

  // Warm Sand Octagonal Floor
  const floorGeo = new THREE.CylinderGeometry(46, 46, 1.2, 8);
  floorGeo.rotateY(Math.PI / 8);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.6;
  floor.receiveShadow = true;
  hallGroup.add(floor);

  // Deep Forest Green Perimeter Outline
  const ringGeo = new THREE.RingGeometry(44.6, 46.2, 8);
  ringGeo.rotateX(-Math.PI / 2);
  ringGeo.rotateY(Math.PI / 8);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x113c2b, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.04;
  hallGroup.add(ring);

  // Main Runway Stage (North)
  const stageMesh = new THREE.Mesh(
    new THREE.BoxGeometry(24, 1.8, 7),
    new THREE.MeshStandardMaterial({ color: 0x113c2b, roughness: 0.5 })
  );
  stageMesh.position.set(0, 0.9, -31);
  stageMesh.castShadow = true;
  hallGroup.add(stageMesh);

  // Auditorium Seating Block
  const seatingMesh = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.8, 15),
    new THREE.MeshStandardMaterial({ color: 0xd5cfc0 })
  );
  seatingMesh.position.set(0, 0.4, -19);
  hallGroup.add(seatingMesh);

  // Exhibition 3 Centerpiece Circular Pedestal
  const rotundaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 3.8, 1.0, 28),
    new THREE.MeshStandardMaterial({ color: 0x113c2b })
  );
  rotundaBase.position.set(0, 0.5, 3);
  hallGroup.add(rotundaBase);

  const sculpture = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.35, 0.36, 64, 12),
    new THREE.MeshStandardMaterial({ color: 0xf3842b, roughness: 0.35 })
  );
  sculpture.position.set(0, 2.7, 3);
  hallGroup.add(sculpture);

  // Clean Gallery Partition Walls
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  [
    { x: -16, z: 18, w: 18, d: 0.7, rot: -0.65 },
    { x: 16, z: 18, w: 18, d: 0.7, rot: 0.65 },
    { x: -20, z: -15, w: 12, d: 0.7, rot: 0 },
    { x: 19, z: -7, w: 13, d: 0.7, rot: 0 }
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w.w, 3.0, w.d), wallMat);
    wall.position.set(w.x, 1.5, w.z);
    wall.rotation.y = w.rot;
    wall.castShadow = true;
    hallGroup.add(wall);
  });

  scene.add(hallGroup);
}

buildHallArchitecture();

// --- Interactive Zone Pads & Beacons ---
const zoneMeshes = {};
const zoneBeacons = {};

Object.values(HALL_ZONES).forEach(zone => {
  const geo = new THREE.BoxGeometry(zone.size.w, 0.55, zone.size.d);
  const mat = new THREE.MeshStandardMaterial({
    color: zone.color,
    transparent: true,
    opacity: 0.45,
    roughness: 0.6
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(zone.pos.x, 0.28, zone.pos.z);
  mesh.userData = { zoneId: zone.id };
  scene.add(mesh);
  zoneMeshes[zone.id] = mesh;

  const beacon = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.9, 28),
    new THREE.MeshBasicMaterial({ color: 0xf3842b, side: THREE.DoubleSide })
  );
  beacon.rotation.x = -Math.PI / 2;
  beacon.position.set(zone.pos.x, 4.2, zone.pos.z);
  beacon.visible = false;
  scene.add(beacon);
  zoneBeacons[zone.id] = beacon;
});

// --- Gate Origin Marker & Path Line ---
const userPin = new THREE.Mesh(
  new THREE.ConeGeometry(1.5, 3.6, 20),
  new THREE.MeshStandardMaterial({ color: 0x113c2b })
);
userPin.rotation.x = Math.PI;
scene.add(userPin);

let pathLine = null;

function updateGateAndPath(targetZoneId) {
  const gate = ENTRY_GATES[currentGateKey];
  userPin.position.set(gate.pos.x, 2.4, gate.pos.z);
  document.getElementById("gate-label").textContent = gate.short;

  if (pathLine) scene.remove(pathLine);
  if (targetZoneId && HALL_ZONES[targetZoneId]) {
    const dest = HALL_ZONES[targetZoneId].pos;
    const points = [
      new THREE.Vector3(gate.pos.x, 0.7, gate.pos.z),
      new THREE.Vector3(0, 0.7, 5),
      new THREE.Vector3(dest.x, 0.7, dest.z)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x113c2b });
    pathLine = new THREE.Line(lineGeo, lineMat);
    scene.add(pathLine);
  }
}

// --- Camera Navigation ---
function flyToZone(zoneId) {
  const z = HALL_ZONES[zoneId];
  if (!z) return;
  targetLookAt.set(z.pos.x, 0.5, z.pos.z + 4);
  targetCamPos.set(z.pos.x, 34, z.pos.z + 30);
  isFlying = true;
}

document.getElementById("btn-reset-cam").addEventListener("click", () => {
  targetLookAt.set(0, 0, 6);
  targetCamPos.set(0, 76, 66);
  isFlying = true;
});

// --- Tap 3D Zone Detection ---
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

renderer.domElement.addEventListener("pointerdown", (e) => {
  isFlying = false;
  downPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener("pointerup", (e) => {
  const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  if (dist > 8) return; // Ignore drag orbits

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(Object.values(zoneMeshes));
  if (hits.length > 0) {
    openZoneInspector(hits[0].object.userData.zoneId);
  }
});

// --- Zone Inspector Sheet ---
function openZoneInspector(zoneId) {
  selectedZoneId = zoneId;
  const z = HALL_ZONES[zoneId];
  flyToZone(zoneId);

  document.getElementById("toast-category").textContent = z.category;
  document.getElementById("toast-title").textContent = z.name;
  document.getElementById("toast-wing").textContent = z.wing;
  document.getElementById("toast-desc").textContent = `“${z.description}”`;

  const activeEv = getActiveEvents().find(ev => ev.zoneId === zoneId);
  document.getElementById("toast-status-badge").textContent = activeEv ? "Live Session" : "Open Access";
  document.getElementById("toast-event-box").textContent = activeEv
    ? `${activeEv.title} — Hosted by ${activeEv.host}`
    : "No scheduled stage session right now. Open for self-guided gallery viewing.";

  const isStamped = stampedZones.includes(zoneId);
  document.getElementById("checkin-label").textContent = isStamped ? "Stamped" : "Check In";
  document.getElementById("zone-sheet").classList.remove("hidden");
}

document.getElementById("toast-close").addEventListener("click", () => {
  document.getElementById("zone-sheet").classList.add("hidden");
});

document.getElementById("toast-route").addEventListener("click", () => {
  if (selectedZoneId) {
    updateGateAndPath(selectedZoneId);
    document.getElementById("zone-sheet").classList.add("hidden");
  }
});

document.getElementById("toast-checkin").addEventListener("click", () => {
  if (selectedZoneId && !stampedZones.includes(selectedZoneId)) {
    stampedZones.push(selectedZoneId);
    localStorage.setItem("kafart6_stamps", JSON.stringify(stampedZones));
    renderPassport();
    openZoneInspector(selectedZoneId);
  }
});

// --- Live Schedule & Countdown ---
function formatMMSS(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getActiveEvents() {
  return TEST_SCHEDULE.filter(
    ev => simElapsedSec >= ev.startSec && simElapsedSec < ev.startSec + ev.durationSec
  );
}

function updateScheduleUI() {
  document.getElementById("sim-clock").textContent = `${formatMMSS(simElapsedSec)} / 15:00`;
  const activeEvents = getActiveEvents();
  const primary = activeEvents[0];

  Object.keys(HALL_ZONES).forEach(zId => {
    const isHot = activeEvents.some(ev => ev.zoneId === zId);
    zoneBeacons[zId].visible = isHot;
    zoneMeshes[zId].material.opacity = isHot ? 0.85 : 0.4;
  });

  if (primary) {
    const rem = primary.startSec + primary.durationSec - simElapsedSec;
    const z = HALL_ZONES[primary.zoneId];
    document.getElementById("live-title").textContent = primary.title;
    document.getElementById("live-zone-label").textContent =
      `${z.name} • ${z.wing}` + (activeEvents.length > 1 ? ` (+${activeEvents.length - 1} more)` : "");
    document.getElementById("live-countdown").textContent = `ENDS IN ${formatMMSS(rem)}`;
    document.getElementById("btn-fly-live").onclick = () => openZoneInspector(primary.zoneId);
    updateGateAndPath(primary.zoneId);
  }

  const listEl = document.getElementById("schedule-list");
  listEl.innerHTML = TEST_SCHEDULE.map(ev => {
    const live = activeEvents.some(a => a.id === ev.id);
    const z = HALL_ZONES[ev.zoneId];
    return `
      <div class="sched-row ${live ? "is-live" : ""}" data-zone="${ev.zoneId}">
        <div class="sched-time-col">${formatMMSS(ev.startSec)}<br>${formatMMSS(ev.startSec + ev.durationSec)}</div>
        <div class="sched-info-col">
          <strong>${ev.title}</strong>
          <span>${z.name} • ${ev.durationSec / 60} min</span>
        </div>
        <span class="sched-badge">${live ? "Live" : "View"}</span>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll(".sched-row").forEach(el => {
    el.addEventListener("click", () => openZoneInspector(el.dataset.zone));
  });
}

// --- Render Zones & Passport ---
function renderZonesAndPassport() {
  const zGrid = document.getElementById("zone-list");
  zGrid.innerHTML = Object.values(HALL_ZONES).map(z => `
    <button class="dir-card" data-zone="${z.id}">
      <span class="cat-tag">${z.wing}</span>
      <strong>${z.name}</strong>
    </button>
  `).join("");
  zGrid.querySelectorAll(".dir-card").forEach(btn => {
    btn.addEventListener("click", () => openZoneInspector(btn.dataset.zone));
  });
  renderPassport();
}

function renderPassport() {
  const passportZones = Object.values(HALL_ZONES).filter(z => z.passport);
  const count = passportZones.filter(z => stampedZones.includes(z.id)).length;
  document.getElementById("stamp-count").textContent = count;

  const pGrid = document.getElementById("passport-grid");
  pGrid.innerHTML = passportZones.map(z => {
    const done = stampedZones.includes(z.id);
    return `
      <button class="dir-card ${done ? "stamped" : ""}" data-zone="${z.id}">
        <span class="cat-tag">${done ? "Collected" : "Unvisited"}</span>
        <strong>${z.name}</strong>
      </button>
    `;
  }).join("");
  pGrid.querySelectorAll(".dir-card").forEach(btn => {
    btn.addEventListener("click", () => openZoneInspector(btn.dataset.zone));
  });
}

// --- Navigation Pills & Sheet Collapse ---
document.querySelectorAll(".cat-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.getElementById("bottom-sheet").classList.remove("collapsed");
    document.querySelectorAll(".cat-pill, .sheet-view").forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
  });
});

document.getElementById("btn-toggle-sheet").addEventListener("click", () => {
  document.getElementById("bottom-sheet").classList.toggle("collapsed");
});

document.getElementById("btn-gate").addEventListener("click", () => {
  document.getElementById("gate-modal").classList.remove("hidden");
});
document.getElementById("btn-close-gate").addEventListener("click", () => {
  document.getElementById("gate-modal").classList.add("hidden");
});
document.querySelectorAll(".gate-option").forEach(btn => {
  btn.addEventListener("click", () => {
    currentGateKey = btn.dataset.gate;
    document.getElementById("gate-modal").classList.add("hidden");
    updateScheduleUI();
  });
});

document.getElementById("btn-sim-pause").addEventListener("click", (e) => {
  isPaused = !isPaused;
  e.target.textContent = isPaused ? "Resume" : "Pause";
});
document.getElementById("btn-sim-restart").addEventListener("click", () => {
  simElapsedSec = 0;
  updateScheduleUI();
});

// --- Loop ---
renderZonesAndPassport();
updateScheduleUI();

setInterval(() => {
  if (!isPaused) {
    simElapsedSec = (simElapsedSec + 1) % LOOP_TOTAL_SECONDS;
    updateScheduleUI();
  }
}, 1000);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  Object.values(zoneBeacons).forEach(b => {
    if (b.visible) {
      const s = 1 + Math.sin(t * 5) * 0.22;
      b.scale.set(s, s, 1);
    }
  });

  if (isFlying) {
    camera.position.lerp(targetCamPos, 0.07);
    controls.target.lerp(targetLookAt, 0.07);
    if (camera.position.distanceTo(targetCamPos) < 0.5) isFlying = false;
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});