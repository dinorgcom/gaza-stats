/* 3D-Alterspyramide, ein Balken pro Lebensjahr (0–90+).
   Männer rechts (blau), Frauen links (orange); Kombattanten-Szenario als dunkler Anteil im Männer-Balken. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function ready(fn) { window.SEXBYAGE ? fn() : document.addEventListener("pyr-data", fn, { once: true }); }

ready(() => {
  const host = document.getElementById("pyr3d");
  const cssv = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const COL_M = new THREE.Color(cssv("--m")), COL_F = new THREE.Color(cssv("--f"));
  const COL_C = new THREE.Color("#1c4a86");
  const DATA = window.SEXBYAGE;                 // [{age, m, f}] 0..90
  const n = DATA.length;
  const maxV = Math.max(...DATA.map(d => Math.max(d.m, d.f)));
  const UNIT = 4.8 / maxV;                      // laengster Balken ≈ 4.8 Einheiten
  const ROW = 0.14, BAR = 0.105, GAP = 0.18;
  const nf = new Intl.NumberFormat(window.NUMLOC || "de-DE");

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const mid = n * ROW / 2;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  camera.position.set(10, mid + 5, 13);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a19, 1.05));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(6, 14, 8); scene.add(dir);

  const unitBox = new THREE.BoxGeometry(1, BAR, BAR);
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.05 });
  const bars = [], combatMeshes = [];
  for (let i = 0; i < n; i++) {
    const d = DATA[i], y = i * ROW;
    // Frauen links
    const lf = Math.max(d.f * UNIT, 0.012);
    const mf = new THREE.Mesh(unitBox, mat(COL_F));
    mf.scale.x = lf; mf.position.set(-(GAP + lf / 2), y, 0);
    mf.userData = { age: d.age, sex: t("pyr.women"), v: d.f };
    scene.add(mf); bars.push(mf);
    // Maenner rechts: Zivil-Teil + Kombattanten-Overlay
    const lm = Math.max(d.m * UNIT, 0.012);
    const mm = new THREE.Mesh(unitBox, mat(COL_M));
    mm.scale.x = lm; mm.position.set(GAP + lm / 2, y, 0);
    mm.userData = { age: d.age, sex: t("pyr.men"), v: d.m, combat: 0, isMale: true };
    scene.add(mm); bars.push(mm);
    const mc = new THREE.Mesh(unitBox, mat(COL_C));
    mc.scale.x = 0.001; mc.visible = false; mc.position.set(GAP, y, 0);
    mc.userData = { age: d.age, sex: t("pyr.men"), v: d.m, isCombat: true, isMale: true };
    scene.add(mc); combatMeshes.push({ mesh: mc, base: mm });
  }

  // Kombattanten-Szenario: n Kaempfer proportional auf maennliche Tote 16–59 verteilen
  document.addEventListener("combat-scenario", ev => {
    const N = ev.detail.n;
    const pool = DATA.filter(d => d.age >= 16 && d.age <= 59).reduce((s, d) => s + d.m, 0);
    for (const { mesh, base } of combatMeshes) {
      const d = DATA[base.userData.age];
      const c = (N && d.age >= 16 && d.age <= 59) ? N * d.m / pool : 0;
      base.userData.combat = Math.round(c);
      const lm = Math.max(d.m * UNIT, 0.012), lc = c * UNIT;
      if (lc > 0.004) {
        mesh.visible = true;
        mesh.scale.x = lc;
        mesh.position.x = GAP + (lm - lc) + lc / 2;   // aeusseres Ende des Maenner-Balkens
        mesh.position.y = base.position.y;
      } else mesh.visible = false;
    }
  });

  // Ticks am Boden (500er-Schritte) + Alters-Sprites alle 10 Jahre
  const tickMat = new THREE.LineBasicMaterial({ color: new THREE.Color(cssv("--axis")) });
  for (let t = 500; t <= Math.ceil(maxV / 500) * 500; t += 500) {
    [1, -1].forEach(sgn => {
      const X = sgn * (GAP + t * UNIT);
      const geo = new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(X, -ROW * 3, -0.55), new THREE.Vector3(X, -ROW * 3, 0.55)]);
      scene.add(new THREE.Line(geo, tickMat));
      scene.add(sprite(nf.format(t), X, -ROW * 8, 0, 0.8, cssv("--muted")));
    });
  }
  for (let a = 0; a <= 90; a += 10)
    scene.add(sprite(a === 90 ? "90+" : String(a), 0, a * ROW + 0.01, 0.62, 0.85, cssv("--ink-2")));
  scene.add(sprite(t("pyr.axis.age"), 0, n * ROW + 0.7, 0, 0.95, cssv("--muted")));
  scene.add(sprite(t("pyr.axis.per"), 0, -ROW * 13, 0, 0.85, cssv("--muted")));

  function sprite(text, x, y, z, s, color) {
    const c = document.createElement("canvas"); c.width = 256; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.font = "600 34px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = color || "#c3c2b7"; ctx.fillText(text, 128, 34);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
    sp.scale.set(2.6 * s, 0.65 * s, 1); sp.position.set(x, y, z);
    return sp;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, mid, 0);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.minDistance = 5; controls.maxDistance = 34;
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.7;
  renderer.domElement.addEventListener("pointerdown", () => { controls.autoRotate = false; }, { once: true });
  if (matchMedia("(pointer: coarse)").matches) {
    controls.touches.ONE = null;                      // ein Finger scrollt die Seite weiter
    controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;  // zwei Finger drehen + zoomen
  }

  // Hover-Tooltip
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let hovered = null;
  const hoverables = () => bars.concat(combatMeshes.filter(c => c.mesh.visible).map(c => c.mesh));
  renderer.domElement.addEventListener("mousemove", ev => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(hoverables())[0];
    if (hovered && hovered !== (hit && hit.object)) { hovered.material.emissive.setHex(0); hovered = null; }
    if (hit) {
      if (hovered !== hit.object) { hovered = hit.object; hovered.material.emissive.setHex(0x2c2c2c); }
      const u = hovered.userData;
      const base = u.isCombat ? combatMeshes.find(c => c.mesh === hovered).base : hovered;
      const combat = base.userData.combat || 0;
      const age = u.age === 90 ? "90+" : u.age;
      window.__tip.showTip(`<div class="tt-h">${t("pyr.axis.age")} ${age} · ${u.sex}</div><b>${nf.format(u.v)}</b> ${t("pyr.tip.killed")}` +
        (u.isMale && combat ? `<br><span class="tt-h">${t("pyr.tip.combat", nf.format(combat))}</span>` : ""),
        ev.clientX, ev.clientY);
      renderer.domElement.style.cursor = "pointer";
    } else { window.__tip.hideTip(); renderer.domElement.style.cursor = "grab"; }
  });
  renderer.domElement.addEventListener("mouseleave", () => {
    if (hovered) { hovered.material.emissive.setHex(0); hovered = null; }
    window.__tip.hideTip();
  });

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  addEventListener("resize", resize);
  resize();
  // Fallback: RAF/ResizeObserver pausieren bei verstecktem Panel — Interval heilt nach, dann Selbstabschaltung
  const heal = setInterval(() => {
    if (host.clientWidth && Math.abs(renderer.domElement.clientWidth - host.clientWidth) > 1) {
      resize(); renderer.render(scene, camera);
    } else if (host.clientWidth) clearInterval(heal);
  }, 500);

  renderer.setAnimationLoop(() => {
    if (host.clientWidth && Math.abs(renderer.domElement.clientWidth - host.clientWidth) > 1) resize();
    controls.update(); renderer.render(scene, camera);
  });

  // Tabellen-Zwilling (5-Jahres-Gruppen aus pyramid.json)
  const P = window.PYR;
  document.getElementById("pyrTable").innerHTML =
    `<table><thead><tr><th>${t("pyr.axis.age")}</th><th>${t("pyr.men")}</th><th>${t("pyr.women")}</th><th>${t("pyr.col.total")}</th></tr></thead><tbody>` +
    P.labels.map((l, i) => `<tr><td>${l}</td><td>${nf.format(P.m[i])}</td><td>${nf.format(P.f[i])}</td>
      <td>${nf.format(P.m[i] + P.f[i])}</td></tr>`).join("") + "</tbody></table>";
});
