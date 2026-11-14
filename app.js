import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HALL_ZONES, ENTRY_GATES, TEST_SCHEDULE, LOOP_TOTAL_SECONDS } from "./schedule.js";

const urlParams = new URLSearchParams(window.location.search);
let currentGateKey = ENTRY_GATES[urlParams.get("gate")] ? urlParams.get("gate") : "gate_main";
let viewMode = "2d"; // '2d' | '3d'
let simElapsedSec = 0;
let isPaused = false;
let selectedZoneId = null;
let selectedEventId = null;
let stampedZones = JSON.parse(localStorage.getItem("kafart6_stamps") || "[]");

// =========================================================
// 1. 2D HIGH-FIDELITY SVG MAP & ANIMATED WALKING FOOTSTEPS
// =========================================================
const svgNS = "http://www.w3.org/2000/svg";
const footstepsLayer = document.getElementById("footsteps-layer");
const originPinSvg = document.getElementById("svg-origin-pin");
const targetRingSvg = document.getElementById("svg-target-ring");

function buildCorridorWaypoints(startSvg, endSvg) {
  // Route cleanly through main hall aisles instead of cutting diagonally through walls
  const pts = [startSvg];

  if (Math.hypot(startSvg.x - endSvg.x, startSvg.y - endSvg.y) > 22) {
    // Enter outer ring corridor first, then central rotunda hub
    const entryHub = {
      x: Math.sign(startSvg.x) * Math.min(Math.abs(startSvg.x), 26),
      y: Math.sign(startSvg.y) * Math.min(Math.abs(startSvg.y), 26)
    };
    pts.push(entryHub);
    pts.push({ x: 0, y: 8 }); // Central rotunda walkway
  }
  pts.push(endSvg);
  return pts;
}

function drawWalkingFootsteps(targetZoneId) {
  const gate = ENTRY_GATES[currentGateKey];
  document.getElementById("gate-label").textContent = gate.short;

  // Update Green Origin Pin on 2D SVG
  const circles = originPinSvg.querySelectorAll("circle");
  circles.forEach(c => {
    c.setAttribute("cx", gate.svgPos.x);
    c.setAttribute("cy", gate.svgPos.y);
  });

  footstepsLayer.innerHTML = "";
  if (!targetZoneId || !HALL_ZONES[targetZoneId]) {
    targetRingSvg.setAttribute("visibility", "hidden");
    return;
  }

  const dest = HALL_ZONES[targetZoneId].svgPos;
  targetRingSvg.setAttribute("visibility", "visible");
  document.getElementById("target-pulse-outer").setAttribute("cx", dest.x);
  document.getElementById("target-pulse-outer").setAttribute("cy", dest.y);
  document.getElementById("target-pulse-inner").setAttribute("cx", dest.x);
  document.getElementById("target-pulse-inner").setAttribute("cy", dest.y);

  const waypoints = buildCorridorWaypoints(gate.svgPos, dest);
  let stepIndex = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const stepSpacing = 3.2;
    const stepsCount = Math.max(1, Math.floor(segLen / stepSpacing));

    // Normal vector for left/right foot offset
    const nx = -dy / (segLen || 1);
    const ny = dx / (segLen || 1);

    for (let s = 1; s <= stepsCount; s++) {
      const t = s / (stepsCount + 0.5);
      const isLeft = stepIndex % 2 === 0;
      const sideOffset = isLeft ? -0.95 : 0.95;

      const fx = a.x + dx * t + nx * sideOffset;
      const fy = a.y + dy * t + ny * sideOffset;

      // Crisp shoe-sole vector footprint
      const foot = document.createElementNS(svgNS, "ellipse");
      foot.setAttribute("cx", fx.toFixed(2));
      foot.setAttribute("cy", fy.toFixed(2));
      foot.setAttribute("rx", "0.68");
      foot.setAttribute("ry", "1.25");
      foot.setAttribute("fill", "#113C2B");
      foot.setAttribute("transform", `rotate(${angleDeg.toFixed(1)} ${fx.toFixed(2)} ${fy.toFixed(2)})`);
      foot.setAttribute("class", "footstep-mark");
      foot.style.animationDelay = `${stepIndex * 75}ms`;

      footstepsLayer.appendChild(foot);
      stepIndex++;
    }
  }
}

// Click zones directly on the 2D SVG map
document.querySelectorAll(".zone-group").forEach(g => {
  g.addEventListener("click", () => {
    const zId = g.dataset.zone;
    if (HALL_ZONES[zId]) openZoneInspector(zId);
  });
});

// =========================================================
// 2. 3D ARCHITECTURAL MAQUETTE (THREE.JS)
// =========================================================
const container3d = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfaf7f0);
scene.fog = new THREE.FogExp2(0xfaf7f0, 0.0042);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 76, 66);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container3d.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 6);
controls.maxPolarAngle = Math.PI / 2.2;
controls.minDistance = 22;
controls.maxDistance = 135;

let targetCamPos = camera.position.clone();
let targetLookAt = new THREE.Vector3(0, 0, 6);
let isFlying = false;

