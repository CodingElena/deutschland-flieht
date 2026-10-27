const FORTZUEGE_2025 = 288579; // Destatis GENESIS 12711-0005: Fortzüge deutscher Staatsangehöriger 2025
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const svgNS = 'http://www.w3.org/2000/svg';

function setupBloodSeam() {
  const hero = document.querySelector('.hero');
  const section = document.querySelector('.emigration');
  const liquidCanvas = document.querySelector('.hero__blood');
  const dripCanvas = document.querySelector('.emigration__bleed');
  if (!hero || !section || !liquidCanvas || !dripCanvas) return;

  /* Blut als Shader (WebGL): Meniskus mit Normalen, Glanz, Fresnel, Spiegelung, Tiefenfärbung, Fließstreifen.
     Tropfen als weich verschmolzene Formen (Hals, Birne, Faden) mit echter Lichtbrechung-Optik.
     Ohne WebGL fällt alles auf die glatte 2D-Zeichnung zurück. */
  const probe = document.createElement('canvas');
  const glOk = !!(probe.getContext('webgl') || probe.getContext('experimental-webgl'));
  let dropsCanvas = null;
  let gl = null;
  let gd = null;
  let liquid = null;
  if (glOk) {
    dropsCanvas = document.createElement('canvas');
    dropsCanvas.className = 'emigration__drops';
    dropsCanvas.setAttribute('aria-hidden', 'true');
    dripCanvas.after(dropsCanvas);
    const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
    gl = liquidCanvas.getContext('webgl', opts);
    gd = dropsCanvas.getContext('webgl', opts);
  }
  const useGL = !!(gl && gd);
  if (!useGL) {
    if (dropsCanvas) dropsCanvas.remove();
    liquid = liquidCanvas.getContext('2d', { alpha: true });
    if (!liquid) return;
  }
  const drip = dripCanvas.getContext('2d', { alpha: true });
  if (!drip) return;

  let width = 0;
  let depth = 0;
  let dpr = 1;
  let elapsed = 0;
  let lastFrame = 0;
  let lastDraw = 0;
  let frame = 0;
  let visible = false;
  let seal = 0;
  const drops = [];
  const pend = { state: 'wait', age: 0, wait: 0.2, R: 7, snap: 0, tipY: 0 };
  const sin = Math.sin;

  /* ---------------------------------------------------------------- WebGL ---- */
  const NOISE = `
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
  `;
  const HEAD = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
  `;
  const VS = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

  /* Becken: Oberfläche = zähe Wellen, Kante = gerundeter Wulst, darunter Tiefe */
  const FS_POOL = HEAD + NOISE + `
    uniform vec2 uRes; uniform float uDpr; uniform float uT; uniform float uDrain; uniform float uDepth;
    float surf(float x){ return 22.0 + uDrain + 2.2 * sin(x * 0.021 + uT * 0.9) + 1.1 * sin(x * 0.057 - uT * 1.4) + 0.5 * sin(x * 0.13 + uT * 2.1); }
    float dsurf(float x){ return 0.0462 * cos(x * 0.021 + uT * 0.9) + 0.0627 * cos(x * 0.057 - uT * 1.4) + 0.065 * cos(x * 0.13 + uT * 2.1); }
    void main(){
      vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
      float ds = p.y - surf(p.x);
      float slope = uDepth / uRes.x;
      float dc = (60.0 + slope * p.x - p.y) / sqrt(1.0 + slope * slope);
      float aa = 1.0 / uDpr;
      float cover = smoothstep(-aa, aa, ds) * smoothstep(-aa, aa, dc);
      if (cover < 0.002) { gl_FragColor = vec4(0.0); return; }
      float u = clamp(1.0 - ds / 8.0, 0.0, 1.0);
      vec3 n = vec3(dsurf(p.x) * u * 1.3, -u, sqrt(max(1.0 - u * u, 0.0)));
      float n1 = fbm(p * vec2(0.03, 0.05) + vec2(uT * 0.03, uT * 0.05));
      float n2 = fbm(p * vec2(0.03, 0.05) + vec2(5.2 + uT * 0.03, 1.3 + uT * 0.05));
      n.xy += (vec2(n1, n2) - 0.5) * 0.2;
      n = normalize(n);
      vec3 L = normalize(vec3(-0.4, -0.65, 0.65));
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 Hh = normalize(L + V);
      float nh = max(dot(n, Hh), 0.0);
      float diff = max(dot(n, L), 0.0);
      float spec = pow(nh, 110.0) * 1.5 + pow(nh, 22.0) * 0.22;
      float fres = 0.05 + 0.95 * pow(1.0 - max(n.z, 0.0), 4.0);
      vec3 Rv = reflect(-V, n);
      float win = smoothstep(0.17, 0.0, abs(Rv.x + 0.25 + 0.12 * sin(uT * 0.25))) * smoothstep(-0.1, -0.6, Rv.y);
      vec3 env = vec3(0.10, 0.02, 0.02) + vec3(1.0, 0.85, 0.8) * win * 0.85 + vec3(0.5, 0.2, 0.18) * smoothstep(0.0, -1.0, Rv.y) * 0.25;
      vec3 base = mix(vec3(0.70, 0.03, 0.055), vec3(0.15, 0.0, 0.015), 1.0 - exp(-ds / 28.0));
      float streak = noise(vec2(p.x * 0.11, p.y * 0.012 - uT * 0.04));
      base *= 0.9 + 0.16 * streak;
      base *= 0.9 + 0.2 * fbm(p * 0.02 + uT * 0.01);
      base *= 0.5 + 0.5 * smoothstep(0.0, 26.0, dc);
      vec3 rim = vec3(0.95, 0.15, 0.07) * pow(u, 2.5) * 0.5;
      vec3 col = base * (0.45 + 0.75 * diff) + rim + env * fres * 0.9 + vec3(1.0, 0.9, 0.85) * spec;
      col = clamp(col, 0.0, 1.0);
      gl_FragColor = vec4(col * cover, cover);
    }
  `;

  /* Tropfen: verschmolzene Distanzfelder, Beleuchtung aus dem Abstand zum Rand */
  const FS_DROPS = HEAD + `
    uniform vec2 uRes; uniform float uDpr; uniform vec2 uHole; uniform float uHw;
    uniform vec4 uP; uniform vec4 uD[3]; uniform vec2 uTh; uniform float uA; uniform float uT;
    float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
    float circ(vec2 p, vec2 c, float r){ return length(p - c) - r; }
    float ell(vec2 p, vec2 c, vec2 r){ return (length((p - c) / r) - 1.0) * min(r.x, r.y); }
    float seg(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
    float pendant(vec2 p){
      float d = 1e5;
      float r = uP.x; float len = uP.y;
      for (int i = 0; i < 8; i++) {
        float t = float(i) / 7.0;
        d = smin(d, circ(p, vec2(uHole.x, uHole.y - 1.0 + len * t), mix(uHw * 0.55, r, pow(t, 2.2))), r * 0.9 + 0.5);
      }
      return d;
    }
    float falling(vec2 p, vec4 q, out float rr){
      rr = q.z;
      if (q.z < 0.1) return 1e5;
      float s = clamp(q.w / 520.0, 0.0, 0.7);
      float body = ell(p, vec2(q.x, q.y), vec2(q.z * (1.0 - 0.1 * s), q.z * (1.0 + 0.55 * s)));
      float tail = circ(p, vec2(q.x, q.y - q.z * (1.0 + 0.55 * s) * 1.45 - s * q.z), q.z * 0.28);
      return smin(body, tail, q.z * 0.8);
    }
    float map(vec2 p, out float rr){
      float d = 1e5; rr = 1.0;
      if (uP.z > 0.5) { d = pendant(p); rr = uP.x; }
      if (uTh.y > 0.01) d = smin(d, seg(p, uHole, vec2(uHole.x, uTh.x), 0.75 * uTh.y + 0.2), 2.0);
      for (int i = 0; i < 3; i++) { float r; float f = falling(p, uD[i], r); if (f < d) { d = f; rr = max(rr, r); } }
      return d;
    }
    float caustic(vec2 p, vec2 c, float r){ vec2 q = (p - c - vec2(0.28, 0.32) * r) / r; return exp(-dot(q, q) * 5.0); }
    void main(){
      vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
      if (abs(p.x - uHole.x) > 46.0) { gl_FragColor = vec4(0.0); return; }
      float rr; float d = map(p, rr);
      if (d > 2.5) { gl_FragColor = vec4(0.0); return; }
      float cover = clamp(0.5 - d * uDpr, 0.0, 1.0);
      float e = 0.6;
      float r2;
      vec2 g = vec2(map(p + vec2(e, 0.0), r2) - map(p - vec2(e, 0.0), r2), map(p + vec2(0.0, e), r2) - map(p - vec2(0.0, e), r2));
      g = length(g) > 1e-4 ? normalize(g) : vec2(0.0, 1.0);
      float u = 1.0 - clamp(-d / max(rr, 1.0), 0.0, 1.0);
      vec3 n = normalize(vec3(g * u * 1.05, sqrt(max(1.0 - u * u, 0.03))));
      vec3 L = normalize(vec3(-0.45, -0.6, 0.65));
      vec3 V = vec3(0.0, 0.0, 1.0);
      vec3 Hh = normalize(L + V);
      float nh = max(dot(n, Hh), 0.0);
      float diff = max(dot(n, L), 0.0);
      float spec = pow(nh, 140.0) * 1.7 + pow(nh, 26.0) * 0.28;
      float fres = 0.05 + 0.95 * pow(1.0 - max(n.z, 0.0), 4.0);
      vec3 Rv = reflect(-V, n);
      float win = smoothstep(0.2, 0.0, abs(Rv.x + 0.3)) * smoothstep(-0.05, -0.55, Rv.y);
      vec3 env = vec3(0.08, 0.01, 0.01) + vec3(1.0, 0.88, 0.82) * win * 0.9;
      vec3 base = mix(vec3(0.74, 0.04, 0.07), vec3(0.17, 0.0, 0.02), pow(u, 1.6));
      float back = pow(u, 3.0) * max(dot(-g, normalize(vec2(-0.45, -0.6))), 0.0);
      vec3 col = base * (0.5 + 0.7 * diff) + vec3(0.95, 0.14, 0.08) * back * 0.7 + env * fres * 0.95 + vec3(1.0, 0.92, 0.88) * spec;
      float c = 0.0;
      if (uP.z > 0.5) c += caustic(p, vec2(uHole.x, uHole.y + uP.y), uP.x);
      for (int i = 0; i < 3; i++) if (uD[i].z > 0.1) c += caustic(p, uD[i].xy, uD[i].z);
      col += vec3(0.95, 0.16, 0.1) * c * 0.45 * (1.0 - u * u);
      col = clamp(col, 0.0, 1.0);
      float a = cover * uA;
      gl_FragColor = vec4(col * a, a);
    }
  `;

  function makeProgram(ctx, fsSrc) {
    const sh = (type, src) => {
      const s = ctx.createShader(type);
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error(ctx.getShaderInfoLog(s) || 'shader');
      return s;
    };
    const prog = ctx.createProgram();
    ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, VS));
    ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, fsSrc));
    ctx.linkProgram(prog);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) throw new Error('link');
    ctx.useProgram(prog);
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, 'a');
    ctx.enableVertexAttribArray(loc);
    ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
    ctx.enable(ctx.BLEND);
    ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA);
    return prog;
  }
  let poolProg = null;
  let dropProg = null;
  let U = {};
  let glBroken = false;
  if (useGL) {
    try {
      poolProg = makeProgram(gl, FS_POOL);
      U.pool = {};
      for (const k of ['uRes', 'uDpr', 'uT', 'uDrain', 'uDepth']) U.pool[k] = gl.getUniformLocation(poolProg, k);
      dropProg = makeProgram(gd, FS_DROPS);
      U.drop = {};
      for (const k of ['uRes', 'uDpr', 'uHole', 'uHw', 'uP', 'uD', 'uTh', 'uA', 'uT']) U.drop[k] = gd.getUniformLocation(dropProg, k);
    } catch (err) {
      console.warn('blut-shader', err.message);
      glBroken = true;
    }
    if (glBroken) {
      /* Shader nicht übersetzbar: GL-Ebenen verwerfen, die Canvas-Elemente sind aber schon GL-belegt, also einfach ausblenden */
      liquidCanvas.style.display = 'none';
      dropsCanvas.style.display = 'none';
    }
  }
  const glActive = useGL && !glBroken;

  function sizeCanvas() {
    width = Math.round(hero.getBoundingClientRect().width);
    /* Tiefe der Schnittkante = negativer Außenabstand der Karte; unabhängig vom Scroll (der Hero ist sticky) */
    const seam = -parseFloat(getComputedStyle(section).marginTop);
    depth = Number.isFinite(seam) && seam > 0 ? seam : hero.getBoundingClientRect().bottom - section.getBoundingClientRect().top;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    liquidCanvas.width = Math.ceil(width * dpr);
    liquidCanvas.height = Math.ceil((depth + 60) * dpr);
    dripCanvas.width = Math.ceil(width * dpr);
    dripCanvas.height = Math.ceil((depth + 150) * dpr);
    drip.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (useGL) {
      dropsCanvas.width = Math.ceil(width * dpr);
      dropsCanvas.height = Math.ceil((depth + 150) * dpr);
      gl.viewport(0, 0, liquidCanvas.width, liquidCanvas.height);
      gd.viewport(0, 0, dropsCanvas.width, dropsCanvas.height);
    } else liquid.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (glActive) drawLine();
    draw();
  }

  const cutY = (x) => 60 + (depth * x) / width; /* Schnittkante in den Koordinaten der Hero-Ebene */
  const drained = (t) => (width < 761 ? 0 : Math.min(1, t / 11) * Math.min(depth * 0.82, 100));
  function surface(x, t) {
    return 22 + drained(t) + 2.2 * sin(x * 0.021 + t * 0.9) + 1.1 * sin(x * 0.057 - t * 1.4) + 0.5 * sin(x * 0.13 + t * 2.1);
  }

  /* ------------------------------------------------ 2D-Rückfall (ohne WebGL) ---- */
  function drawLiquid2D(t) {
    const H = depth + 60;
    liquid.clearRect(0, 0, width, H);
    const pts = [];
    for (let x = 0; x <= width + 3; x += 3) {
      const xx = Math.min(x, width);
      pts.push([xx, Math.min(surface(xx, t), cutY(xx))]);
    }
    liquid.save();
    liquid.beginPath();
    liquid.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) liquid.lineTo(p[0], p[1]);
    liquid.lineTo(width, cutY(width));
    liquid.lineTo(0, cutY(0));
    liquid.closePath();
    const g = liquid.createLinearGradient(0, 14, 0, H);
    g.addColorStop(0, '#c9141f');
    g.addColorStop(0.25, '#9c0b16');
    g.addColorStop(0.62, '#68060f');
    g.addColorStop(1, '#3b0209');
    liquid.fillStyle = g;
    liquid.fill();
    liquid.clip();
    liquid.lineCap = 'butt';
    for (const [w, a] of [[40, 0.14], [24, 0.2], [11, 0.3]]) {
      liquid.strokeStyle = 'rgba(14,0,2,' + a + ')';
      liquid.lineWidth = w;
      liquid.beginPath();
      liquid.moveTo(0, cutY(0));
      liquid.lineTo(width, cutY(width));
      liquid.stroke();
    }
    const edge = (dy, w, color) => {
      liquid.strokeStyle = color;
      liquid.lineWidth = w;
      liquid.beginPath();
      let on = false;
      for (const p of pts) {
        if (cutY(p[0]) - p[1] < 3) {
          on = false;
          continue;
        }
        if (!on) liquid.moveTo(p[0], p[1] + dy);
        else liquid.lineTo(p[0], p[1] + dy);
        on = true;
      }
      liquid.stroke();
    };
    edge(1.6, 3, 'rgba(255,100,100,0.26)');
    edge(0.6, 1.2, 'rgba(255,215,210,0.62)');
    liquid.restore();
  }
  function teardrop(ctx, x, top, topHalf, cy, r) {
    const len = cy - top;
    ctx.beginPath();
    ctx.moveTo(x - topHalf, top);
    ctx.bezierCurveTo(x - topHalf, top + len * 0.5, x - r, cy - r * 1.7, x - r, cy);
    ctx.arc(x, cy, r, Math.PI, 0, true);
    ctx.bezierCurveTo(x + r, cy - r * 1.7, x + topHalf, top + len * 0.5, x + topHalf, top);
    ctx.closePath();
  }
  function paintBlob(ctx, x, top, topHalf, cy, r, alpha) {
    if (r < 0.4 || alpha <= 0.01) return;
    ctx.globalAlpha = alpha;
    teardrop(ctx, x, top, topHalf, cy, r);
    const rg = ctx.createRadialGradient(x - r * 0.3, cy - r * 0.35, r * 0.1, x, cy, r * 1.25);
    rg.addColorStop(0, '#e8303c');
    rg.addColorStop(0.5, '#a50b16');
    rg.addColorStop(1, '#520409');
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,225,220,0.62)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.38, cy - r * 0.32, r * 0.2, r * 0.34, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function drawDrops2D() {
    const holeX = width * 0.69;
    const holeY = depth * 0.69;
    const hw = (width < 761 ? 4.5 : 6.5) * (1 - seal);
    const a = 1 - seal;
    if (pend.state === 'grow') {
      const k = Math.min(1, pend.age / 1.6);
      const r = pend.R * Math.pow(k, 0.8);
      const len = 4 + r * 1.9 + Math.pow(k, 3) * pend.R * 1.6;
      paintBlob(drip, holeX, holeY - 1, Math.max(0.8, hw * 0.55), holeY + len, r, a);
    }
    for (const d of drops) {
      const fade = Math.min(1, Math.max(0, (holeY + 145 - d.y) / 35));
      const h = d.r * 2.2 * (1 + Math.min(0.7, d.vy / 520));
      paintBlob(drip, d.x, d.y - h, 0.5, d.y, d.r, fade * a);
    }
  }

  /* --------------------------------------------------------- gemeinsame Teile ---- */
  /* Schnittkante (2D, ändert sich nur bei Größe und Verschluss) */
  function drawLine() {
    drip.clearRect(0, 0, width, depth + 150);
    const holeX = width * 0.69;
    const hw = (width < 761 ? 4.5 : 6.5) * (1 - seal);
    drip.lineCap = 'butt';
    for (const [color, w] of [['#4a0309', 5], ['#c91826', 2.2], ['rgba(255,170,165,0.4)', 0.8]]) {
      drip.strokeStyle = color;
      drip.lineWidth = w;
      drip.beginPath();
      drip.moveTo(0, 0);
      if (hw > 0.4) {
        drip.lineTo(holeX - hw, (depth * (holeX - hw)) / width);
        drip.moveTo(holeX + hw, (depth * (holeX + hw)) / width);
      }
      drip.lineTo(width, depth);
      drip.stroke();
    }
  }

  function drawGL() {
    const holeX = width * 0.69;
    const holeY = depth * 0.69;
    const hw = (width < 761 ? 4.5 : 6.5) * (1 - seal);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.pool.uRes, width, depth + 60);
    gl.uniform1f(U.pool.uDpr, dpr);
    gl.uniform1f(U.pool.uT, elapsed);
    gl.uniform1f(U.pool.uDrain, drained(elapsed));
    gl.uniform1f(U.pool.uDepth, depth);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gd.clearColor(0, 0, 0, 0);
    gd.clear(gd.COLOR_BUFFER_BIT);
    const still = reduceMotion.matches;
    let pr = 0;
    let plen = 0;
    let pact = 0;
    if (!still && pend.state === 'grow') {
      const k = Math.min(1, pend.age / 1.6);
      pr = pend.R * Math.pow(k, 0.8);
      plen = 4 + pr * 1.9 + Math.pow(k, 3) * pend.R * 1.6;
      pact = 1;
    }
    const dv = new Float32Array(12);
    if (!still) {
      drops.slice(0, 3).forEach((d, i) => {
        const fade = Math.min(1, Math.max(0, (holeY + 145 - d.y) / 35));
        const h = d.r * 2.2 * (1 + Math.min(0.7, d.vy / 520));
        dv[i * 4] = d.x;
        dv[i * 4 + 1] = d.y - h * 0.5;
        dv[i * 4 + 2] = d.r * fade;
        dv[i * 4 + 3] = d.vy;
      });
    }
    const th = !still && pend.state === 'snap' ? 1 - pend.snap / 0.4 : 0;
    gd.uniform2f(U.drop.uRes, width, depth + 150);
    gd.uniform1f(U.drop.uDpr, dpr);
    gd.uniform2f(U.drop.uHole, holeX, holeY);
    gd.uniform1f(U.drop.uHw, Math.max(hw, 0.6));
    gd.uniform4f(U.drop.uP, pr, plen, pact, 0);
    gd.uniform4fv(U.drop.uD, dv);
    gd.uniform2f(U.drop.uTh, pend.tipY, th);
    gd.uniform1f(U.drop.uA, 1 - seal);
    gd.uniform1f(U.drop.uT, elapsed);
    gd.drawArrays(gd.TRIANGLES, 0, 3);
  }

  function draw() {
    if (!width) return;
    if (glActive) drawGL();
    else if (!useGL) {
      drawLiquid2D(elapsed);
      drawLine();
      if (!reduceMotion.matches) drawDrops2D();
    }
  }

  function advance(delta) {
    elapsed += delta;
    const holeY = depth * 0.69;
    if (pend.state === 'wait') {
      pend.wait -= delta;
      if (pend.wait <= 0 && seal < 0.15) {
        pend.state = 'grow';
        pend.age = 0;
        pend.R = (width < 761 ? 5 : 9) * (0.85 + Math.random() * 0.3);
      }
    } else if (pend.state === 'grow') {
      pend.age += delta;
      if (pend.age >= 1.6) {
        const r = pend.R;
        const y = holeY + 4 + r * 1.9 + pend.R * 1.6;
        drops.push({ x: width * 0.69 + (Math.random() - 0.5) * 1.2, y, r, vy: 30 });
        pend.state = 'snap';
        pend.snap = 0;
        pend.tipY = y - r * 2;
      }
    } else if (pend.state === 'snap') {
      pend.snap += delta;
      pend.tipY = Math.max(holeY, pend.tipY - delta * 120);
      if (pend.snap >= 0.4) {
        pend.state = 'wait';
        pend.wait = 0.25 + Math.random() * 0.5;
      }
    }
    for (const d of drops) {
      d.vy += 520 * delta;
      d.y += d.vy * delta;
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      if (drops[i].y > depth * 0.69 + 150) drops.splice(i, 1);
    }
  }

  function tick(now) {
    frame = 0;
    if (!visible || document.hidden || reduceMotion.matches) return;
    if (!lastFrame) lastFrame = now;
    const delta = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    advance(delta);
    if (now - lastDraw >= (width < 761 ? 22 : 12)) {
      draw();
      lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const nearSeam = window.scrollY < hero.offsetHeight * 1.1;
    if (visible && nearSeam && seal < 1 && !document.hidden && !reduceMotion.matches && !frame) {
      lastFrame = 0;
      frame = requestAnimationFrame(tick);
    } else if ((!visible || !nearSeam || seal >= 1 || document.hidden || reduceMotion.matches) && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
    }
  }

  if (useGL) {
    for (const c of [liquidCanvas, dropsCanvas]) {
      c.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        c.style.display = 'none';
      });
    }
  }
  new ResizeObserver(sizeCanvas).observe(hero);
  window.addEventListener('load', sizeCanvas);
  window.addEventListener('resize', sizeCanvas, { passive: true });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: '120px' }).observe(hero);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('scroll', sync, { passive: true });
  hero.addEventListener('slideprogress', (event) => {
    const progress = Math.min(1, Math.max(0, (event.detail - 0.08) / 0.52));
    seal = progress * progress * (3 - 2 * progress);
    liquidCanvas.style.opacity = String(1 - seal);
    if (glActive) drawLine();
    draw();
    sync();
  });
  reduceMotion.addEventListener('change', sync);
  elapsed = reduceMotion.matches ? 3 : 0;
  sizeCanvas();
}

function setupPixelGrain(selector) {
  const canvas = document.querySelector(selector);
  if (!canvas) return;
  const section = canvas.parentElement;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;

  // The reference uses three high-contrast noise frames at 10 fps and 10% opacity.
  // Generate equivalent frames in Canvas so the site needs no GIF or texture image.
  const patterns = Array.from({ length: 3 }, (_, frame) => {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 512;
    const tileContext = tile.getContext('2d', { alpha: false });
    const image = tileContext.createImageData(512, 512);
    let seed = (0x5f3759df + frame * 0x9e3779b9) >>> 0;
    for (let offset = 0; offset < image.data.length; offset += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const sample = seed / 4294967296;
      const shade = sample < .23 ? 0 : sample < .38 ? 80 : sample < .55 ? 170 : 255;
      image.data[offset] = shade;
      image.data[offset + 1] = shade;
      image.data[offset + 2] = shade;
      image.data[offset + 3] = 255;
    }
    tileContext.putImageData(image, 0, 0);
    return context.createPattern(tile, 'repeat');
  });

  let frameIndex = 0;
  let timer = 0;
  let visible = false;
  function draw() {
    context.fillStyle = patterns[frameIndex];
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  function resize() {
    const width = Math.ceil(section.clientWidth);
    const height = Math.ceil(section.clientHeight);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    draw();
  }
  function syncPlayback() {
    const shouldPlay = visible && !document.hidden && !reduceMotion.matches;
    if (shouldPlay && !timer) {
      timer = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % patterns.length;
        draw();
      }, 100);
    } else if (!shouldPlay && timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  }

  new ResizeObserver(resize).observe(section);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(section);
  document.addEventListener('visibilitychange', syncPlayback);
  reduceMotion.addEventListener('change', syncPlayback);
  resize();
}

function setupBleed(stage, statePaths, destinationValues, format) {
  // Same six-second visibility-triggered sequence and per-state intervals as the original page.
  const duration = 6000;
  let elapsed = 0;
  let previousFrame = 0;
  let frame = 0;
  let visible = false;

  function render(progress) {
    for (const { path, state } of statePaths) {
      const fade = Math.max(0, Math.min(1, (progress - state.bleedFrom) / (state.bleedTo - state.bleedFrom)));
      path.style.fillOpacity = String(reduceMotion.matches ? .08 : .92 * (1 - fade));
    }
    const countProgress = .5 - .5 * Math.cos(Math.PI * progress);
    for (const { value, total } of destinationValues) {
      value.textContent = format.format(Math.round(total * countProgress));
    }
  }

  function stop() {
    visible = false;
    previousFrame = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function tick(timestamp) {
    frame = 0;
    if (!visible) return;
    if (previousFrame) elapsed += timestamp - previousFrame;
    previousFrame = timestamp;
    const progress = Math.min(1, elapsed / duration);
    render(progress);
    if (progress < 1) frame = requestAnimationFrame(tick);
    else visible = false;
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && entry.intersectionRatio >= .45 && !reduceMotion.matches && elapsed < duration && !document.hidden) {
      if (!visible) {
        visible = true;
        previousFrame = 0;
        frame = requestAnimationFrame(tick);
      }
    } else stop();
  }, { threshold: [0, .45, .7] });

  render(reduceMotion.matches ? 1 : 0);
  observer.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (stage.getBoundingClientRect().height * .45 <= Math.min(stage.getBoundingClientRect().bottom, innerHeight) - Math.max(stage.getBoundingClientRect().top, 0) && elapsed < duration) {
      visible = true;
      frame = requestAnimationFrame(tick);
    }
  });
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      stop();
      render(1);
    } else render(Math.min(1, elapsed / duration));
  });
}

function svgElement(tag, attributes = {}) {
  const element = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}

function setupMenu() {
  const button = document.getElementById('menu-toggle');
  const panel = document.getElementById('site-menu');
  let closeTimer;
  function setOpen(open) {
    clearTimeout(closeTimer);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    panel.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(() => panel.classList.add('is-open'));
      panel.querySelector('a')?.focus({ preventScroll: true });
    } else {
      panel.classList.remove('is-open');
      closeTimer = setTimeout(() => { panel.hidden = true; }, 320);
    }
  }
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  panel.addEventListener('click', (event) => {
    if (event.target === panel || event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      button.focus({ preventScroll: true });
    }
  });
}

function setupCounter() {
  const container = document.getElementById('flip-counter');
  if (!container) return;
  const digits = [];
  let displayed = -1;
  let introTimer = 0;
  let introRunning = false;

  function makeDigit(value) {
    const card = document.createElement('span');
    card.className = 'ticker-digit';
    card.setAttribute('aria-hidden', 'true');
    const oldFace = document.createElement('span');
    oldFace.className = 'ticker-digit__old';
    const newFace = document.createElement('span');
    newFace.className = 'ticker-digit__new';
    oldFace.textContent = newFace.textContent = value;
    card.append(oldFace, newFace);
    card.addEventListener('animationend', (event) => {
      if (event.target !== newFace) return;
      oldFace.textContent = newFace.textContent;
      card.classList.remove('is-flipping');
    });
    return { card, oldFace, newFace };
  }

  function render(number, animate = false) {
    const characters = String(number).padStart(6, '0').replace(/(\d{3})(\d{3})$/, '$1.$2');
    if (digits.length !== characters.length) {
      container.replaceChildren();
      digits.length = 0;
      for (const character of characters) {
        if (character === '.') {
          const separator = document.createElement('span');
          separator.className = 'ticker-separator';
          separator.textContent = '.';
          separator.setAttribute('aria-hidden', 'true');
          container.append(separator);
          digits.push(null);
        } else {
          const digit = makeDigit(character);
          container.append(digit.card);
          digits.push(digit);
        }
      }
    } else {
      [...characters].forEach((character, index) => {
        const digit = digits[index];
        if (!digit || digit.newFace.textContent === character) return;
        digit.card.classList.remove('is-flipping');
        digit.oldFace.textContent = digit.newFace.textContent;
        digit.newFace.textContent = character;
        if (animate && !reduceMotion.matches) {
          void digit.card.offsetWidth;
          digit.card.classList.add('is-flipping');
        } else digit.oldFace.textContent = character;
      });
    }
    container.setAttribute('aria-label', `${number.toLocaleString('de-DE')} Fortzüge deutscher Staatsangehöriger im Jahr 2025.`);
    displayed = number;
  }

  function showFinal() {
    clearTimeout(introTimer);
    introRunning = false;
    container.classList.remove('is-counting');
    render(FORTZUEGE_2025);
  }

  function startCountUp() {
    if (reduceMotion.matches || document.hidden) {
      render(FORTZUEGE_2025);
      return;
    }
    const steps = 12;
    let step = 0;
    introRunning = true;
    container.classList.add('is-counting');
    render(0);

    function advance() {
      if (!introRunning) return;
      step += 1;
      const eased = 1 - (1 - step / steps) ** 2.5;
      render(step === steps ? FORTZUEGE_2025 : Math.min(FORTZUEGE_2025 - 1, Math.floor(FORTZUEGE_2025 * eased)), true);
      if (step < steps) introTimer = setTimeout(advance, 90);
      else introTimer = setTimeout(() => {
        introRunning = false;
        container.classList.remove('is-counting');
      }, 90);
    }
    introTimer = setTimeout(advance, 70);
  }

  startCountUp();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && introRunning) showFinal();
  });
}

function setupReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.13 });
  elements.forEach((element) => observer.observe(element));
}

async function setupMap() {
  const stage = document.getElementById('germany-map');
  try {
    const response = await fetch('./map-data.json?v=original-bleed-2', { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Map data: ${response.status}`);
    const { states, destinations } = await response.json();
    const svg = svgElement('svg', {
      class: 'map-svg', viewBox: '-80 0 860 860', role: 'group',
      'aria-label': 'Deutschlandkarte mit Bundesländern; Pfeile zeigen in die USA, nach Spanien, in die Schweiz und nach Österreich.',
    });
    const title = svgElement('title');
    title.textContent = 'Fortzüge aus Deutschland 2025';
    svg.append(title);
    const defs = svgElement('defs');
    const marker = svgElement('marker', { id: 'arrowhead', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: 'auto' });
    marker.append(svgElement('path', { d: 'M0 1 L9 5 L0 9 Z', fill: '#e6e6e8' }));
    const desktopMarker = svgElement('marker', { id: 'arrowhead-desktop', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' });
    desktopMarker.append(svgElement('path', { d: 'M1 1 L8 5 L1 9', fill: 'none', stroke: '#f4f4f4', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    defs.append(marker, desktopMarker);
    svg.append(defs);
    const stateGroup = svgElement('g', { 'fill-rule': 'evenodd', class: 'map-states' });
    const statePaths = [];
    const tooltip = document.createElement('div');
    tooltip.className = 'map-tooltip';
    tooltip.hidden = true;
    tooltip.setAttribute('role', 'status');
    const format = new Intl.NumberFormat('de-DE');

    function showTooltip(state, clientX, clientY) {
      const rect = stage.getBoundingClientRect();
      const x = Math.min(Math.max(8, clientX - rect.left + 14), Math.max(8, rect.width - 226));
      const y = Math.max(8, clientY - rect.top - 100);
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.replaceChildren();
      const heading = document.createElement('strong');
      heading.textContent = state.name;
      const detail = document.createElement('span');
      const count = document.createElement('b');
      count.textContent = format.format(state.fortzuege);
      detail.append(count, ' Fortzüge ins Ausland 2025, alle Staatsangehörigkeiten');
      const rate = document.createElement('span');
      rate.textContent = `${format.format(state.rate)} je 10.000 Einwohner`;
      tooltip.append(heading, detail, rate);
      tooltip.hidden = false;
    }

    states.forEach((state, index) => {
      const path = svgElement('path', {
        class: 'map-state', d: state.path, tabindex: 0,
        'data-land': state.id,
        'aria-label': `${state.name}: ${format.format(state.fortzuege)} Fortzüge ins Ausland 2025, alle Staatsangehörigkeiten`,
      });
      path.addEventListener('pointerenter', (event) => showTooltip(state, event.clientX, event.clientY));
      path.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'mouse') showTooltip(state, event.clientX, event.clientY);
      });
      path.addEventListener('pointerdown', (event) => showTooltip(state, event.clientX, event.clientY));
      path.addEventListener('focus', () => {
        const rect = path.getBoundingClientRect();
        showTooltip(state, rect.left + rect.width / 2, rect.top + rect.height / 2);
      });
      path.addEventListener('blur', () => { tooltip.hidden = true; });
      stateGroup.append(path);
      statePaths.push({ path, state });
    });
    svg.append(stateGroup);
    const desktopDestinations = {
      us: { path: 'M 197 195 C 166 160 126 123 96 103', nameX: 75, nameY: 42, valueX: 75, valueY: 69, anchor: 'end', originX: 197, originY: 195 },
      ch: { path: 'M 474 182 C 511 160 545 144 578 130', nameX: 596, nameY: 90, valueX: 596, valueY: 117, anchor: 'start', originX: 474, originY: 182 },
      es: { path: 'M 191 591 C 148 614 92 638 52 651', nameX: 48, nameY: 687, valueX: 48, valueY: 716, anchor: 'middle', originX: 191, originY: 591 },
      at: { path: 'M 443 628 C 488 640 528 642 548 636', nameX: 576, nameY: 642, valueX: 576, valueY: 674, anchor: 'start', originX: 443, originY: 628 },
    };
    const desktopMap = window.matchMedia('(min-width:761px)');
    const destinationValues = [];
    const captionLayouts = [];
    destinations.forEach((destination) => {
      const group = svgElement('g', { class: 'map-caption', 'data-destination': destination.id, 'aria-hidden': 'true' });
      const origin = svgElement('circle', { class: 'map-arrow-origin', r: 3 });
      const arrow = svgElement('path', { class: 'map-arrow', d: destination.path, 'marker-end': 'url(#arrowhead)' });
      const name = svgElement('text', { class: 'map-label', x: destination.nameX, y: destination.nameY, 'text-anchor': destination.anchor });
      name.textContent = destination.name;
      const value = svgElement('text', { class: 'map-value', x: destination.valueX, y: destination.valueY, 'text-anchor': destination.anchor });
      value.textContent = '0';
      group.append(origin, arrow, name, value);
      svg.append(group);
      destinationValues.push({ value, total: destination.value });
      captionLayouts.push({ destination, origin, arrow, name, value });
    });
    function positionCaptions() {
      for (const { destination, origin, arrow, name, value } of captionLayouts) {
        const layout = desktopMap.matches ? desktopDestinations[destination.id] : destination;
        arrow.setAttribute('d', layout.path);
        arrow.setAttribute('marker-end', desktopMap.matches ? 'url(#arrowhead-desktop)' : 'url(#arrowhead)');
        name.setAttribute('x', layout.nameX);
        name.setAttribute('y', layout.nameY);
        name.setAttribute('text-anchor', layout.anchor);
        value.setAttribute('x', layout.valueX);
        value.setAttribute('y', layout.valueY);
        value.setAttribute('text-anchor', layout.anchor);
        origin.style.display = desktopMap.matches ? '' : 'none';
        if (desktopMap.matches) {
          origin.setAttribute('cx', layout.originX);
          origin.setAttribute('cy', layout.originY);
        }
      }
    }
    /* Desktop: unteren Leerraum der Karte abschneiden, damit die Quellenzeile direkt unter der Karte steht */
    function fitViewBox() {
      if (!desktopMap.matches) {
        svg.setAttribute('viewBox', '-80 0 860 860');
        return;
      }
      try {
        const box = svg.getBBox();
        svg.setAttribute('viewBox', '-80 0 860 ' + Math.min(860, Math.ceil(box.y + box.height + 28)));
      } catch {
        svg.setAttribute('viewBox', '-80 0 860 860');
      }
    }
    positionCaptions();
    stage.append(svg, tooltip);
    fitViewBox();
    desktopMap.addEventListener('change', () => {
      positionCaptions();
      fitViewBox();
    });

    setupBleed(stage, statePaths, destinationValues, format);
    stage.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') tooltip.hidden = true;
    });
    stage.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('[data-land]')) tooltip.hidden = true;
    });
  } catch {
    stage.textContent = 'Die Karte konnte nicht geladen werden. Bitte die Seite neu laden.';
  }
}

