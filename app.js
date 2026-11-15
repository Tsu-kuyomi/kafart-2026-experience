import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { HALL_ZONES, ENTRY_GATES, FESTIVAL_DAYS, OFFICIAL_PROGRAM } from "./schedule.js";

const urlParams = new URLSearchParams(window.location.search);
let currentGateKey = ENTRY_GATES[urlParams.get("gate")] ? urlParams.get("gate") : "gate_main";
let viewMode = "2d";
let isDarkMode = localStorage.getItem("kafart6_theme") === "dark";
let selectedDay = 1;
let demoStepIndex = 0; // Steps through the selected day's sessions cleanly
let selectedZoneId = null;
let selectedEventId = null;
let stampedZones = JSON.parse(localStorage.getItem("kafart6_stamps") || "[]");

// Auto-detect if today is Nov 19–22, 2026
function detectFestivalDay() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;
  const found = Object.entries(FESTIVAL_DAYS).find(([, info]) => info.isoDate === todayStr);
  return found ? Number(found[0]) : 1;
}
selectedDay = detectFestivalDay();

// =========================================================
// 1. SLIDE-DOWN / HIDE NAVIGATION DRAWER (TAP OR SWIPE)
// =========================================================
const bottomSheet = document.getElementById("bottom-sheet");
const sheetToggleBtn = document.getElementById("btn-toggle-sheet");
const sheetHintText = document.querySelector("#sheet-toggle-hint span");

function setSheetCollapsed(collapsed) {
  bottomSheet.classList.toggle("collapsed", collapsed);
  document.body.classList.toggle("sheet-hidden", collapsed);
  sheetHintText.textContent = collapsed ? "Show Guide" : "Hide Guide";
}

sheetToggleBtn.addEventListener("click", () => {
  setSheetCollapsed(!bottomSheet.classList.contains("collapsed"));
});

// Touch swipe down to hide / swipe up to reveal
let sheetTouchStartY = 0;
sheetToggleBtn.addEventListener("touchstart", e => {
  sheetTouchStartY = e.touches[0].clientY;
}, { passive: true });

sheetToggleBtn.addEventListener("touchend", e => {
  const deltaY = e.changedTouches[0].clientY - sheetTouchStartY;
  if (deltaY > 24) setSheetCollapsed(true);
  else if (deltaY < -24) setSheetCollapsed(false);
});

// =========================================================
// 2. 2D PAN & ZOOM CONTROLLER
// =========================================================
const mapViewport2d = document.getElementById("map-2d-viewport");
const panZoomLayer = document.getElementById("map-pan-zoom-layer");

let mapTransform = { x: 0, y: 0, scale: 1 };
let activePointers = new Map();
let lastPanMid = null;
let lastPinchDist = null;
let didDragMap = false;

function applyMapTransform() {
  panZoomLayer.setAttribute(
    "transform",
    `translate(${mapTransform.x.toFixed(2)}, ${mapTransform.y.toFixed(2)}) scale(${mapTransform.scale.toFixed(3)})`
  );
}

function resetMapTransform() {
  mapTransform = { x: 0, y: 0, scale: 1 };
  applyMapTransform();
}

mapViewport2d.addEventListener("pointerdown", e => {
  mapViewport2d.setPointerCapture(e.pointerId);
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  didDragMap = false;

  if (activePointers.size === 1) {
    lastPanMid = { x: e.clientX, y: e.clientY };
  } else if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    lastPanMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }
});

mapViewport2d.addEventListener("pointermove", e => {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  const svgRect = document.getElementById("hall-svg").getBoundingClientRect();
  const unitRatio = 108 / Math.max(svgRect.width, 1);

  if (activePointers.size === 1 && lastPanMid) {
    const dx = e.clientX - lastPanMid.x;
    const dy = e.clientY - lastPanMid.y;
    if (Math.hypot(dx, dy) > 4) didDragMap = true;
    mapTransform.x += dx * unitRatio;
    mapTransform.y += dy * unitRatio;
    lastPanMid = { x: e.clientX, y: e.clientY };
    applyMapTransform();
  } else if (activePointers.size === 2) {
    didDragMap = true;
    const pts = Array.from(activePointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

    if (lastPinchDist) {
      const zoomFactor = dist / lastPinchDist;
      mapTransform.scale = Math.min(3.2, Math.max(0.75, mapTransform.scale * zoomFactor));
    }
    if (lastPanMid) {
      mapTransform.x += (mid.x - lastPanMid.x) * unitRatio;
      mapTransform.y += (mid.y - lastPanMid.y) * unitRatio;
    }
    lastPinchDist = dist;
    lastPanMid = mid;
    applyMapTransform();
  }
});

function clearPointer(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size === 1) {
    const remaining = Array.from(activePointers.values())[0];
    lastPanMid = { x: remaining.x, y: remaining.y };
    lastPinchDist = null;
  } else if (activePointers.size === 0) {
    lastPanMid = null;
    lastPinchDist = null;
  }
}