scene.add(new THREE.AmbientLight(0xffffff, 1.1));
const sunLight = new THREE.DirectionalLight(0xfff5e4, 1.15);
sunLight.position.set(35, 70, 45);
sunLight.castShadow = true;
scene.add(sunLight);

function buildHallArchitecture() {
  const hallGroup = new THREE.Group();

  const floorGeo = new THREE.CylinderGeometry(46, 46, 1.2, 8);
  floorGeo.rotateY(Math.PI / 8);
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.9 }));
  floor.position.y = -0.6;
  floor.receiveShadow = true;
  hallGroup.add(floor);

  const ringGeo = new THREE.RingGeometry(44.6, 46.2, 8);
  ringGeo.rotateX(-Math.PI / 2);
  ringGeo.rotateY(Math.PI / 8);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x113c2b, side: THREE.DoubleSide }));
  ring.position.y = 0.04;
  hallGroup.add(ring);

  const stageMesh = new THREE.Mesh(
    new THREE.BoxGeometry(24, 1.8, 7),
    new THREE.MeshStandardMaterial({ color: 0x113c2b, roughness: 0.5 })
  );
  stageMesh.position.set(0, 0.9, -31);
  hallGroup.add(stageMesh);

  const seatingMesh = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.8, 15),
    new THREE.MeshStandardMaterial({ color: 0xd5cfc0 })
  );
  seatingMesh.position.set(0, 0.4, -19);
  hallGroup.add(seatingMesh);

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
    hallGroup.add(wall);
  });

  scene.add(hallGroup);
}
buildHallArchitecture();

const zoneMeshes = {};
const zoneBeacons = {};

Object.values(HALL_ZONES).forEach(zone => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(zone.size.w, 0.55, zone.size.d),
    new THREE.MeshStandardMaterial({ color: zone.color, transparent: true, opacity: 0.45 })
  );
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

const userPin3d = new THREE.Mesh(
  new THREE.ConeGeometry(1.5, 3.6, 20),
  new THREE.MeshStandardMaterial({ color: 0x113c2b })
);
userPin3d.rotation.x = Math.PI;
scene.add(userPin3d);

let pathLine3d = null;

function updateRouteEverywhere(targetZoneId) {
  drawWalkingFootsteps(targetZoneId);

  const gate = ENTRY_GATES[currentGateKey];
  userPin3d.position.set(gate.pos.x, 2.4, gate.pos.z);

  if (pathLine3d) scene.remove(pathLine3d);
  if (targetZoneId && HALL_ZONES[targetZoneId]) {
    const dest = HALL_ZONES[targetZoneId].pos;
    const points = [
      new THREE.Vector3(gate.pos.x, 0.7, gate.pos.z),
      new THREE.Vector3(0, 0.7, 5),
      new THREE.Vector3(dest.x, 0.7, dest.z)
    ];
    pathLine3d = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: 0x113c2b })
    );
    scene.add(pathLine3d);
  }
}

function flyToZone3d(zoneId) {
  const z = HALL_ZONES[zoneId];
  if (!z) return;
  targetLookAt.set(z.pos.x, 0.5, z.pos.z + 4);
  targetCamPos.set(z.pos.x, 34, z.pos.z + 30);
  isFlying = true;
}

// 3D Raycasting
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = { x: 0, y: 0 };

