/* =========================================================
   ФОНОВІ ЕФЕКТИ: «Тканина буття» + падаючі комети +
   динамічний курсор-енергія
   Підключати ОКРЕМИМ файлом, після основного script.js:
   <script src="effects.js"></script>
   Нічого в основному script.js/HTML/CSS міняти не треба —
   всі елементи і стилі створюються тут автоматично.
   ========================================================= */

(function () {
    "use strict";
    if (window.__fabricEffectsInit) return;
    window.__fabricEffectsInit = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = !window.matchMedia("(pointer: fine)").matches;

    /* ---------------------------------------------------
       0. СТИЛІ
       --------------------------------------------------- */
    const style = document.createElement("style");
    style.textContent = `
        #fabric-canvas{
            position:fixed; inset:0; width:100vw; height:100vh;
            z-index:-1; pointer-events:none; display:block;
        }
        #cursor-fx{
            position:fixed; inset:0; width:100vw; height:100vh;
            z-index:9998; pointer-events:none; mix-blend-mode:screen;
        }
        #cursor-core{
            position:fixed; top:0; left:0; width:7px; height:7px;
            margin:-3.5px 0 0 -3.5px; border-radius:50%;
            background:#fff;
            box-shadow:0 0 10px 3px rgba(255,255,255,.9), 0 0 24px 9px rgba(142,162,255,.5);
            pointer-events:none; z-index:10000;
            opacity:0; transition:opacity .25s ease;
        }
        body.__fabric-cursor-active{ cursor:none !important; }
        body.__fabric-cursor-active *{ cursor:none !important; }

        /* На телефонах і тач-пристроях ховаємо тільки курсор.
        Тканина і комети залишаються видимими. */
        @media (pointer: coarse), (max-width: 640px) {
            #cursor-fx,
            #cursor-core {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    /* ---------------------------------------------------
       1. КАНВАС ТКАНИНИ
       --------------------------------------------------- */
    const canvas = document.createElement("canvas");
    canvas.id = "fabric-canvas";
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let vw = window.innerWidth, vh = window.innerHeight;

    const SPACING = 46;
    const BASE = { r: 56, g: 46, b: 104 };
    let points = [];

    function buildGrid() {
        points = [];
        const cols = Math.ceil(vw / SPACING) + 2;
        const rows = Math.ceil(vh / SPACING) + 2;
        for (let j = 0; j < rows; j++) {
            const row = [];
            for (let i = 0; i < cols; i++) {
                const ox = i * SPACING - SPACING;
                const oy = j * SPACING - SPACING;
                row.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0, depth: 0, tr: BASE.r, tg: BASE.g, tb: BASE.b });
            }
            points.push(row);
        }
    }

    function resize() {
        vw = window.innerWidth;
        vh = window.innerHeight;
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = vw * DPR;
        canvas.height = vh * DPR;
        canvas.style.width = vw + "px";
        canvas.style.height = vh + "px";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        buildGrid();
    }
    window.addEventListener("resize", resize);

    /* ---------------------------------------------------
       2. ДЖЕРЕЛА ЗБУРЕННЯ: курсор + комети
       --------------------------------------------------- */
    function randomBetween(min, max) { return Math.random() * (max - min) + min; }

    function hexToRgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function hslToRgb(h, s, l) {
        h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
    }

    const cursorSrc = { x: vw / 2, y: vh / 2, radius: 190, strength: 30, active: false };
    const mouse = { x: vw / 2, y: vh / 2, tx: vw / 2, ty: vh / 2 };

    const COMET_COLORS = ["#8ea2ff", "#ffd166", "#7ee787", "#ff8fa3", "#7cf5ff"];
    const COMET_COUNT = reduceMotion ? 0 : (isTouch ? 5 : 7);

    function spawnComet() {
        const goingRight = Math.random() < 0.5;
        const angle = randomBetween(58, 76) * Math.PI / 180;
        const speed = randomBetween(5.5, 10.5);
        const colorHex = COMET_COLORS[Math.floor(Math.random() * COMET_COLORS.length)];
        return {
            x: randomBetween(-150, vw + 150),
            y: randomBetween(-300, -40),
            vx: Math.cos(angle) * speed * (goingRight ? 1 : -1),
            vy: Math.sin(angle) * speed,
            size: randomBetween(1.6, 3.2),
            colorHex,
            color: hexToRgb(colorHex),
            radius: randomBetween(95, 160),
            strength: randomBetween(22, 36),
            trail: []
        };
    }
    let comets = Array.from({ length: COMET_COUNT }, spawnComet);

    function updateComets() {
        for (let idx = 0; idx < comets.length; idx++) {
            const c = comets[idx];
            c.trail.push({ x: c.x, y: c.y });
            if (c.trail.length > 16) c.trail.shift();
            c.x += c.vx;
            c.y += c.vy;
            if (c.y > vh + 200 || c.x < -300 || c.x > vw + 300) {
                comets[idx] = spawnComet();
            }
        }
    }

    function drawComets() {
        for (const c of comets) {
            const n = c.trail.length;
            for (let k = 1; k < n; k++) {
                const a = k / n;
                ctx.strokeStyle = `rgba(${c.color.r},${c.color.g},${c.color.b},${(a * 0.5).toFixed(2)})`;
                ctx.lineWidth = c.size * a;
                ctx.beginPath();
                ctx.moveTo(c.trail[k - 1].x, c.trail[k - 1].y);
                ctx.lineTo(c.trail[k].x, c.trail[k].y);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.fillStyle = c.colorHex;
            ctx.shadowColor = c.colorHex;
            ctx.shadowBlur = 18;
            ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    /* ---------------------------------------------------
       3. ФІЗИКА ТКАНИНИ (пружна сітка + пульс)
       --------------------------------------------------- */
    function updateGrid(time) {
        const sources = [];
        if (cursorSrc.active) {
            const hue = (time * 0.03) % 360;
            const c = hslToRgb(hue, 85, 68);
            sources.push({ x: cursorSrc.x, y: cursorSrc.y, radius: cursorSrc.radius, strength: cursorSrc.strength, r: c.r, g: c.g, b: c.b });
        }
        for (const c of comets) {
            sources.push({ x: c.x, y: c.y, radius: c.radius, strength: c.strength, r: c.color.r, g: c.color.g, b: c.color.b });
        }

        for (let j = 0; j < points.length; j++) {
            const row = points[j];
            for (let i = 0; i < row.length; i++) {
                const p = row[i];
                let dx = 0, dy = 0, depth = 0;
                let tr = 0, tg = 0, tb = 0, wsum = 0;

                for (const s of sources) {
                    const ddx = p.ox - s.x, ddy = p.oy - s.y;
                    const dist = Math.hypot(ddx, ddy);
                    if (dist < s.radius) {
                        const f = Math.pow(1 - dist / s.radius, 2);
                        const nx = ddx / (dist || 1), ny = ddy / (dist || 1);
                        dx += nx * f * s.strength;
                        dy += ny * f * s.strength;
                        depth += f;
                        tr += s.r * f; tg += s.g * f; tb += s.b * f; wsum += f;
                    }
                }

                // ледь відчутне «дихання» тканини — навіть у спокої
                if (!reduceMotion) {
                    dx += Math.sin(p.ox * 0.012 + time * 0.00045) * 2.2;
                    dy += Math.cos(p.oy * 0.014 + time * 0.00035) * 2.2;
                }

                const targetX = p.ox + dx, targetY = p.oy + dy;
                const ax = (targetX - p.x) * 0.1, ay = (targetY - p.y) * 0.1;
                p.vx = (p.vx + ax) * 0.8;
                p.vy = (p.vy + ay) * 0.8;
                p.x += p.vx;
                p.y += p.vy;

                p.depth += (Math.min(depth, 1) - p.depth) * 0.15;
                if (wsum > 0) {
                    p.tr += (tr / wsum - p.tr) * 0.15;
                    p.tg += (tg / wsum - p.tg) * 0.15;
                    p.tb += (tb / wsum - p.tb) * 0.15;
                }
            }
        }
    }

    function drawGrid() {
        const rows = points.length, cols = points[0].length;

        function segColor(p1, p2) {
            const d = (p1.depth + p2.depth) / 2;
            const r = BASE.r + ((p1.tr + p2.tr) / 2 - BASE.r) * d;
            const g = BASE.g + ((p1.tg + p2.tg) / 2 - BASE.g) * d;
            const b = BASE.b + ((p1.tb + p2.tb) / 2 - BASE.b) * d;
            const a = 0.1 + d * 0.7;
            return `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(2)})`;
        }

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols - 1; i++) {
                const p1 = points[j][i], p2 = points[j][i + 1];
                ctx.strokeStyle = segColor(p1, p2);
                ctx.lineWidth = 1 + (p1.depth + p2.depth) * 1.4;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows - 1; j++) {
                const p1 = points[j][i], p2 = points[j + 1][i];
                ctx.strokeStyle = segColor(p1, p2);
                ctx.lineWidth = 1 + (p1.depth + p2.depth) * 1.4;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        // вузлики світла у місцях найбільшого натягу
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const p = points[j][i];
                if (p.depth > 0.35) {
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(${p.tr | 0},${p.tg | 0},${p.tb | 0},${(p.depth * 0.9).toFixed(2)})`;
                    ctx.shadowColor = `rgba(${p.tr | 0},${p.tg | 0},${p.tb | 0},0.9)`;
                    ctx.shadowBlur = 10 * p.depth;
                    ctx.arc(p.x, p.y, 1.4 * p.depth, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    /* ---------------------------------------------------
       4. ДИНАМІЧНИЙ КУРСОР (без кільця навколо)
       --------------------------------------------------- */
    let core, fxCanvas, fxCtx;
    let sparks = [];
    let ringX = vw / 2, ringY = vh / 2;

    function initCursor() {
        if (isTouch) return;

        fxCanvas = document.createElement("canvas");
        fxCanvas.id = "cursor-fx";
        document.body.appendChild(fxCanvas);
        fxCtx = fxCanvas.getContext("2d");

        core = document.createElement("div");
        core.id = "cursor-core";
        document.body.appendChild(core);

        function resizeFx() {
            fxCanvas.width = window.innerWidth;
            fxCanvas.height = window.innerHeight;
        }
        resizeFx();
        window.addEventListener("resize", resizeFx);

        document.addEventListener("mousemove", (e) => {
            mouse.tx = e.clientX;
            mouse.ty = e.clientY;
            cursorSrc.active = true;
            core.style.opacity = "1";
            document.body.classList.add("__fabric-cursor-active");

            core.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

            if (!reduceMotion) {
                const speed = Math.hypot(e.clientX - mouse.x, e.clientY - mouse.y);
                const count = Math.min(3, Math.max(1, Math.floor(speed / 6)));
                for (let k = 0; k < count; k++) {
                    const hue = (performance.now() * 0.05 + k * 40) % 360;
                    const rgb = hslToRgb(hue, 90, 70);
                    sparks.push({
                        x: e.clientX,
                        y: e.clientY,
                        vx: randomBetween(-1, 1) - (e.clientX - mouse.x) * 0.04,
                        vy: randomBetween(-1, 1) - (e.clientY - mouse.y) * 0.04,
                        life: 1,
                        size: randomBetween(1.2, 2.6),
                        color: rgb
                    });
                    if (sparks.length > 140) sparks.shift();
                }
            }
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        document.addEventListener("mouseleave", () => {
            cursorSrc.active = false;
            core.style.opacity = "0";
            document.body.classList.remove("__fabric-cursor-active");
        });
        document.addEventListener("mouseenter", () => {
            cursorSrc.active = true;
            core.style.opacity = "1";
            document.body.classList.add("__fabric-cursor-active");
        });

        // курсор-джерело для тканини все ще плавно "доганяє" мишу
        function tickSource() {
            const dx = mouse.tx - ringX, dy = mouse.ty - ringY;
            ringX += dx * 0.2;
            ringY += dy * 0.2;
            cursorSrc.x = ringX;
            cursorSrc.y = ringY;
            requestAnimationFrame(tickSource);
        }
        tickSource();
    }

    function updateAndDrawSparks() {
        if (!fxCtx) return;
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.95; s.vy *= 0.95;
            s.life -= 0.028;
            if (s.life <= 0) { sparks.splice(i, 1); continue; }
            fxCtx.beginPath();
            fxCtx.fillStyle = `rgba(${s.color.r | 0},${s.color.g | 0},${s.color.b | 0},${s.life.toFixed(2)})`;
            fxCtx.shadowColor = `rgba(${s.color.r | 0},${s.color.g | 0},${s.color.b | 0},${s.life.toFixed(2)})`;
            fxCtx.shadowBlur = 8;
            fxCtx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
            fxCtx.fill();
        }
        fxCtx.shadowBlur = 0;
    }

    /* ---------------------------------------------------
       5. ГОЛОВНИЙ ЦИКЛ
       --------------------------------------------------- */
    function isVisible() {
        return getComputedStyle(canvas).display !== "none";
    }

    function frame(time) {
        if (isVisible()) {
            ctx.clearRect(0, 0, vw, vh);
            updateGrid(time);
            drawGrid();
            updateComets();
            drawComets();
            updateAndDrawSparks();
        }
        requestAnimationFrame(frame);
    }

    resize();
    initCursor();

    if (reduceMotion) {
        // для людей, що просять менше руху: одна статична відмальовка,
        // без нескінченного циклу анімації.
        ctx.clearRect(0, 0, vw, vh);
        updateGrid(0);
        drawGrid();
    } else {
        requestAnimationFrame(frame);
    }

})();