mapViewport2d.addEventListener("pointerup", clearPointer);
mapViewport2d.addEventListener("pointercancel", clearPointer);

mapViewport2d.addEventListener("wheel", e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.12 : 0.9;
  mapTransform.scale = Math.min(3.2, Math.max(0.75, mapTransform.scale * factor));
  applyMapTransform();
}, { passive: false });

// =========================================================
// 3. SLOW WALKING FOOTSTEPS
// =========================================================
const svgNS = "http://www.w3.org/2000/svg";
const footstepsLayer = document.getElementById("footsteps-layer");
const originPinSvg = document.getElementById("svg-origin-pin");
const targetRingSvg = document.getElementById("svg-target-ring");

function buildCorridorWaypoints(startSvg, endSvg) {
  const pts = [startSvg];
  if (Math.hypot(startSvg.x - endSvg.x, startSvg.y - endSvg.y) > 22) {
    const entryHub = {
      x: Math.sign(startSvg.x) * Math.min(Math.abs(startSvg.x), 26),
      y: Math.sign(startSvg.y) * Math.min(Math.abs(startSvg.y), 26)
    };
    pts.push(entryHub);
    pts.push({ x: 0, y: 8 });
  }
  pts.push(endSvg);
  return pts;
}

function drawWalkingFootsteps(targetZoneId) {
  const gate = ENTRY_GATES[currentGateKey];
  document.getElementById("gate-label").textContent = gate.short;

  originPinSvg.querySelectorAll("circle").forEach(c => {
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
  const footColor = isDarkMode ? "#D8EE52" : "#113C2B";
  let stepIndex = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segLen = Math.hypot(dx, dy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    const stepSpacing = 3.4;
    const stepsCount = Math.max(1, Math.floor(segLen / stepSpacing));

    const nx = -dy / (segLen || 1);
    const ny = dx / (segLen || 1);

    for (let s = 1; s <= stepsCount; s++) {
      const t = s / (stepsCount + 0.5);
      const isLeft = stepIndex % 2 === 0;
      const sideOffset = isLeft ? -0.95 : 0.95;

      const fx = a.x + dx * t + nx * sideOffset;
      const fy = a.y + dy * t + ny * sideOffset;

      const foot = document.createElementNS(svgNS, "ellipse");
      foot.setAttribute("cx", fx.toFixed(2));
      foot.setAttribute("cy", fy.toFixed(2));
      foot.setAttribute("rx", "0.7");
      foot.setAttribute("ry", "1.28");
      foot.setAttribute("fill", footColor);
      foot.setAttribute("transform", `rotate(${angleDeg.toFixed(1)} ${fx.toFixed(2)} ${fy.toFixed(2)})`);
      foot.setAttribute("class", "footstep-mark");
      foot.style.animationDelay = `${stepIndex * 225}ms`;

      footstepsLayer.appendChild(foot);
      stepIndex++;
    }
  }
}

document.querySelectorAll(".zone-group").forEach(g => {
  g.addEventListener("click", () => {
    if (didDragMap) return;
    const zId = g.dataset.zone;
    if (HALL_ZONES[zId]) openZoneInspector(zId);
  });
});

// =========================================================
// 4. 3D ARCHITECTURAL MAQUETTE (THREE.JS)
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

let floorMat, wallMat, seatingMat;

function buildHallArchitecture() {
  const hallGroup = new THREE.Group();

  const floorGeo = new THREE.CylinderGeometry(46, 46, 1.2, 8);
  floorGeo.rotateY(Math.PI / 8);
  floorMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
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

  seatingMat = new THREE.MeshStandardMaterial({ color: 0xd5cfc0 });
  const seatingMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 15), seatingMat);
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

  wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
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
      new THREE.LineBasicMaterial({ color: isDarkMode ? 0xd8ee52 : 0x113c2b })
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

function resetCamera3d() {
  targetLookAt.set(0, 0, 6);
  targetCamPos.set(0, 76, 66);
  isFlying = true;
}

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
// 5. DARK MODE & VIEW SWITCHER
// =========================================================
function applyTheme(dark) {
  isDarkMode = dark;
  document.body.classList.toggle("dark-mode", dark);
  localStorage.setItem("kafart6_theme", dark ? "dark" : "light");

  document.getElementById("icon-moon").classList.toggle("hidden", dark);
  document.getElementById("icon-sun").classList.toggle("hidden", !dark);

  const bgHex = dark ? 0x0b0e11 : 0xfaf7f0;
  scene.background.setHex(bgHex);
  scene.fog.color.setHex(bgHex);
  floorMat.color.setHex(dark ? 0x161d22 : 0xe6e1d3);
  wallMat.color.setHex(dark ? 0x26313a : 0xffffff);
  seatingMat.color.setHex(dark ? 0x222b33 : 0xd5cfc0);

  const currentEv = getCurrentFeaturedSession();
  updateRouteEverywhere(selectedZoneId || (currentEv && currentEv.zoneId));
}

document.getElementById("btn-theme").addEventListener("click", () => applyTheme(!isDarkMode));

const btnMode2d = document.getElementById("btn-mode-2d");
const btnMode3d = document.getElementById("btn-mode-3d");

function setViewMode(mode) {
  viewMode = mode;
  btnMode2d.classList.toggle("active", mode === "2d");
  btnMode3d.classList.toggle("active", mode === "3d");
  mapViewport2d.classList.toggle("active", mode === "2d");
  container3d.classList.toggle("active", mode === "3d");
}

btnMode2d.addEventListener("click", () => setViewMode("2d"));
btnMode3d.addEventListener("click", () => setViewMode("3d"));

document.getElementById("btn-recenter").addEventListener("click", () => {
  if (viewMode === "2d") resetMapTransform();
  else resetCamera3d();
});

// =========================================================
// 6. OFFICIAL 4-DAY SCHEDULE ENGINE
// =========================================================
function getDaySessions(dayNum) {
  return OFFICIAL_PROGRAM.filter(ev => ev.day === dayNum);
}

function getCurrentFeaturedSession() {
  const daySessions = getDaySessions(selectedDay);
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

  // If today matches the selected festival day, match real clock time first
  if (FESTIVAL_DAYS[selectedDay].isoDate === todayStr) {
    const mins = now.getHours() * 60 + now.getMinutes();
    const liveMatch = daySessions.find(ev => mins >= ev.startMin && mins < ev.endMin);
    if (liveMatch) return liveMatch;
  }

  return daySessions[demoStepIndex % daySessions.length];
}

function openEventDetails(eventId) {
  const ev = OFFICIAL_PROGRAM.find(item => item.id === eventId);
  if (!ev) return;
  selectedEventId = eventId;

  const z = HALL_ZONES[ev.zoneId];
  const dayInfo = FESTIVAL_DAYS[ev.day];

  document.getElementById("ev-detail-badge").textContent = `${dayInfo.label.toUpperCase()} • ${dayInfo.dateLabel.toUpperCase()}`;
  document.getElementById("ev-detail-title").textContent = ev.title;
  document.getElementById("ev-detail-time").textContent = ev.timeLabel;
  document.getElementById("ev-detail-zone").textContent = `${z.name} • ${z.wing}`;
  document.getElementById("ev-detail-access").textContent = ev.access;
  document.getElementById("ev-detail-overview").textContent = ev.overview;
  document.getElementById("ev-detail-host").textContent = ev.featuring;
  document.getElementById("ev-detail-highlights").textContent = ev.moderator;

  document.getElementById("event-detail-modal").classList.remove("hidden");
}

document.getElementById("btn-close-ev-detail").addEventListener("click", () => {
  document.getElementById("event-detail-modal").classList.add("hidden");
});

document.getElementById("btn-ev-walk").addEventListener("click", () => {
  const ev = OFFICIAL_PROGRAM.find(item => item.id === selectedEventId);
  if (!ev) return;
  document.getElementById("event-detail-modal").classList.add("hidden");
  updateRouteEverywhere(ev.zoneId);
  if (viewMode === "3d") flyToZone3d(ev.zoneId);
});

document.getElementById("btn-ev-inspect-zone").addEventListener("click", () => {
  const ev = OFFICIAL_PROGRAM.find(item => item.id === selectedEventId);
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

  const daySessions = getDaySessions(selectedDay).filter(ev => ev.zoneId === zoneId);
  document.getElementById("toast-status-badge").textContent = `${FESTIVAL_DAYS[selectedDay].label}`;
  document.getElementById("toast-event-box").textContent = daySessions.length
    ? daySessions.map(s => `${s.timeLabel}: ${s.title}`).join(" • ")
    : "Open for continuous exhibition walkthrough & vendor browsing.";

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

function updateScheduleUI() {
  const daySessions = getDaySessions(selectedDay);
  const featured = getCurrentFeaturedSession();
  const dayInfo = FESTIVAL_DAYS[selectedDay];

  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.day) === selectedDay);
  });

  document.getElementById("sim-clock").textContent =
    `${(demoStepIndex % daySessions.length) + 1} / ${daySessions.length}`;

  Object.keys(HALL_ZONES).forEach(zId => {
    const isHot = featured && featured.zoneId === zId;
    zoneBeacons[zId].visible = isHot;
    zoneMeshes[zId].material.opacity = isHot ? 0.85 : 0.4;
  });

  if (featured) {
    const z = HALL_ZONES[featured.zoneId];
    document.getElementById("live-countdown").textContent =
      `${dayInfo.label.toUpperCase()} • ${featured.timeLabel.toUpperCase()}`;
    document.getElementById("live-title").textContent = featured.title;
    document.getElementById("live-zone-label").textContent = `${z.name} • ${z.wing}`;

    document.getElementById("btn-fly-live").onclick = () => {
      updateRouteEverywhere(featured.zoneId);
      if (viewMode === "3d") flyToZone3d(featured.zoneId);
    };
    document.getElementById("btn-live-details").onclick = () => openEventDetails(featured.id);
  }

  const listEl = document.getElementById("schedule-list");
  listEl.innerHTML = daySessions.map(ev => {
    const isFeatured = featured && featured.id === ev.id;
    const z = HALL_ZONES[ev.zoneId];
    return `
      <div class="sched-row ${isFeatured ? "is-live" : ""}">
        <div>
          <div class="sched-time-pill">${ev.timeLabel} • ${ev.access.toUpperCase()}</div>
          <div class="sched-title-lg">${ev.title}</div>
          <div class="sched-sub-loc">${z.name} (${z.wing})</div>
        </div>
        <div class="sched-row-actions">
          <button class="row-btn-primary" data-walk-zone="${ev.zoneId}" data-ev-id="${ev.id}">Walk Footsteps</button>
          <button class="row-btn-secondary" data-detail-ev="${ev.id}">Event Details</button>
        </div>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll("[data-walk-zone]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = daySessions.findIndex(s => s.id === btn.dataset.evId);
      if (idx >= 0) demoStepIndex = idx;
      updateScheduleUI();
      updateRouteEverywhere(btn.dataset.walkZone);
      if (viewMode === "3d") flyToZone3d(btn.dataset.walkZone);
    });
  });

  listEl.querySelectorAll("[data-detail-ev]").forEach(btn => {
    btn.addEventListener("click", () => openEventDetails(btn.dataset.detailEv));
  });
}

document.querySelectorAll(".day-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedDay = Number(btn.dataset.day);
    demoStepIndex = 0;
    selectedZoneId = null;
    updateScheduleUI();
    const featured = getCurrentFeaturedSession();
    if (featured) updateRouteEverywhere(featured.zoneId);
  });
});

document.getElementById("btn-next-session").addEventListener("click", () => {
  const daySessions = getDaySessions(selectedDay);
  demoStepIndex = (demoStepIndex + 1) % daySessions.length;
  selectedZoneId = null;
  updateScheduleUI();
  const featured = getCurrentFeaturedSession();
  if (featured) {
    updateRouteEverywhere(featured.zoneId);
    if (viewMode === "3d") flyToZone3d(featured.zoneId);
  }
});

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

document.querySelectorAll(".cat-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    setSheetCollapsed(false);
    document.querySelectorAll(".cat-pill, .sheet-view").forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
  });
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
    const featured = getCurrentFeaturedSession();
    updateRouteEverywhere(selectedZoneId || (featured && featured.zoneId));
  });
});

// Initialize
applyTheme(isDarkMode);
renderZonesAndPassport();
updateScheduleUI();
const initialFeatured = getCurrentFeaturedSession();
if (initialFeatured) updateRouteEverywhere(initialFeatured.zoneId);

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