function setupSlideTransition() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const mobile = window.matchMedia('(max-width:760px)');
  let target = 0;
  let current = 0;
  let frame = 0;

  function animate() {
    frame = 0;
    current += (target - current) * .18;
    if (Math.abs(target - current) < .002) current = target;
    hero.style.setProperty('--slide-progress', current.toFixed(4));
    hero.dispatchEvent(new CustomEvent('slideprogress', { detail: current }));
    if (current !== target) frame = requestAnimationFrame(animate);
  }

  function update() {
    if (reduceMotion.matches || !mobile.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      current = target = 0;
      hero.style.setProperty('--slide-progress', '0');
      hero.dispatchEvent(new CustomEvent('slideprogress', { detail: 0 }));
      return;
    }
    target = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight * .82)));
    if (!frame) frame = requestAnimationFrame(animate);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  reduceMotion.addEventListener('change', update);
  mobile.addEventListener('change', update);
  update();
}

/* Überlagerung Karte -> Kugel: --ov (0..1) steuert, wie weit der Globus-Abschnitt die Karte schon bedeckt. */
function setupOverlap() {
  const map = document.querySelector('.emigration');
  const globe = document.querySelector('.stories-globe');
  if (!map || !globe) return;
  const trenner = globe.querySelector('.sf-break');
  let frame = 0;
  function apply() {
    frame = 0;
    const vh = window.innerHeight;
    const raw = Math.min(1, Math.max(0, (vh - globe.getBoundingClientRect().top) / (vh * 0.95)));
    const eased = raw * raw * (3 - 2 * raw);
    map.style.setProperty('--ov', reduceMotion.matches ? '0' : eased.toFixed(3));
    /* Kapitel-Trenner: die Linie geht aus der Mitte auf, solange man nach unten scrollt. */
    const top = globe.getBoundingClientRect().top;
    const ln = Math.min(1, Math.max(0, (vh * 0.94 - top) / (vh * 0.5)));
    const lnEased = ln * ln * (3 - 2 * ln);
    const value = reduceMotion.matches ? 1 : lnEased;
    trenner?.style.setProperty('--ln', value.toFixed(4));
    trenner?.classList.toggle('is-in', value > 0.94);
  }
  function request() {
    if (!frame) frame = requestAnimationFrame(apply);
  }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  reduceMotion.addEventListener('change', request);
  apply();
}

