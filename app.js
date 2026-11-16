import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  SUPABASE_CONFIG,
  HALL_ZONES,
  ENTRY_GATES,
  BOOTH_FRAMES,
  SHARE_CAPTIONS,
  FESTIVAL_DAYS,
  OFFICIAL_PROGRAM
} from "./schedule.js";

// =========================================================
// 0. AUTOMATIC ZERO-LOGIN DEVICE IDENTITY (KAF6-XXXX)
// =========================================================
function getOrCreateDeviceId() {
  let id = localStorage.getItem("kafart6_device_id");
  if (!id) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    id = `KAF6-${num}-${letter}`;
    localStorage.setItem("kafart6_device_id", id);
    document.cookie = `kafart6_id=${id}; max-age=31536000; path=/`;
  }
  return id;
}

const DEVICE_ID = getOrCreateDeviceId();
document.getElementById("device-id-badge").textContent = DEVICE_ID;

const urlParams = new URLSearchParams(window.location.search);
let currentGateKey = ENTRY_GATES[urlParams.get("gate")] ? urlParams.get("gate") : "gate_main";
let viewMode = "2d";
let isDarkMode = localStorage.getItem("kafart6_theme") === "dark";
let selectedDay = 1;
let demoStepIndex = 0;
let selectedZoneId = null;
let selectedEventId = null;
let stampedZones = JSON.parse(localStorage.getItem("kafart6_stamps") || "[]");
let unlockedCodes = JSON.parse(localStorage.getItem("kafart6_qr_unlocks") || "[]");
let swappedPrintIds = JSON.parse(localStorage.getItem("kafart6_swapped_prints") || "[]");

const urlUnlock = (urlParams.get("unlock") || "").trim().toUpperCase();
if (urlUnlock && !unlockedCodes.includes(urlUnlock)) {
  unlockedCodes.push(urlUnlock);
  localStorage.setItem("kafart6_qr_unlocks", JSON.stringify(unlockedCodes));
}

function detectFestivalDay() {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const found = Object.entries(FESTIVAL_DAYS).find(([, info]) => info.isoDate === todayStr);
  return found ? Number(found[0]) : 1;
}
selectedDay = detectFestivalDay();