renderer.domElement.addEventListener("pointerdown", e => {
  isFlying = false;
  downPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener("pointerup", e => {
  if (viewMode !== "3d") return;
  if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) return;

  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(Object.values(zoneMeshes));
  if (hits.length > 0) openZoneInspector(hits[0].object.userData.zoneId);
});

// =========================================================
// 3. 2D / 3D VIEW SWITCHER
// =========================================================
const btnMode2d = document.getElementById("btn-mode-2d");
const btnMode3d = document.getElementById("btn-mode-3d");
const view2dEl = document.getElementById("map-2d-viewport");

function setViewMode(mode) {
  viewMode = mode;
  btnMode2d.classList.toggle("active", mode === "2d");
  btnMode3d.classList.toggle("active", mode === "3d");
  view2dEl.classList.toggle("active", mode === "2d");
  container3d.classList.toggle("active", mode === "3d");
}

btnMode2d.addEventListener("click", () => setViewMode("2d"));
btnMode3d.addEventListener("click", () => setViewMode("3d"));

// =========================================================
// 4. IN-DEPTH EVENT DETAILS & ZONE INSPECTOR MODALS
// =========================================================
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

function openEventDetails(eventId) {
  const ev = TEST_SCHEDULE.find(item => item.id === eventId);
  if (!ev) return;
  selectedEventId = eventId;

  const z = HALL_ZONES[ev.zoneId];
  const isLive = getActiveEvents().some(a => a.id === ev.id);

  document.getElementById("ev-detail-badge").textContent = isLive ? "HAPPENING NOW" : "SCHEDULED SESSION";
  document.getElementById("ev-detail-title").textContent = ev.title;
  document.getElementById("ev-detail-time").textContent =
    `${formatMMSS(ev.startSec)} – ${formatMMSS(ev.startSec + ev.durationSec)} (${ev.durationSec / 60} mins)`;
  document.getElementById("ev-detail-zone").textContent = `${z.name} • ${z.wing}`;
  document.getElementById("ev-detail-overview").textContent = ev.overview;
  document.getElementById("ev-detail-host").textContent = ev.host;
  document.getElementById("ev-detail-highlights").textContent = ev.highlights;

  document.getElementById("event-detail-modal").classList.remove("hidden");
}

document.getElementById("btn-close-ev-detail").addEventListener("click", () => {
  document.getElementById("event-detail-modal").classList.add("hidden");
});

document.getElementById("btn-ev-walk").addEventListener("click", () => {
  const ev = TEST_SCHEDULE.find(item => item.id === selectedEventId);
  if (!ev) return;
  document.getElementById("event-detail-modal").classList.add("hidden");
  updateRouteEverywhere(ev.zoneId);
  if (viewMode === "3d") flyToZone3d(ev.zoneId);
});

document.getElementById("btn-ev-inspect-zone").addEventListener("click", () => {
  const ev = TEST_SCHEDULE.find(item => item.id === selectedEventId);
  if (!ev) return;
  document.getElementById("event-detail-modal").classList.add("hidden");
  openZoneInspector(ev.zoneId);
});

function openZoneInspector(zoneId) {
  selectedZoneId = zoneId;
  const z = HALL_ZONES[zoneId];
  updateRouteEverywhere(zoneId);
  if (viewMode === "3d") flyToZone3d(zoneId);

  document.getElementById("toast-category").textContent = z.category;
  document.getElementById("toast-title").textContent = z.name;
  document.getElementById("toast-wing").textContent = z.wing;
  document.getElementById("toast-desc").textContent = `“${z.description}”`;

  const activeEv = getActiveEvents().find(ev => ev.zoneId === zoneId);
  const upcomingEv = TEST_SCHEDULE.find(ev => ev.zoneId === zoneId);
  document.getElementById("toast-status-badge").textContent = activeEv ? "Live Session" : "Open Access";
  document.getElementById("toast-event-box").textContent = activeEv
    ? `Live Now: ${activeEv.title} — ${activeEv.host}`
    : upcomingEv
    ? `Featured Session: ${upcomingEv.title} (${formatMMSS(upcomingEv.startSec)})`
    : "Open for self-guided gallery viewing.";

  const isStamped = stampedZones.includes(zoneId);
  document.getElementById("checkin-label").textContent = isStamped ? "Stamped" : "Check In";
  document.getElementById("zone-sheet").classList.remove("hidden");
}

document.getElementById("toast-close").addEventListener("click", () => {
  document.getElementById("zone-sheet").classList.add("hidden");
});

document.getElementById("toast-route").addEventListener("click", () => {
  if (selectedZoneId) {
    updateRouteEverywhere(selectedZoneId);
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

// =========================================================
// 5. TIMELINE, DIRECTORIES & NAVIGATION
// =========================================================
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

    document.getElementById("btn-fly-live").onclick = () => {
      updateRouteEverywhere(primary.zoneId);
      if (viewMode === "3d") flyToZone3d(primary.zoneId);
    };
    document.getElementById("btn-live-details").onclick = () => openEventDetails(primary.id);
  }

  const listEl = document.getElementById("schedule-list");
  listEl.innerHTML = TEST_SCHEDULE.map(ev => {
    const live = activeEvents.some(a => a.id === ev.id);
    const z = HALL_ZONES[ev.zoneId];
    return `
      <div class="sched-row ${live ? "is-live" : ""}">
        <div class="sched-row-top">
          <div>
            <div class="sched-time-pill">${formatMMSS(ev.startSec)} – ${formatMMSS(ev.startSec + ev.durationSec)} • ${ev.durationSec / 60} MIN</div>
            <div class="sched-title-lg">${ev.title}</div>
            <div class="sched-sub-loc">${z.name} (${z.wing})</div>
          </div>
        </div>
        <div class="sched-row-actions">
          <button class="row-btn-primary" data-walk-zone="${ev.zoneId}">Walk Footsteps</button>
          <button class="row-btn-secondary" data-detail-ev="${ev.id}">Event Details</button>
        </div>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll("[data-walk-zone]").forEach(btn => {
    btn.addEventListener("click", () => {
      updateRouteEverywhere(btn.dataset.walkZone);
      if (viewMode === "3d") flyToZone3d(btn.dataset.walkZone);
    });
  });

  listEl.querySelectorAll("[data-detail-ev]").forEach(btn => {
    btn.addEventListener("click", () => openEventDetails(btn.dataset.detailEv));
  });
}

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

// Bottom Tabs & Collapse
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

// Gate Modal
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
    const active = getActiveEvents()[0];
    updateRouteEverywhere(selectedZoneId || (active && active.zoneId));
  });
});

document.getElementById("btn-sim-pause").addEventListener("click", e => {
  isPaused = !isPaused;
  e.target.textContent = isPaused ? "Resume" : "Pause";
});
document.getElementById("btn-sim-restart").addEventListener("click", () => {
  simElapsedSec = 0;
  updateScheduleUI();
});

// Init
renderZonesAndPassport();
updateScheduleUI();
updateRouteEverywhere("photo_zone");

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