function setupStoriesGlobe() {
  const section = document.querySelector('.stories-globe');
  if (!section) return;
  let started = false;
  async function load() {
    if (started) return;
    started = true;
    try {
      const { initStoriesGlobe } = await import('./globe.js?v=u62');
      await initStoriesGlobe(section);
    } catch {
      section.querySelector('.globe-hint').hidden = false;
      section.querySelector('.globe-hint').textContent = 'Die Weltkarte konnte nicht geladen werden. Bitte die Seite neu laden.';
    }
  }
  if (!('IntersectionObserver' in window)) return void load();
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: '600px 0px' });
  observer.observe(section);
}

function setupFaces() {
  const root = document.querySelector('.faces');
  const track = root?.querySelector('.faces__track');
  if (!root || !track) return;
  const cards = [...track.querySelectorAll('.faces__card')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mark = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    const viewStart = track.scrollLeft;
    const viewEnd = viewStart + track.clientWidth;
    cards.forEach((card, i) => {
      const start = card.offsetLeft;
      const overlap = Math.min(start + card.offsetWidth, viewEnd) - Math.max(start, viewStart);
      const visible = overlap > card.offsetWidth * 0.55;
      card.classList.toggle('is-on', i === best);
      card.toggleAttribute('aria-hidden', !visible);
    });
  };
  track.addEventListener('scroll', mark, { passive: true });
  mark();
  const step = () => (cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0]?.offsetWidth || 280);
  root.querySelector('.faces__nav--prev')?.addEventListener('click', () => {
    track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' });
  });
  root.querySelector('.faces__nav--next')?.addEventListener('click', () => {
    track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' });
  });
}