// =========================================================
// 1. FIRST-OPEN INTERACTIVE TOUR (WITH SKIP)
// =========================================================
const TOUR_STEPS = [
  {
    pill: "STEP 1 OF 3",
    title: "LIVE HALL WAYFINDING",
    desc: "CHOOSE YOUR ENTRY GATE AT THE TOP RIGHT, THEN TAP ANY GALLERY WING OR SESSION TO WATCH FOOTSTEPS WALK YOU THERE IN 2D OR 3D.",
    svg: `<svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`
  },
  {
    pill: "STEP 2 OF 3",
    title: "4-DAY PROGRAM & ZONES",
    desc: "EXPLORE EVERY RUNWAY SHOW, WORKSHOP, AND PANEL FROM NOV 19–22 INSIDE THE HOME HUB — OR SLIDE THE GUIDE DOWN FOR AN UNOBSTRUCTED 3D VIEW.",
    svg: `<svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  },
  {
    pill: "STEP 3 OF 3",
    title: "BOOTH & DIGITAL PRINT SWAP",
    desc: "OPEN BOOTH ON YOUR HOME SCREEN TO SNAP FRAMED PORTRAITS, SCAN HIDDEN HALL QR CODES FOR SECRET FRAMES, AND SWAP PRINTS ON THE BIENNALE WALL.",
    svg: `<svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`
  }
];

let tourStepIndex = 0;
const tourOverlay = document.getElementById("tour-overlay");

function renderTourStep() {
  const step = TOUR_STEPS[tourStepIndex];
  document.getElementById("tour-step-pill").textContent = step.pill;
  document.getElementById("tour-icon-box").innerHTML = step.svg;
  document.getElementById("tour-title").textContent = step.title;
  document.getElementById("tour-desc").textContent = step.desc;
  document.getElementById("tour-next-label").textContent =
    tourStepIndex === TOUR_STEPS.length - 1 ? "START EXPLORING" : "NEXT";

  document.querySelectorAll(".t-dot").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === tourStepIndex);
  });
}

function openTour() {
  tourStepIndex = 0;
  renderTourStep();
  tourOverlay.classList.remove("hidden");
}

function closeTour() {
  tourOverlay.classList.add("hidden");
  localStorage.setItem("kafart6_tour_done", "true");
}

document.getElementById("btn-tour-skip").addEventListener("click", closeTour);
document.getElementById("btn-replay-tour").addEventListener("click", openTour);
document.getElementById("btn-tour-next").addEventListener("click", () => {
  if (tourStepIndex < TOUR_STEPS.length - 1) {
    tourStepIndex++;
    renderTourStep();
  } else {
    closeTour();
  }
});

if (!localStorage.getItem("kafart6_tour_done")) {
  openTour();
}

// =========================================================
// 2. SLIDE-DOWN / HIDE NAVIGATION DRAWER
// =========================================================
const bottomSheet = document.getElementById("bottom-sheet");
const sheetToggleBtn = document.getElementById("btn-toggle-sheet");
const sheetHintText = document.querySelector("#sheet-toggle-hint span");

function setSheetCollapsed(collapsed) {
  bottomSheet.classList.toggle("collapsed", collapsed);
  document.body.classList.toggle("sheet-hidden", collapsed);
  sheetHintText.textContent = collapsed ? "SHOW GUIDE" : "HIDE GUIDE";
}

sheetToggleBtn.addEventListener("click", () => {
  setSheetCollapsed(!bottomSheet.classList.contains("collapsed"));
});

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
// 3. 2D PAN & ZOOM CONTROLLER
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
      mapTransform.scale = Math.min(3.2, Math.max(0.75, mapTransform.scale * (dist / lastPinchDist)));
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
  mapTransform.scale = Math.min(3.2, Math.max(0.75, mapTransform.scale * (e.deltaY < 0 ? 1.12 : 0.9)));
  applyMapTransform();
}, { passive: false });

// =========================================================
// 4. SLOW WALKING FOOTSTEPS
// =========================================================
const svgNS = "http://www.w3.org/2000/svg";
const footstepsLayer = document.getElementById("footsteps-layer");
const originPinSvg = document.getElementById("svg-origin-pin");
const targetRingSvg = document.getElementById("svg-target-ring");

function buildCorridorWaypoints(startSvg, endSvg) {
  const pts = [startSvg];
  if (Math.hypot(startSvg.x - endSvg.x, startSvg.y - endSvg.y) > 22) {
    pts.push({
      x: Math.sign(startSvg.x) * Math.min(Math.abs(startSvg.x), 26),
      y: Math.sign(startSvg.y) * Math.min(Math.abs(startSvg.y), 26)
    });
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
    const stepsCount = Math.max(1, Math.floor(segLen / 3.4));
    const nx = -dy / (segLen || 1);
    const ny = dx / (segLen || 1);

    for (let s = 1; s <= stepsCount; s++) {
      const t = s / (stepsCount + 0.5);
      const sideOffset = stepIndex % 2 === 0 ? -0.95 : 0.95;
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
// 5. 3D ARCHITECTURAL MAQUETTE
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
scene.add(sunLight);

let floorMat, wallMat, seatingMat;

function buildHallArchitecture() {
  const hallGroup = new THREE.Group();
  const floorGeo = new THREE.CylinderGeometry(46, 46, 1.2, 8);
  floorGeo.rotateY(Math.PI / 8);
  floorMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d3, roughness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.6;
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
    pathLine3d = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(gate.pos.x, 0.7, gate.pos.z),
        new THREE.Vector3(0, 0.7, 5),
        new THREE.Vector3(dest.x, 0.7, dest.z)
      ]),
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
// 6. PROCEDURAL 10-FRAME PHOTO BOOTH STUDIO (INSIDE HOME)
// =========================================================
const boothCanvas = document.getElementById("booth-canvas");
const cameraVideo = document.getElementById("camera-video");

let selectedFrameId = "f1";
let userPhotoImg = null;
let cameraStream = null;

function isFrameUnlocked(frame) {
  return !frame.secretCode || unlockedCodes.includes(frame.secretCode);
}

function renderFramedArtwork(targetCanvas, frameId, sourceImage) {
  const ctx = targetCanvas.getContext("2d");
  const w = targetCanvas.width;
  const h = targetCanvas.height;
  const pad = Math.round(w * 0.065);
  const bottomBar = Math.round(h * 0.14);

  ctx.clearRect(0, 0, w, h);

  const themes = {
    f1: { bg: "#FAF7F0", border: "#113C2B", accent: "#F3842B", text: "#141413", title: "TO HAVE & TO HOLD" },
    f2: { bg: "#113C2B", border: "#D8EE52", accent: "#F3842B", text: "#D8EE52", title: "SAHELIAN LOOM • KADUNA" },
    f3: { bg: "#D8EE52", border: "#141413", accent: "#113C2B", text: "#141413", title: "ALL-ACCESS RUNWAY PASS" },
    f4: { bg: "#F3842B", border: "#FAF7F0", accent: "#113C2B", text: "#FAF7F0", title: "INDIGO & CLAY GUILD" },
    f5: { bg: "#EFECE3", border: "#141413", accent: "#F3B2D0", text: "#141413", title: "KAFART BIENNALE 2026" },
    f6: { bg: "#113C2B", border: "#F3842B", accent: "#D8EE52", text: "#FAF7F0", title: "COLLECTOR'S DOUBLE ORB" },
    f7: { bg: "#1A2421", border: "#D8EE52", accent: "#F3842B", text: "#D8EE52", title: "SECRET 07 • LOOM MASTER" },
    f8: { bg: "#5A2A1B", border: "#F3842B", accent: "#D8EE52", text: "#FAF7F0", title: "SECRET 08 • NOK TERRACOTTA" },
    f9: { bg: "#0E1E38", border: "#F3B2D0", accent: "#D8EE52", text: "#FAF7F0", title: "SECRET 09 • ZARIA INDIGO" },
    f10: { bg: "#141413", border: "#D8EE52", accent: "#F3842B", text: "#D8EE52", title: "CURATOR'S GOLD • HD EDITION" }
  };

  const t = themes[frameId] || themes.f1;
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, w, h);

  const px = pad;
  const py = pad;
  const pw = w - pad * 2;
  const ph = h - pad - bottomBar;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, Math.round(w * 0.025));
  ctx.clip();

  if (sourceImage) {
    const imgRatio = sourceImage.width / sourceImage.height;
    const boxRatio = pw / ph;
    let drawW = pw, drawH = ph, offX = px, offY = py;
    if (imgRatio > boxRatio) {
      drawW = ph * imgRatio;
      offX = px - (drawW - pw) / 2;
    } else {
      drawH = pw / imgRatio;
      offY = py - (drawH - ph) / 2;
    }
    ctx.drawImage(sourceImage, offX, offY, drawW, drawH);
  } else {
    ctx.fillStyle = "#1E262C";
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = t.accent;
    ctx.beginPath();
    ctx.arc(px + pw * 0.38, py + ph * 0.46, pw * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.border;
    ctx.beginPath();
    ctx.arc(px + pw * 0.62, py + ph * 0.46, pw * 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FAF7F0";
    ctx.font = `800 ${Math.round(w * 0.036)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("TAP CAMERA OR UPLOAD", w / 2, py + ph * 0.78);
  }
  ctx.restore();

  ctx.strokeStyle = t.border;
  ctx.lineWidth = Math.max(3, Math.round(w * 0.007));
  ctx.strokeRect(px, py, pw, ph);

  if (["f2", "f7", "f9", "f10"].includes(frameId)) {
    ctx.fillStyle = t.accent;
    const step = Math.round(h * 0.045);
    for (let y = pad; y < h - bottomBar; y += step) {
      ctx.fillRect(Math.round(pad * 0.28), y, Math.round(pad * 0.42), Math.round(step * 0.45));
      ctx.fillRect(w - Math.round(pad * 0.7), y + Math.round(step * 0.22), Math.round(pad * 0.42), Math.round(step * 0.45));
    }
  }

  if (frameId === "f6" || frameId === "f10") {
    ctx.fillStyle = t.accent;
    ctx.beginPath();
    ctx.arc(w - pad - Math.round(w * 0.09), h - Math.round(bottomBar * 0.5), Math.round(w * 0.042), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.border;
    ctx.beginPath();
    ctx.arc(w - pad - Math.round(w * 0.045), h - Math.round(bottomBar * 0.5), Math.round(w * 0.042), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = t.text;
  ctx.textAlign = "left";
  ctx.font = `800 ${Math.round(w * 0.042)}px "Syne", sans-serif`;
  ctx.fillText("KAFART 6 • KADUNA", pad, h - Math.round(bottomBar * 0.54));

  ctx.font = `700 ${Math.round(w * 0.026)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(`${t.title} • ${DEVICE_ID}`, pad, h - Math.round(bottomBar * 0.24));
}

function updateBoothPreview() {
  renderFramedArtwork(boothCanvas, selectedFrameId, userPhotoImg);
  const frameObj = BOOTH_FRAMES.find(f => f.id === selectedFrameId);
  document.getElementById("hd-badge").classList.toggle("hidden", !(frameObj && frameObj.isHD));
}

function renderFrameSelector() {
  const unlockedCount = BOOTH_FRAMES.filter(isFrameUnlocked).length;
  document.getElementById("unlocked-frame-count").textContent = unlockedCount;

  const strip = document.getElementById("frame-strip");
  strip.innerHTML = BOOTH_FRAMES.map(f => {
    const unlocked = isFrameUnlocked(f);
    const active = f.id === selectedFrameId;
    return `
      <button class="frame-chip ${active ? "active" : ""} ${unlocked ? "" : "locked"}" data-frame="${f.id}">
        <strong>${unlocked ? f.name : "LOCKED QR"}</strong>
        <span>${f.tag}</span>
      </button>
    `;
  }).join("");

  strip.querySelectorAll(".frame-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = BOOTH_FRAMES.find(item => item.id === btn.dataset.frame);
      if (!f) return;
      if (!isFrameUnlocked(f)) {
        document.getElementById("qr-unlock-modal").classList.remove("hidden");
        return;
      }
      selectedFrameId = f.id;
      renderFrameSelector();
      updateBoothPreview();
    });
  });
}

document.getElementById("btn-start-camera").addEventListener("click", async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraVideo.classList.remove("hidden");
    boothCanvas.classList.add("hidden");
    document.getElementById("btn-snap-photo").classList.remove("hidden");
  } catch {
    document.getElementById("booth-status-msg").textContent = "CAMERA UNAVAILABLE — USE UPLOAD PHOTO.";
  }
});

document.getElementById("btn-snap-photo").addEventListener("click", () => {
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = cameraVideo.videoWidth || 720;
  snapCanvas.height = cameraVideo.videoHeight || 900;
  snapCanvas.getContext("2d").drawImage(cameraVideo, 0, 0, snapCanvas.width, snapCanvas.height);

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  cameraVideo.classList.add("hidden");
  boothCanvas.classList.remove("hidden");
  document.getElementById("btn-snap-photo").classList.add("hidden");

  const img = new Image();
  img.onload = () => {
    userPhotoImg = img;
    updateBoothPreview();
  };
  img.src = snapCanvas.toDataURL("image/jpeg", 0.92);
});

document.getElementById("input-upload-photo").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      userPhotoImg = img;
      updateBoothPreview();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("btn-download-frame").addEventListener("click", () => {
  const frameObj = BOOTH_FRAMES.find(f => f.id === selectedFrameId);
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = frameObj && frameObj.isHD ? 2160 : 1080;
  exportCanvas.height = frameObj && frameObj.isHD ? 2700 : 1350;

  renderFramedArtwork(exportCanvas, selectedFrameId, userPhotoImg);

  const link = document.createElement("a");
  link.download = `KAFART6-${frameObj.id.toUpperCase()}-${DEVICE_ID}.jpg`;
  link.href = exportCanvas.toDataURL("image/jpeg", frameObj && frameObj.isHD ? 0.95 : 0.85);
  link.click();

  document.getElementById("booth-status-msg").textContent =
    frameObj && frameObj.isHD ? "SAVED IN FULL HD (2160×2700)!" : "SAVED TO YOUR PHONE!";
});

document.getElementById("btn-open-qr-unlock").addEventListener("click", () => {
  document.getElementById("qr-unlock-modal").classList.remove("hidden");
});
document.getElementById("btn-close-qr-modal").addEventListener("click", () => {
  document.getElementById("qr-unlock-modal").classList.add("hidden");
});
document.getElementById("btn-submit-qr-code").addEventListener("click", () => {
  const code = document.getElementById("qr-code-input").value.trim().toUpperCase();
  const match = BOOTH_FRAMES.find(f => f.secretCode === code);
  const msgEl = document.getElementById("qr-feedback-msg");

  if (!match) {
    msgEl.textContent = "INVALID CODE. TRY LOOM, NOK, INDIGO, OR CURATOR.";
    return;
  }
  if (!unlockedCodes.includes(code)) {
    unlockedCodes.push(code);
    localStorage.setItem("kafart6_qr_unlocks", JSON.stringify(unlockedCodes));
  }
  selectedFrameId = match.id;
  renderFrameSelector();
  updateBoothPreview();
  msgEl.textContent = `UNLOCKED: ${match.name}!`;
});

function renderCaptions() {
  const list = document.getElementById("caption-list");
  list.innerHTML = SHARE_CAPTIONS.map((cap, idx) => `
    <div class="caption-item">
      <p>${cap}</p>
      <button class="copy-cap-btn" data-cap-idx="${idx}">COPY</button>
    </div>
  `).join("");

  list.querySelectorAll(".copy-cap-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = SHARE_CAPTIONS[Number(btn.dataset.capIdx)];
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "COPIED";
        setTimeout(() => { btn.textContent = "COPY"; }, 1800);
      } catch {
        btn.textContent = "READY";
      }
    });
  });
}

document.getElementById("btn-shuffle-captions").addEventListener("click", () => {
  SHARE_CAPTIONS.push(SHARE_CAPTIONS.shift());
  renderCaptions();
});

// =========================================================
// 7. DIGITAL PRINT SWAP WALL (SUPABASE + LOCAL FALLBACK)
// =========================================================
function buildSeededArchivalPrints() {
  const seeds = [
    { id: "seed_1", device_id: "KAFART-2019", frame_name: "ARCHIVE EDITION", zone: "EXHIBITION 3", fId: "f1" },
    { id: "seed_2", device_id: "KAFART-2022", frame_name: "SAHELIAN LOOM", zone: "FASHION WING", fId: "f2" },
    { id: "seed_3", device_id: "KAFART-2024", frame_name: "INDIGO & CLAY", zone: "EXHIBITION 4", fId: "f4" },
    { id: "seed_4", device_id: "KAF6-HOST", frame_name: "CURATOR GOLD", zone: "MAIN STAGE", fId: "f10" }
  ];

  return seeds.map(s => {
    const c = document.createElement("canvas");
    c.width = 400;
    c.height = 500;
    renderFramedArtwork(c, s.fId, null);
    return {
      id: s.id,
      device_id: s.device_id,
      frame_name: s.frame_name,
      zone: s.zone,
      thumb_url: c.toDataURL("image/jpeg", 0.72)
    };
  });
}

let wallPrints = JSON.parse(localStorage.getItem("kafart6_wall_prints") || "null") || buildSeededArchivalPrints();

async function pinCurrentPhotoToWall() {
  const statusEl = document.getElementById("booth-status-msg");
  statusEl.textContent = "COMPRESSING & PINNING TO WALL...";

  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 400;
  thumbCanvas.height = 500;
  renderFramedArtwork(thumbCanvas, selectedFrameId, userPhotoImg);
  const thumbDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.75);

  const frameObj = BOOTH_FRAMES.find(f => f.id === selectedFrameId);
  const activeZone = selectedZoneId ? HALL_ZONES[selectedZoneId].name : "HALL FLOOR";

  const newEntry = {
    id: `print_${Date.now()}`,
    device_id: DEVICE_ID,
    frame_name: frameObj ? frameObj.name : "KAFART 6",
    zone: activeZone,
    thumb_url: thumbDataUrl
  };

  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
      const blob = await (await fetch(thumbDataUrl)).blob();
      const filePath = `${DEVICE_ID}/${Date.now()}.jpg`;
      const uploadRes = await fetch(
        `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucket}/${filePath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
            "Content-Type": "image/jpeg"
          },
          body: blob
        }
      );

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${filePath}`;
        newEntry.thumb_url = publicUrl;
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            device_id: newEntry.device_id,
            frame_name: newEntry.frame_name,
            zone_name: newEntry.zone,
            image_url: publicUrl
          })
        });
      }
    } catch {
      // Seamless local fallback
    }
  }

  wallPrints.unshift(newEntry);
  localStorage.setItem("kafart6_wall_prints", JSON.stringify(wallPrints.slice(0, 24)));
  statusEl.textContent = "PINNED TO WALL! SWAP UNLOCKED.";
  renderMemoryWall();
  switchPrimaryTab("wall");
}

document.getElementById("btn-pin-to-wall").addEventListener("click", pinCurrentPhotoToWall);

async function refreshWallFromCloud() {
  if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    try {
      const res = await fetch(
        `${SUPABASE_CONFIG.url}/rest/v1/${SUPABASE_CONFIG.table}?select=*&order=created_at.desc&limit=16`,
        {
          headers: {
            apikey: SUPABASE_CONFIG.anonKey,
            Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`
          }
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (rows.length) {
          wallPrints = rows.map(r => ({
            id: String(r.id),
            device_id: r.device_id,
            frame_name: r.frame_name,
            zone: r.zone_name,
            thumb_url: r.image_url
          }));
        }
      }
    } catch {
      // Keep local prints
    }
  }
  renderMemoryWall();
}