/* Zwei Großstädte: die ganze Glühbirne bricht auseinander, auch Kontur, Faden und Sockel. */
function setupCityTear() {
  const map = document.querySelector('.cities__map');
  const fill = map?.querySelector('.cities__bulb-fill');
  const glass = fill?.querySelector('.cities__bulb-glass');
  const line = map?.querySelector('.cities__bulb-line');
  const mask = map?.querySelector('#cities-holes');
  const shreds = map?.querySelector('.cities__shreds');
  const svg = map?.querySelector('svg');
  if (!map || !fill || !glass || !line || !mask || !shreds || !svg) return;
  const wound = { cx: 0, cy: -16, seed: 2.4 };

  function unit(n, seed) {
    const value = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function blob(cx, cy, r, seed) {
    const count = 8;
    const points = [];
    const stretch = 0.5 + unit(2, seed) * 0.95;
    const tilt = unit(3, seed) * Math.PI;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const jag = 0.38 + unit(i + 5, seed) * 0.95;
      const radius = r * jag;
      const x = Math.cos(angle) * radius * stretch;
      const y = Math.sin(angle) * radius / stretch;
      points.push([cx + x * cosT - y * sinT, cy + x * sinT + y * cosT]);
    }
    return points;
  }

  const box = fill.getBBox();
  const point = svg.createSVGPoint();
  const baseRects = [...fill.querySelectorAll('.cities__bulb-base rect')];

  function inside(x, y) {
    point.x = x;
    point.y = y;
    if (glass.isPointInFill(point)) return true;
    return baseRects.some((rect) => {
      const bounds = rect.getBBox();
      return x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height;
    });
  }

  function scatter(attempts, minR, maxR, gap, taken, salt) {
    const bites = [];
    for (let i = 0; i < attempts; i += 1) {
      const x = box.x + unit(i * 3 + 1, wound.seed + salt) * box.width;
      const y = box.y + unit(i * 5 + 2, wound.seed + salt) * box.height;
      const r = minR + unit(i * 7 + 4, wound.seed + salt) * (maxR - minR);
      if (!inside(x, y)) continue;
      const crowded = [...taken, ...bites].some((bite) => Math.hypot(bite.x - x, bite.y - y) < bite.r + r + gap);
      if (crowded) continue;
      bites.push({ x, y, r, seed: wound.seed + salt + i * 2.17 });
    }
    return bites;
  }

  function pathFrom(points) {
    return `${points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')}Z`;
  }

  const pieces = [];
  /* Gleicher Ablauf, nur deutlich langsamer: Zeiten gegenüber dem Ausgang um das Dreifache gestreckt. */
  const pace = 3;
  const appear = 0.48 * pace;
  const widen = 1.35 * pace;

  function ease(progress) {
    return 1 - (1 - progress) ** 3;
  }

  function place(piece, scale, leave) {
    const { hole, shred, x, y, dx, dy, rot, end } = piece;
    if (hole) hole.setAttribute('transform', `translate(${x} ${y}) scale(${scale.toFixed(4)}) translate(${-x} ${-y})`);
    shred.style.transform = `translate(${(dx * leave).toFixed(1)}px, ${(dy * leave).toFixed(1)}px) rotate(${(rot * leave).toFixed(1)}deg) scale(${Math.min(scale, 1).toFixed(4)})`;
    shred.style.opacity = String(1 + (end - 1) * leave);
  }

  function ribbon(x1, y1, x2, y2, width) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * width * 0.5;
    const ny = (dx / len) * width * 0.5;
    return `M${(x1 + nx).toFixed(2)} ${(y1 + ny).toFixed(2)}L${(x2 + nx).toFixed(2)} ${(y2 + ny).toFixed(2)}L${(x2 - nx).toFixed(2)} ${(y2 - ny).toFixed(2)}L${(x1 - nx).toFixed(2)} ${(y1 - ny).toFixed(2)}Z`;
  }

  function fray() {
    const bites = scatter(460, 5.2, 9.6, 0.5, [], 1);
    bites.push(...scatter(980, 2.3, 4.6, 0.4, bites, 11));
    const reach = Math.max(box.width, box.height) * 0.62;
    bites.forEach((bite, index) => {
      const points = blob(bite.x, bite.y, bite.r, bite.seed);
      const hole = svgElement('g', { class: 'cities__hole' });
      hole.append(svgElement('path', { fill: '#000', d: pathFrom(points) }));
      mask.append(hole);
      const shred = svgElement('path', {
        class: bite.r < 3.4 ? 'cities__shred cities__shred--dust' : 'cities__shred',
        d: pathFrom(points),
      });
      shreds.append(shred);
      const dist = Math.hypot(bite.x - wound.cx, bite.y - wound.cy);
      const near = 1 - Math.min(1, dist / reach);
      let angle = Math.atan2(bite.y - wound.cy, bite.x - wound.cx);
      if (!angle) angle = unit(index, bite.seed) * Math.PI * 2;
      const travel = 36 + near * 18 + unit(index + 2, bite.seed) * 28;
      const piece = {
        hole,
        shred,
        x: bite.x,
        y: bite.y,
        delay: ((dist / reach) * 0.8 + unit(index + 1, bite.seed) * 0.12) * pace,
        grow: 2.35 + near * 0.5 + unit(index + 8, bite.seed) * 0.28,
        dx: Math.cos(angle) * travel,
        dy: Math.sin(angle) * travel * 0.7 + 14 + unit(index + 6, bite.seed) * 16,
        rot: (unit(index + 4, bite.seed) - 0.5) * 54,
        end: 0,
      };
      pieces.push(piece);
      place(piece, 0, 0);
    });

    [...line.querySelectorAll('path, rect')].forEach((shape, index) => {
      const fine = shape.classList.contains('cities__bulb-filament') || shape.classList.contains('cities__bulb-lead');
      const width = fine ? 2.2 : 3.2;
      const length = shape.getTotalLength();
      const salt = 40 + index * 17;
      let cursor = 0;
      let n = 0;
      while (cursor < length - 1.5) {
        const span = 8 + unit(n * 3 + salt, wound.seed) * 9;
        const end = Math.min(length, cursor + span);
        if (end - cursor < 3.2) break;
        const a = shape.getPointAtLength(cursor);
        const b = shape.getPointAtLength(end);
        cursor = end;
        n += 1;
        if (Math.hypot(b.x - a.x, b.y - a.y) > span * 1.8) continue;
        const shred = svgElement('path', {
          class: fine ? 'cities__shred cities__shred--dust' : 'cities__shred',
          d: ribbon(a.x, a.y, b.x, b.y, width),
        });
        shreds.append(shred);
        const x = (a.x + b.x) / 2;
        const y = (a.y + b.y) / 2;
        const dist = Math.hypot(x - wound.cx, y - wound.cy);
        const near = 1 - Math.min(1, dist / reach);
        let angle = Math.atan2(y - wound.cy, x - wound.cx);
        if (!angle) angle = unit(n, wound.seed + salt) * Math.PI * 2;
        const travel = 36 + near * 18 + unit(n + 2, wound.seed + salt) * 28;
        const piece = {
          hole: null,
          shred,
          rim: true,
          x,
          y,
          delay: ((dist / reach) * 0.8 + unit(n + 1, wound.seed + salt) * 0.12) * pace,
          grow: 1,
          dx: Math.cos(angle) * travel,
          dy: Math.sin(angle) * travel * 0.7 + 14 + unit(n + 6, wound.seed + salt) * 16,
          rot: (unit(n + 4, wound.seed + salt) - 0.5) * 54,
          end: 0,
        };
        pieces.push(piece);
        place(piece, 1, 0);
      }
    });
    line.style.opacity = '0';
  }

  function finish() {
    pieces.forEach((piece) => place(piece, piece.rim ? 1 : piece.grow, 1));
    fill.style.opacity = '0';
    line.style.opacity = '0';
  }

  let frame = 0;

  function tear() {
    if (map.classList.contains('is-torn')) return;
    map.classList.add('is-torn');
    if (reduceMotion.matches || !pieces.length) {
      finish();
      return;
    }
    const started = performance.now();
    const step = (now) => {
      const time = (now - started) / 1000;
      let running = false;
      pieces.forEach((piece) => {
        const local = time - piece.delay;
        const resting = piece.rim ? 1 : 0;
        if (local <= 0) {
          place(piece, resting, 0);
          running = true;
          return;
        }
        if (local < appear) {
          const opened = ease(local / appear);
          place(piece, piece.rim ? 1 : opened, opened * 0.22);
          running = true;
          return;
        }
        if (local < appear + widen) {
          const opened = ease((local - appear) / widen);
          place(piece, piece.rim ? 1 : 1 + (piece.grow - 1) * opened, 0.22 + opened * 0.78);
          running = true;
          return;
        }
        place(piece, piece.rim ? 1 : piece.grow, 1);
      });
      const cleared = Math.min(1, Math.max(0, (time - 0.95 * pace) / (1.45 * pace)));
      fill.style.opacity = String(1 - ease(cleared));
      if (cleared < 1) running = true;
      frame = running ? requestAnimationFrame(step) : 0;
    };
    frame = requestAnimationFrame(step);
  }

  map.classList.add('is-ready');
  void map.offsetWidth;
  fray();
  if (reduceMotion.matches) finish();
  if (reduceMotion.matches) {
    tear();
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || entry.intersectionRatio < 0.4) return;
    observer.disconnect();
    requestAnimationFrame(tear);
  }, { threshold: [0, 0.4, 0.7] });
  observer.observe(map);
  reduceMotion.addEventListener('change', () => {
    if (!reduceMotion.matches) return;
    cancelAnimationFrame(frame);
    finish();
    map.classList.add('is-torn');
  });
}

function setupHeroWalk() {
  const figure = document.querySelector('.hero__figure');
  const canvas = figure?.querySelector('.hero__runner');
  const video = figure?.querySelector('.hero__walk');
  if (!figure || !canvas || !video) return;

  const ctx = canvas.getContext('2d');
  const frame = document.createElement('canvas');
  let frameCtx = null;
  let running = false;
  let scheduled = false;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(figure.clientWidth * dpr));
    const height = Math.max(1, Math.round(figure.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function smoothstep(value) {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  }

  /* Erst Schwarz, dann Grau, dann löst sich die Silhouette im Nebel auf. */
  function veil() {
    const anim = figure.getAnimations().find((item) => item.animationName === 'hero-into');
    if (!anim?.effect) return { tone: 0, alpha: 1 };
    const duration = Number(anim.effect.getComputedTiming().duration);
    if (!duration) return { tone: 0, alpha: 1 };
    const t = Math.min(1, Math.max(0, anim.currentTime / duration));
    return {
      tone: smoothstep((t - 0.46) / 0.28),
      alpha: 1 - smoothstep((t - 0.68) / 0.32),
    };
  }

  function draw() {
    if (!video.videoWidth || !canvas.width) return;
    if (frame.width !== video.videoWidth) {
      frame.width = video.videoWidth;
      frame.height = video.videoHeight;
      frameCtx = frame.getContext('2d', { willReadFrequently: true });
    }
    frameCtx.drawImage(video, 0, 0);
    const image = frameCtx.getImageData(0, 0, frame.width, frame.height);
    const data = image.data;
    const width = frame.width;
    const height = frame.height;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const lum = (data[index] * 77 + data[index + 1] * 150 + data[index + 2] * 29) >> 8;
        let alpha = 0;
        if (lum < 36) alpha = 255;
        else if (lum < 150) alpha = ((150 - lum) * 255) / 114;
        data[index] = 7;
        data[index + 1] = 7;
        data[index + 2] = 8;
        data[index + 3] = alpha;
        if (alpha > 48) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return;
    frameCtx.putImageData(image, 0, 0);
    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    let scale = canvas.height / boundsHeight;
    if (boundsWidth * scale > canvas.width) scale = canvas.width / boundsWidth;
    const destWidth = boundsWidth * scale;
    const destHeight = boundsHeight * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      frame,
      minX,
      minY,
      boundsWidth,
      boundsHeight,
      (canvas.width - destWidth) / 2,
      canvas.height - destHeight,
      destWidth,
      destHeight
    );
    const veilState = veil();
    if (veilState.tone > 0 || veilState.alpha < 1) {
      const gray = Math.round(7 + (164 - 7) * veilState.tone);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = `rgba(${gray},${gray},${gray},${veilState.alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.globalCompositeOperation = 'destination-out';
    const fade = ctx.createLinearGradient(0, canvas.height * 0.97, 0, canvas.height);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,.4)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, canvas.height * 0.97, canvas.width, canvas.height * 0.03);
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick() {
    scheduled = false;
    if (!running) return;
    draw();
    scheduled = true;
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(tick);
    else requestAnimationFrame(tick);
  }

  function useStill() {
    const paint = () => draw();
    if (Math.abs(video.currentTime - 4) < 0.05 && video.readyState >= 2) paint();
    else {
      video.addEventListener('seeked', paint, { once: true });
      video.currentTime = 4;
    }
  }

  video.muted = true;
  video.playsInline = true;
  video.playbackRate = 1.45;
  video.addEventListener('error', () => {
    canvas.classList.add('is-fallback');
    if (!reduceMotion.matches) figure.classList.add('is-walking');
  });
  video.addEventListener('loadeddata', () => {
    size();
    if (reduceMotion.matches) {
      useStill();
      return;
    }
    draw();
    figure.classList.add('is-walking');
    running = true;
    tick();
    video.play().catch(() => {
      running = false;
      figure.classList.remove('is-walking');
      useStill();
    });
  });
  figure.addEventListener('animationend', (event) => {
    if (event.animationName !== 'hero-into') return;
    running = false;
    video.pause();
    draw();
  });
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden) {
      video.pause();
      scheduled = false;
    } else video.play().then(() => { if (running && !scheduled) tick(); }).catch(() => {});
  });
  new ResizeObserver(size).observe(figure);
  if (video.readyState >= 2) video.dispatchEvent(new Event('loadeddata'));
}

setupHeroWalk();
setupCityTear();
setupMenu();
setupCounter();
setupReveal();
setupMap();
setupBloodSeam();
setupSlideTransition();
setupStoriesGlobe();
setupFaces();