document.getElementById("btn-refresh-wall").addEventListener("click", refreshWallFromCloud);

function renderMemoryWall() {
  const userHasContributed = wallPrints.some(p => p.device_id === DEVICE_ID);
  const grid = document.getElementById("memory-wall-grid");

  grid.innerHTML = wallPrints.map(p => {
    const isMine = p.device_id === DEVICE_ID;
    const isSwapped = swappedPrintIds.includes(p.id);
    let btnText = "PIN 1 TO SWAP";
    if (isMine) btnText = "YOUR PRINT";
    else if (isSwapped) btnText = "SWAPPED ✓";
    else if (userHasContributed) btnText = "SWAP PRINT";

    return `
      <article class="wall-card">
        <img src="${p.thumb_url}" alt="${p.frame_name}" loading="lazy" />
        <div class="wall-card-meta">
          <div class="wall-card-top">
            <span>${p.device_id}</span>
            <span>${p.zone}</span>
          </div>
          <button class="swap-btn ${isSwapped || isMine ? "swapped" : ""}" data-swap-id="${p.id}">
            ${btnText}
          </button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".swap-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pId = btn.dataset.swapId;
      const item = wallPrints.find(x => x.id === pId);
      if (!item || item.device_id === DEVICE_ID) return;

      if (!userHasContributed) {
        switchPrimaryTab("home");
        showHomeSubView("booth");
        document.getElementById("booth-status-msg").textContent = "PIN 1 PHOTO FIRST TO SWAP PRINTS!";
        return;
      }

      if (!swappedPrintIds.includes(pId)) {
        swappedPrintIds.push(pId);
        localStorage.setItem("kafart6_swapped_prints", JSON.stringify(swappedPrintIds));
        renderMemoryWall();
      }
    });
  });
}

// =========================================================
// 8. THEME, 2-TAB NAVIGATION & HOME SUB-VIEWS
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

function switchPrimaryTab(tabName) {
  setSheetCollapsed(false);
  document.querySelectorAll(".main-tab, .sheet-view").forEach(el => el.classList.remove("active"));
  document.querySelector(`.main-tab[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(`tab-${tabName}`).classList.add("active");
}

document.querySelectorAll(".main-tab").forEach(btn => {
  btn.addEventListener("click", () => switchPrimaryTab(btn.dataset.tab));
});

// Home Sub-Views (Dashboard / 4-Day Program / Hall Zones / Photo Booth)
function showHomeSubView(sub) {
  document.getElementById("home-dashboard").classList.toggle("hidden", sub !== "dashboard");
  document.getElementById("home-program").classList.toggle("hidden", sub !== "program");
  document.getElementById("home-zones").classList.toggle("hidden", sub !== "zones");
  document.getElementById("home-booth").classList.toggle("hidden", sub !== "booth");
}

document.getElementById("btn-open-program").addEventListener("click", () => showHomeSubView("program"));
document.getElementById("btn-open-zones").addEventListener("click", () => showHomeSubView("zones"));
document.getElementById("btn-open-booth").addEventListener("click", () => showHomeSubView("booth"));

document.getElementById("btn-back-from-program").addEventListener("click", () => showHomeSubView("dashboard"));
document.getElementById("btn-back-from-zones").addEventListener("click", () => showHomeSubView("dashboard"));
document.getElementById("btn-back-from-booth").addEventListener("click", () => showHomeSubView("dashboard"));

function getDaySessions(dayNum) {
  return OFFICIAL_PROGRAM.filter(ev => ev.day === dayNum);
}

function getCurrentFeaturedSession() {
  const daySessions = getDaySessions(selectedDay);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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

  document.getElementById("ev-detail-badge").textContent = `${dayInfo.label} • ${dayInfo.dateLabel}`;
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
  document.getElementById("toast-status-badge").textContent = FESTIVAL_DAYS[selectedDay].label;
  document.getElementById("toast-event-box").textContent = daySessions.length
    ? daySessions.map(s => `${s.timeLabel}: ${s.title}`).join(" • ")
    : "OPEN FOR CONTINUOUS EXHIBITION WALKTHROUGH & VENDOR BROWSING.";

  const isStamped = stampedZones.includes(zoneId);
  document.getElementById("checkin-label").textContent = isStamped ? "STAMPED" : "CHECK IN";
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

  Object.keys(HALL_ZONES).forEach(zId => {
    const isHot = featured && featured.zoneId === zId;
    zoneBeacons[zId].visible = isHot;
    zoneMeshes[zId].material.opacity = isHot ? 0.85 : 0.4;
  });

  if (featured) {
    const z = HALL_ZONES[featured.zoneId];
    document.getElementById("live-countdown").textContent = `${dayInfo.label} • ${featured.timeLabel}`;
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
          <div class="sched-time-pill">${ev.timeLabel} • ${ev.access}</div>
          <div class="sched-title-lg">${ev.title}</div>
          <div class="sched-sub-loc">${z.name} (${z.wing})</div>
        </div>
        <div class="sched-row-actions">
          <button class="row-btn-primary" data-walk-zone="${ev.zoneId}" data-ev-id="${ev.id}">WALK FOOTSTEPS</button>
          <button class="row-btn-secondary" data-detail-ev="${ev.id}">DETAILS</button>
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
  if (featured) updateRouteEverywhere(featured.zoneId);
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
  document.getElementById("passport-progress-label").textContent = `${count} / 4 COLLECTED`;

  const pGrid = document.getElementById("passport-grid");
  pGrid.innerHTML = passportZones.map(z => {
    const done = stampedZones.includes(z.id);
    return `
      <button class="pass-chip ${done ? "stamped" : ""}" data-zone="${z.id}">
        ${z.name}
      </button>
    `;
  }).join("");
  pGrid.querySelectorAll(".pass-chip").forEach(btn => {
    btn.addEventListener("click", () => openZoneInspector(btn.dataset.zone));
  });
}

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
renderFrameSelector();
updateBoothPreview();
renderCaptions();
renderMemoryWall();

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