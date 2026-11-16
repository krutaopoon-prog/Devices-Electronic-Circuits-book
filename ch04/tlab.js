/* ===========================================
   ห้องแล็บวัดทรานซิสเตอร์เสมือน บทที่ 4 (ใช้กับ lab.html ต้องโหลด meters.js ก่อน)
   ต่อยอดจากห้องแล็บมิเตอร์ของวิชางานไฟฟ้าฯ บทที่ 2
   - มิเตอร์เข็มเหมือนเครื่องจริง: ย่านโอห์ม ขั้วบวกของถ่านในเครื่องออกที่ขั้ว −COM (สายดำ)
     ×1–×1k ใช้ถ่าน 3 V, ×10k ใช้ถ่าน 9 V
   - มิเตอร์ดิจิทัล: ย่านโอห์ม/ไดโอด สายแดงเป็นบวก (2.8 V ผ่าน 2.8 kΩ) และช่อง hFE
   - ทรานซิสเตอร์ = รอยต่อ PN สองรอย (แก้วงจรแบบไม่เชิงเส้นด้วยการสลับสถานะไดโอดซ้ำจนลงตัว)
   - ภารกิจเรียงตามหนังสือ  ?m=3 เปิดภารกิจที่ 3  ?embed=1 ฝังในสไลด์
   ความคืบหน้าเก็บในเครื่องนักเรียน (localStorage: deb-ch04-lab)
   =========================================== */
(function () {
    'use strict';
    const M = window.Meters;
    const $ = s => document.querySelector(s);
    const F = 'font-family="Prompt, Kanit, sans-serif"';
    const FT = 'font-family="Kanit, Sarabun, sans-serif"';
    const r1 = n => Math.round(n * 10) / 10;
    const rad = d => d * Math.PI / 180;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const num = n => { const s = String(Math.round(n * 1000) / 1000); return s; };
    const qs = new URLSearchParams(location.search);
    const EMBED = qs.get('embed') === '1';
    const KEY = 'deb-ch04-lab';
    const store = {
        get() { try { return JSON.parse(localStorage.getItem(KEY)) || { done: [] }; } catch (e) { return { done: [] }; } },
        set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* ใช้งานต่อได้แม้บันทึกไม่ได้ */ } }
    };

    /* ---------- ผังโต๊ะ (หน่วยโลก 2000 × 1200) ---------- */
    const WORLD = { x: 0, y: 60, w: 2000, h: 1120 };
    const MT = { analog: { tx: 20, ty: 150, s: 1 }, dmm: { tx: 10, ty: 132, s: 0.95 } };
    const JACKS = {
        analog: { com: M.AK.com, pos: M.AK.pos, out: M.AK.out },
        dmm: { com: M.DK.com, vma: M.DK.vma, a10: M.DK.a10 }
    };
    const JNAME = { com: '−COM', pos: '+', out: 'OUTPUT', vma: 'VΩmA', a10: '10A' };
    const toW = (m, p) => { const t = MT[m]; return [t.tx + t.s * p[0], t.ty + t.s * p[1]]; };
    const REST = { red: { plug: [760, 1060], tip: [880, 690] }, black: { plug: [670, 1070], tip: [800, 740] } };

    /* ---------- สถานะ ---------- */
    const S = {
        meter: 'analog', sel: { analog: 'off', dmm: 'off' },
        screw: 0, zBase: 0, adjDeg: 0, oblique: false, helper: false,
        fuse: { analog: true, dmm: true }, danger: null,
        leads: { red: null, black: null },
        fx: 'tr', psuV: 0, sw: true, link: true, breaker: false, lampBig: false,
        bank: [], cur: 0, sock: null, flip: false, log: new Set(), zoomed: false
    };
    function restLeads() {
        ['red', 'black'].forEach(c => { S.leads[c] = { jack: null, plug: REST[c].plug.slice(), tip: REST[c].tip.slice(), tp: null }; });
    }
    restLeads();
    const zoff = () => clamp(S.zBase + S.screw / 1200, -0.08, 0.08);
    // ค่าตั้งต้นของแต่ละย่าน Ω (แบตเตอรี่ในเครื่องให้กระแสไม่เท่ากัน จึงต้องปรับ 0 Ω ทุกครั้งที่เปลี่ยนย่าน)
    const KR = { x1: 0.93, x10: 0.955, x100: 0.97, x1k: 0.985, x10k: 0.91 };

    /* ---------- วงจรบนโต๊ะ ---------- */
    const V = (a, b, v) => ({ t: 'V', a, b, v }), R = (a, b, r) => ({ t: 'R', a, b, r }), I = (a, b, i) => ({ t: 'I', a, b, i });
    const D = (a, b, vf, rs, vz) => ({ t: 'D', a, b, vf, rs, vz: vz || 0 });   // ไดโอด แอโนด a แคโทด b
    const T = (x, y, t, size, c, anchor, wt, extra) => `<text x="${x}" y="${y}" font-size="${size || 26}" ${FT} font-weight="${wt || 500}" fill="${c || '#333'}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle" ${extra || ''}>${t}</text>`;
    const wire = (pts, c) => `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#5b4636" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="${c || '#c98b3a'}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const BANDS = { 0: '#111', 1: '#7b3f00', 2: '#d32f2f', 3: '#f57c00', 4: '#fbc02d', 5: '#388e3c', 6: '#1976d2', 7: '#7b1fa2', 8: '#888', 9: '#fff', g: '#c9a227' };
    const RES = [
        { v: 10, b: [1, 0, 0, 'g'], name: 'น้ำตาล ดำ ดำ' },
        { v: 220, b: [2, 2, 1, 'g'], name: 'แดง แดง น้ำตาล' },
        { v: 1000, b: [1, 0, 2, 'g'], name: 'น้ำตาล ดำ แดง' },
        { v: 4700, b: [4, 7, 2, 'g'], name: 'เหลือง ม่วง แดง' },
        { v: 100000, b: [1, 0, 4, 'g'], name: 'น้ำตาล ดำ เหลือง' }
    ];
    /* ---------- อุปกรณ์บนโต๊ะ: ไดโอด และทรานซิสเตอร์ ----------
       ทรานซิสเตอร์ = รอยต่อ PN สองรอย (ไดโอดซิลิกอน) BE ตก 0.66 V, BC ตก 0.64 V
       รอยต่อ BE ไบแอสกลับแล้วพังทลายที่ราว 7 V (ถ่าน 9 V ของย่าน R×10k จึงดันกระแสผ่านได้เล็กน้อย) ส่วน BC ทนได้สูงมาก
       order = ชื่อขาเรียงซ้ายไปขวาเมื่อหันด้านแบนเข้าหาตัว เช่น 'CBE' */
    const LEGX = [1300, 1420, 1540], PADY = 830;
    const cur = () => S.bank[S.cur] || S.bank[0];
    const legOf = (t, role) => t.order.indexOf(role) + 1;           // ขาที่ 1–3
    const tpOf = (t, role) => 'l' + legOf(t, role);
    const nodeOf = (t, role) => 'n' + legOf(t, role);
    function trElems(t) {
        if (!t || S.sock) return [];
        const E = nodeOf(t, 'E'), B = nodeOf(t, 'B'), C = nodeOf(t, 'C'), e = [];
        const be = t.type === 'npn' ? D(B, E, 0.66, 20, 7) : D(E, B, 0.66, 20, 7);
        const bc = t.type === 'npn' ? D(B, C, 0.64, 20) : D(C, B, 0.64, 20);
        if (t.state !== 'open') e.push(be);
        e.push(bc);
        if (t.state === 'short') e.push(R(C, E, 3));
        return e;
    }
    // ค่าที่จอแสดงในย่าน hFE: เสียบถูกแถวและถูกด้าน = hFE จริง · สลับ E กับ C = ค่าต่ำมาก · ผิดแถว = 000
    function hfeVal() {
        const t = cur();
        if (S.fx !== 'tr' || !S.sock || !t) return 0;
        if (t.state === 'short') return 5000;
        if (t.state === 'open' || S.sock !== t.type) return 0;
        const roles = (S.flip ? t.order.split('').reverse().join('') : t.order);
        if (roles === 'EBC') return t.hfe;
        if (roles === 'CBE') return 7;
        return 0;
    }
    function hfeDisp() {
        const v = hfeVal();
        return v > 1999 ? '1   ' : String(Math.round(v)).padStart(3, '0');
    }
    // บันทึกว่าวัดคู่ขาไหนไปแล้ว (ใช้ตรวจภารกิจ)
    function logMeas() {
        if (S.fx !== 'tr' || S.sock) return;
        const r = S.leads.red.tp, b = S.leads.black.tp;
        if (!r || !b || r === b || !S.leads.red.jack || !S.leads.black.jack) return;
        const sel = S.meter === 'analog' ? S.sel.analog : S.sel.dmm;
        S.log.add(`${S.cur}|${sel}|${r}|${b}`);
    }
    const measured = (t, ranges, redRole, blackRole) => ranges.some(sel => S.log.has(`${S.bank.indexOf(t)}|${sel}|${tpOf(t, redRole)}|${tpOf(t, blackRole)}`));
    const PAD_LAB = (t, i) => {
        const role = t.order[i];
        if (t.show === 'all' || (t.show === 'B' && role === 'B')) return role;
        return String(i + 1);
    };
    const btnSvg = (x, y, w, txt, click, on) => `<g data-click="${click}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${w}" height="54" rx="14" fill="${on ? '#d7f0ef' : '#fff'}" stroke="${on ? '#00878f' : '#9aa0a6'}" stroke-width="3"/>${T(x + w / 2, y + 28, txt, 22, on ? '#0b5f65' : '#333', 'middle', 600)}</g>`;
    function to92(cx, top, t, scale, label) {
        const k = scale || 1, w = 110 * k, h = 190 * k;
        return `<path d="M${cx - w} ${top + h} V${top + 50 * k} Q${cx - w} ${top} ${cx} ${top} Q${cx + w} ${top} ${cx + w} ${top + 50 * k} V${top + h} Z" fill="#26272b" stroke="#111" stroke-width="3"/>
            <path d="M${cx - w + 8} ${top + 56 * k} Q${cx - w + 8} ${top + 10} ${cx} ${top + 10}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="${6 * k}"/>
            ${T(cx, top + 80 * k, label || t.name, 34 * k, '#e8e8e8', 'middle', 600)}
            ${t.show === 'all' ? T(cx, top + 125 * k, t.type.toUpperCase(), 26 * k, '#9fd7ff', 'middle', 600) : ''}`;
    }
    const FX = {
        diode: {
            name: 'ไดโอด 1N4007',
            tps: [{ id: 'a', node: 'da', x: 1160, y: 600, lab: 'ขาแอโนด (A) ของไดโอด' }, { id: 'k', node: 'dk', x: 1720, y: 600, lab: 'ขาแคโทด (K) ของไดโอด' }],
            elems: () => [D('da', 'dk', 0.6, 15)],
            draw: () => `<rect x="980" y="300" width="920" height="560" rx="26" fill="#f4efe2" stroke="#d8ccb2" stroke-width="3"/>
                ${T(1440, 360, 'ไดโอด 1N4007 (ใช้ทดสอบว่าสายไหนเป็นบวก)', 28, '#444', 'middle', 600)}
                <path d="M1160 600 H1340 M1540 600 H1720" stroke="#9aa0a6" stroke-width="8" stroke-linecap="round"/>
                <rect x="1330" y="560" width="220" height="80" rx="14" fill="#26272b"/>
                <rect x="1498" y="560" width="26" height="80" fill="#cfd3d6"/>
                ${T(1430, 602, '1N4007', 24, '#ddd', 'middle', 600)}
                ${T(1160, 540, 'A', 44, '#c0392b', 'middle', 700)}${T(1720, 540, 'K', 44, '#1565c0', 'middle', 700)}
                ${T(1160, 680, 'แอโนด', 24, '#555')}${T(1720, 680, 'แคโทด (ฝั่งแถบสี)', 24, '#555')}
                <path d="M1390 740 h70 M1460 712 v56 M1390 712 v56 l70 -28 z" fill="#333" stroke="#333" stroke-width="4"/>
                ${T(1440, 800, 'สัญลักษณ์ A ▶| K', 22, '#555')}`
        },
        tr: {
            name: 'ทรานซิสเตอร์',
            get tps() { const t = cur(); return [0, 1, 2].map(i => ({ id: 'l' + (i + 1), node: 'n' + (i + 1), x: LEGX[i], y: PADY, lab: t ? 'ขา ' + PAD_LAB(t, i) : 'ขา ' + (i + 1) })); },
            elems: () => trElems(cur()),
            draw: () => {
                const t = cur();
                if (!t) return '';
                let s = `<rect x="980" y="140" width="940" height="960" rx="26" fill="#f4efe2" stroke="#d8ccb2" stroke-width="3"/>`;
                // แถบเลือกตัว
                if (S.bank.length > 1) S.bank.forEach((b, i) => { s += btnSvg(1010 + i * 175, 170, 160, b.name, 'pick' + i, i === S.cur); });
                if (MI && MI.free) s += btnSvg(1720, 1020, 180, S.bank.some(b => b.show === 'all' && b.show0 !== 'all') ? 'ซ่อนชื่อขา' : 'เฉลยชื่อขา', 'reveal', false);
                const bodyX = S.meter === 'dmm' ? 1380 : 1420;
                if (!S.sock) {
                    s += `<rect x="1240" y="${PADY - 40}" width="360" height="90" rx="14" fill="#e3dccb"/>`;
                    [0, 1, 2].forEach(i => {
                        const x0 = bodyX - 60 + i * 60;
                        s += `<path d="M${x0} 560 V640 L${LEGX[i]} ${PADY - 70} V${PADY}" fill="none" stroke="#b9bec2" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
                        s += T(LEGX[i], PADY + 90, PAD_LAB(t, i), 46, /[EBC]/.test(PAD_LAB(t, i)) ? '#0b5f65' : '#333', 'middle', 700);
                    });
                    s += to92(bodyX, 370, t, 1);
                    s += T(bodyX, 300, S.meter === 'dmm' ? 'หันด้านแบนเข้าหาตัว' : 'หันด้านแบนเข้าหาตัว ขาเรียง 1 2 3 จากซ้ายไปขวา', 24, '#555', 'middle', 500);
                } else {
                    s += T(1400, 520, 'ทรานซิสเตอร์เสียบอยู่ในช่อง hFE', 30, '#555', 'middle', 600) + T(1400, 570, 'กด "ถอดออก" เพื่อนำกลับมาวัดที่ขา', 24, '#777');
                }
                // ช่อง hFE (เฉพาะมิเตอร์ดิจิทัล)
                if (S.meter === 'dmm') {
                    const X = 1640;
                    s += `<rect x="${X}" y="250" width="270" height="400" rx="18" fill="#ffd84a" stroke="#c99a00" stroke-width="3"/>`;
                    s += T(X + 135, 284, 'ช่อง hFE ของมิเตอร์', 22, '#333', 'middle', 700);
                    [['npn', 370], ['pnp', 520]].forEach(([row, y]) => {
                        s += `<rect x="${X + 20}" y="${y - 40}" width="230" height="100" rx="12" fill="#2b2b2b"/>`;
                        s += T(X + 135, y - 56, row.toUpperCase(), 22, '#333', 'middle', 700);
                        ['E', 'B', 'C'].forEach((h, k) => { s += `<circle cx="${X + 75 + k * 60}" cy="${y + 30}" r="9" fill="#000" stroke="#777" stroke-width="2"/>${T(X + 75 + k * 60, y - 14, h, 22, '#ffd84a', 'middle', 700)}`; });
                        if (S.sock === row) {
                            const lab = (S.flip ? t.order.split('').reverse() : t.order.split('')).map((r, k) => (t.show === 'all' ? r : String(S.flip ? 3 - k : k + 1)));
                            s += `<path d="M${X + 45} ${y + 24} V${y - 10} Q${X + 45} ${y - 34} ${X + 135} ${y - 34} Q${X + 225} ${y - 34} ${X + 225} ${y - 10} V${y + 24} Z" fill="#555" opacity=".9"/>`;
                            s += lab.map((l, k) => T(X + 75 + k * 60, y + 6, l, 18, '#fff', 'middle', 700)).join('');
                        }
                    });
                    s += btnSvg(X - 10, 680, 140, 'เสียบ NPN', 'sockN', S.sock === 'npn') + btnSvg(X + 140, 680, 140, 'เสียบ PNP', 'sockP', S.sock === 'pnp');
                    s += btnSvg(X - 10, 748, 140, 'กลับด้าน', 'flip', S.flip) + btnSvg(X + 140, 748, 140, 'ถอดออก', 'unsock', false);
                }
                return s;
            }
        }
    };
    const fxTP = id => FX[S.fx].tps.find(t => t.id === id);

    /* ---------- แก้สมการวงจร (Modified Nodal Analysis) ---------- */
    function solve(elems) {
        const idx = new Map();
        const nd = n => (n === 'gnd' ? -1 : (idx.has(n) ? idx.get(n) : (idx.set(n, idx.size), idx.size - 1)));
        elems.forEach(e => { nd(e.a); nd(e.b); });
        const N = idx.size, nv = elems.filter(e => e.t === 'V').length, K = N + nv;
        const A = Array.from({ length: K }, () => new Float64Array(K)), z = new Float64Array(K);
        for (let i = 0; i < N; i++) A[i][i] += 1e-12;
        let k = N;
        elems.forEach(e => {
            const a = nd(e.a), b = nd(e.b);
            if (e.t === 'R') {
                const gg = 1 / e.r;
                if (a >= 0) A[a][a] += gg; if (b >= 0) A[b][b] += gg;
                if (a >= 0 && b >= 0) { A[a][b] -= gg; A[b][a] -= gg; }
            } else if (e.t === 'I') { if (a >= 0) z[a] -= e.i; if (b >= 0) z[b] += e.i; }
            else { if (a >= 0) { A[a][k] += 1; A[k][a] += 1; } if (b >= 0) { A[b][k] -= 1; A[k][b] -= 1; } z[k] = e.v; e._k = k; k++; }
        });
        // กำจัดแบบเกาส์เลือกตัวหลัก
        for (let c = 0; c < K; c++) {
            let p = c;
            for (let r = c + 1; r < K; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
            if (Math.abs(A[p][c]) < 1e-30) continue;
            [A[c], A[p]] = [A[p], A[c]]; [z[c], z[p]] = [z[p], z[c]];
            for (let r = 0; r < K; r++) {
                if (r === c) continue;
                const f = A[r][c] / A[c][c];
                if (!f) continue;
                for (let j = c; j < K; j++) A[r][j] -= f * A[c][j];
                z[r] -= f * z[c];
            }
        }
        const x = z.map((v, i) => (Math.abs(A[i][i]) > 1e-30 ? v / A[i][i] : 0));
        return { v: n => (n === 'gnd' || !idx.has(n) ? 0 : x[idx.get(n)]), i: e => x[e._k] || 0 };
    }

    /* ไดโอดแบบช่วง: นำ (Vf + rs) / ไม่นำ / พังทลายย้อนกลับ (Vz + rs) ลองสถานะแล้วแก้วงจรซ้ำจนสถานะไม่เปลี่ยน */
    function solveNL(elems) {
        const ds = elems.filter(e => e.t === 'D');
        if (!ds.length) return solve(elems);
        ds.forEach(d => { d.st = 'off'; });
        let sol = null;
        for (let it = 0; it < 40; it++) {
            const lin = []; let k = 0;
            elems.forEach(e => {
                if (e.t !== 'D') { lin.push(e); return; }
                const m = 'dx' + (k++);
                if (e.st === 'on') lin.push(V(m, e.b, e.vf), R(e.a, m, e.rs));
                else if (e.st === 'bd') lin.push(V(m, e.a, e.vz), R(e.b, m, e.rs));
                else lin.push(R(e.a, e.b, 1e10));
            });
            sol = solve(lin);
            let changed = false;
            ds.forEach(e => {
                const vd = sol.v(e.a) - sol.v(e.b);
                let ns = e.st;
                if (e.st === 'on') { if (vd < e.vf) ns = 'off'; }
                else if (e.st === 'bd') { if (-vd < e.vz) ns = 'off'; }
                else if (vd > e.vf + 1e-6) ns = 'on';
                else if (e.vz && -vd > e.vz + 1e-6) ns = 'bd';
                if (ns !== e.st) { e.st = ns; changed = true; }
            });
            if (!changed) break;
        }
        return sol;
    }

    /* ---------- กติกาการอ่านมิเตอร์เข็ม (ตารางที่ 2.1–2.4) ---------- */
    const AITEM = id => M.ASEL.find(a => a[0] === id) || M.ASEL[0];
    const DITEM = id => M.DSEL.find(a => a[0] === id) || M.DSEL[0];
    function aRange(id) {
        const it = AITEM(id), g = it[3];
        if (g === 'dcv') return { g, r: +id.slice(3), label: `DCV ${it[2]} V` };
        if (g === 'acv') return { g, r: +id.slice(3), label: `ACV ${it[2]} V` };
        if (g === 'dca') return { g, r: +id.slice(2) / 1000, label: `DCmA ${it[2]} mA` };
        if (g === 'ohm') return { g, r: { x1: 1, x10: 10, x100: 100, x1k: 1000, x10k: 10000 }[id], label: `Ω ${it[2]}` };
        return { g: 'off', r: 0, label: 'OFF' };
    }
    // แถวที่อ่าน ตัวคูณ หน่วย
    function aRule(id) {
        const a = aRange(id);
        if (a.g === 'dcv') { const [full, mul] = M.DCV[a.r]; return { row: String(full), full, mul, unit: 'V', rowName: `0–${full}` }; }
        if (a.g === 'acv') {
            if (a.r === 10) return { row: 'ac10', full: 10, mul: 1, unit: 'V', rowName: 'สีแดง AC10V' };
            const full = a.r === 1000 ? 10 : a.r; return { row: String(full), full, mul: a.r === 1000 ? 100 : 1, unit: 'V', rowName: `0–${full}` };
        }
        if (a.g === 'dca') { const mul = { 0.0025: 0.01, 0.025: 0.1, 0.25: 1 }[a.r]; return { row: '250', full: 250, mul, unit: 'mA', rowName: '0–250' }; }
        if (a.g === 'ohm') return { row: 'ohm', full: 0, mul: a.r, unit: 'Ω', rowName: 'สเกลโอห์ม (บนสุด)' };
        return null;
    }
    const mulText = m => (m === 1 ? 'อ่านได้เลย' : `แล้วคูณ ${m}`);
    function ruleText(id) {
        const a = aRange(id), u = aRule(id);
        if (!u) return 'ปุ่มอยู่ที่ OFF ยังไม่ได้เลือกย่าน';
        if (id === 'dcv0.1') return `ย่าน DCV 0.1 V (ตำแหน่งเดียวกับ 50 µA) อ่านแถว <b>0–10</b> แล้วคูณ 0.01 (ถ้าวัดกระแส อ่านแถว 0–50 หน่วย µA)`;
        if (a.g === 'ohm') return `ย่าน ${a.label} อ่าน<b>สเกลโอห์มแถวบนสุด</b> (0 อยู่ขวา) แล้วคูณ ${a.r}`;
        return `ย่าน ${a.label} อ่านแถว <b>${u.rowName}</b> ${mulText(u.mul)} ได้หน่วย ${u.unit}`;
    }

    /* ---------- รูปแบบตัวเลขบนจอมิเตอร์ดิจิทัล ---------- */
    const DF = {
        v200m: [1e3, 1, 'mV'], v2000m: [1e3, 0, 'mV'], v20: [1, 2, 'V'], v200: [1, 1, 'V'], v1000: [1, 0, 'V', 1000],
        acv200: [1, 1, 'V'], acv750: [1, 0, 'V', 750],
        a200u: [1e6, 1, 'µA'], a2000u: [1e6, 0, 'µA'], a20m: [1e3, 2, 'mA'], a200m: [1e3, 1, 'mA'], a10: [1, 2, 'A', 10],
        o200: [1, 1, 'Ω'], o2000: [1, 0, 'Ω'], o20k: [1e-3, 2, 'kΩ'], o200k: [1e-3, 1, 'kΩ'], o2000k: [1e-3, 0, 'kΩ'], diode: [1e3, 0, 'mV']
    };
    function fmtD(x, sel) {
        const f = DF[sel];
        if (!f) return sel === 'hfe' ? '000' : '';
        const v = x * f[0], d = f[1];
        const counts = Math.round(Math.abs(v) * Math.pow(10, d));
        if (counts > 1999 || (f[3] && Math.abs(v) > f[3] + 1e-9)) return (v < 0 ? '-' : '') + '1   ';
        let s = (counts / Math.pow(10, d)).toFixed(d);
        if (d === 0) s = s.padStart(3, '0');
        return (v < 0 && counts > 0 ? '-' : '') + s;
    }

    /* ---------- ต่อสายวัด: หาโนดที่ปลายสายแตะ ---------- */
    const tipsTouch = () => { const a = S.leads.red, b = S.leads.black; return !a.tp && !b.tp && Math.hypot(a.tip[0] - b.tip[0], a.tip[1] - b.tip[1]) < 38; };
    function leadNode(c) {
        const L = S.leads[c];
        if (L.tp) { const t = fxTP(L.tp); return t ? t.node : 'air_' + c; }
        if (tipsTouch()) return 'tt';
        return 'air_' + c;
    }
    const leadIn = jack => ['red', 'black'].find(c => S.leads[c].jack === jack) || null;
    const onFixture = c => !!S.leads[c].tp;

    /* ---------- คำนวณสิ่งที่มิเตอร์แสดง ---------- */
    let OUT = { frac: 0, disp: '', warns: [], led: false, lampP: 0, psuI: 0, q: 0, conn: false };
    function compute() {
        const fx = FX[S.fx], base = fx.elems(), ac = !!fx.ac;
        const o = { frac: 0, disp: '', warns: [], led: false, lampP: 0, psuI: 0, q: 0, conn: false, jitter: false };
        const W = (t, cls) => o.warns.push({ t, cls: cls || 'bad' });
        const m = S.meter;
        const comL = leadIn('com');
        const posJack = m === 'analog' ? 'pos' : (leadIn('a10') && !leadIn('vma') ? 'a10' : 'vma');
        const posL = leadIn(posJack), a10L = m === 'dmm' ? leadIn('a10') : null;
        const N = comL ? leadNode(comL) : null, P = posL ? leadNode(posL) : null;
        o.conn = !!(N && P);
        // แรงดันเปิดวงจรระหว่างปลายสาย (ไม่มีมิเตอร์)
        const s0 = solveNL(base.slice());
        const voc = (o.conn && onFixture(comL) && onFixture(posL)) ? s0.v(P) - s0.v(N) : 0;
        const hot = Math.abs(voc) > 0.05;
        let me = [], read = () => 0;
        if (m === 'analog') {
            const id = S.sel.analog, a = aRange(id);
            if (leadIn('out')) W('ขั้ว OUTPUT ใช้วัดสัญญาณเสียง (dB) ให้ย้ายสายแดงไปเสียบขั้ว +', 'warn');
            if (!S.fuse.analog) { W('ฟิวส์ในมิเตอร์ขาด เข็มไม่ขยับ กดปุ่ม "เปลี่ยนฟิวส์"'); }
            else if (o.conn && a.g !== 'off') {
                if (a.g === 'dcv') { const Rm = 20000 * a.r; me = [R(P, N, Rm)]; read = s => (ac ? 0 : (s.v(P) - s.v(N)) / a.r); if (ac && hot) { W('นี่คือไฟสลับ ย่าน DCV วัดไม่ได้ เข็มสั่นอยู่ที่ 0 ให้ใช้ย่าน ACV', 'warn'); o.jitter = true; } }
                if (a.g === 'acv') { const Rm = 9000 * a.r; me = [R(P, N, Rm)]; read = s => { if (!ac) return 0; const v = Math.abs(s.v(P) - s.v(N)); return a.r === 10 ? M.ac10F(v) : v / a.r; }; if (!ac && hot) W('นี่คือไฟตรง ย่าน ACV เข็มไม่ขึ้น ให้ใช้ย่าน DCV', 'warn'); }
                if (a.g === 'dca') {
                    const Rm = { 0.0025: 40, 0.025: 4, 0.25: 0.4 }[a.r]; me = [R(P, N, Rm)];
                    read = s => (ac ? 0 : (s.v(P) - s.v(N)) / Rm / a.r);
                }
                if (a.g === 'ohm') {
                    const Vb = a.r === 10000 ? 9 : 3, Ri = 20 * a.r, k = (KR[id] || 1) + S.adjDeg / 600;
                    me = [V('om_', P, Vb), R('om_', N, Ri)];
                    read = s => (s.v('om_') - s.v(N)) / Ri / (Vb / Ri) * k;
                    if (hot) W('ห้ามวัดความต้านทานขณะวงจรมีไฟ ปิดสวิตช์หรือถอดแหล่งจ่ายออกก่อน');
                }
            }
            if (S.sel.analog === 'dcv0.1' && o.conn) { me = [R(P, N, 2000)]; read = s => (ac ? 0 : (s.v(P) - s.v(N)) / 0.1); }
        } else {
            const id = S.sel.dmm, it = DITEM(id), g = it[3];
            const P10 = a10L ? leadNode(a10L) : null;
            if (a10L && N) me.push(R(P10, N, 0.01));   // ขั้ว 10A ต่อผ่านชันต์ไปขั้ว COM ตลอด
            const Pv = leadIn('vma') ? leadNode(leadIn('vma')) : null;
            const okV = Pv && N;
            if (g === 'off') { o.disp = ''; }
            else if (g === 'dcv') { if (okV) me.push(R(Pv, N, 1e7)); read = s => (okV && !ac ? s.v(Pv) - s.v(N) : 0); if (ac && hot) W('นี่คือไฟสลับ ให้หมุนไปที่ V~ (ACV)', 'warn'); }
            else if (g === 'acv') { if (okV) me.push(R(Pv, N, 1e6)); read = s => (okV && ac ? Math.abs(s.v(Pv) - s.v(N)) : 0); if (!ac && hot) W('นี่คือไฟตรง ให้หมุนไปที่ V⎓ (DCV)', 'warn'); }
            else if (g === 'dca') {
                const Rm = { a200u: 1000, a2000u: 100, a20m: 10, a200m: 0.4 }[id];
                if (okV && S.fuse.dmm) me.push(R(Pv, N, Rm));
                read = s => (okV && S.fuse.dmm && !ac ? (s.v(Pv) - s.v(N)) / Rm : 0);
                if (!S.fuse.dmm) W('ฟิวส์ 200 mA ในมิเตอร์ขาด ย่านกระแส mA อ่านค่าไม่ได้ กดปุ่ม "เปลี่ยนฟิวส์"');
                if (a10L && !leadIn('vma')) W('ย่าน mA ต้องเสียบสายแดงที่ขั้ว VΩmA', 'warn');
            }
            else if (g === 'a10') {
                read = s => (P10 && N ? (s.v(P10) - s.v(N)) / 0.01 : 0);
                if (!a10L && leadIn('vma')) W('ย่าน 10A ต้องย้ายสายแดงไปเสียบขั้ว 10A', 'warn');
            }
            else if (g === 'ohm' || g === 'diode') {
                // วงจรวัดในเครื่อง: แรงดันเปิดวงจร 2.8 V ผ่าน 2.8 kΩ ขั้วบวกออกที่สายแดง (VΩmA)
                if (okV) me.push(V('dm_', N, 2.8), R('dm_', Pv, 2800));
                read = s => {
                    if (!okV) return g === 'diode' ? 9 : 1e12;
                    const v = s.v(Pv) - s.v(N);
                    if (g === 'diode') return v;
                    const i = (2.8 - v) / 2800;
                    return i > 1e-11 ? v / i : 1e12;
                };
                if (hot) W('ห้ามวัดความต้านทานขณะวงจรมีไฟ ค่าที่เห็นเชื่อไม่ได้');
            }
            o.dg = g;
        }
        const s1 = solveNL(base.concat(me));
        let q = read(s1);
        o.q = q;
        // ผลต่อวงจร: หลอดไฟ แหล่งจ่าย
        if (S.fx === 'lamp') { const Rl = S.lampBig ? 11.99 : 39.6, il = (s1.v('s') - s1.v('l')) / Rl; o.lampP = il * il * Rl; }
        if (S.fx === 'psu') { const ip = (s1.v('pp') - s1.v('pi')) / 0.05; o.psuI = ip; }
        if (m === 'analog') {
            const id = S.sel.analog, a = aRange(id);
            let f = S.fuse.analog ? q : 0;
            // กระแสผ่านมิเตอร์มากเกินไป ฟิวส์ขาด
            if (S.fuse.analog && o.conn && a.g === 'dca') { const I0 = q * a.r; if (Math.abs(I0) > 0.5) blow('analog', 'กระแสไหลผ่านมิเตอร์มากเกิน ฟิวส์ขาด! ย่านกระแสต้องต่ออนุกรม ห้ามแตะคร่อมแหล่งจ่าย'); }
            if (S.fuse.analog && o.conn && a.g === 'ohm' && Math.abs(voc) > 30) blow('analog', 'ใช้ย่าน Ω วัดไฟแรงสูง ฟิวส์ขาด!');
            if (!S.fuse.analog) f = 0;
            o.led = a.g === 'ohm' && a.r === 1 && f > 0.9;
            if (a.g === 'ohm' && o.conn && f > 1.008) W('เข็มเลยขีด 0 Ω ไปทางขวา หมุนปุ่ม 0Ω ADJ ลดลงเล็กน้อย', 'warn');
            if (a.g !== 'ohm' && f > 1.02) W(`เกินย่าน! เข็มตีเลยสเกล มิเตอร์อาจเสีย ให้หมุนไปย่านที่สูงกว่านี้`);
            if (f < -0.02) W('เข็มตีกลับไปทางซ้าย = ต่อสายกลับขั้ว ให้สลับสายแดงกับสายดำ');
            o.frac = f + zoff();
            if (a.g === 'dca' && o.conn && hot && S.fuse.analog && Math.abs(q * a.r) <= 0.5 && Math.abs(q) > 2) { /* แจ้งไว้แล้ว */ }
        } else {
            const id = S.sel.dmm, g = o.dg;
            if (g === 'dca' && S.fuse.dmm && Math.abs(q) > 0.2) { blow('dmm', 'กระแสเกิน 200 mA ฟิวส์ในมิเตอร์ขาด! กระแสสูงต้องย้ายสายแดงไปขั้ว 10A และหมุนไปที่ 10A'); q = 0; }
            if (a10L && N && g !== 'a10' && Math.abs(s1.v(leadNode(a10L)) - s1.v(N)) / 0.01 > 1) W('สายแดงเสียบขั้ว 10A อยู่ ขั้วนี้ต่อตรงเข้า COM ถ้าแตะวัดแรงดันจะเป็นการลัดวงจร!');
            if (g === 'a10' && Math.abs(q) > 10) W('กระแสเกิน 10 A อันตราย!');
            o.disp = g === 'off' ? '' : (g === 'hfe' ? hfeDisp() : fmtD(q, id));
            if (o.disp.trim().endsWith('1') && o.disp.includes('   ') && (g === 'dcv' || g === 'acv' || g === 'dca' || g === 'a10')) W('จอขึ้นเลข 1 ทางซ้าย = เกินย่าน ให้หมุนไปย่านที่สูงกว่า', 'warn');
            if (o.disp[0] === '-' && !o.disp.includes('1   ')) W('จอขึ้นเครื่องหมาย − แปลว่าต่อสายกลับขั้ว (ค่ายังใช้ได้)', 'info');
        }
        dangerCheck(voc, o);
        OUT = o;
        return o;
    }
    function blow(m, msg) {
        S.fuse[m] = false;
        flash(msg);
    }
    // ไฟบ้าน: ตั้งย่านผิดแล้วแตะ = อันตราย
    function dangerCheck(voc, o) {
        if (!FX[S.fx].ac || !S.breaker || Math.abs(voc) < 100 || S.danger) return;
        if (S.meter === 'analog') {
            const a = aRange(S.sel.analog);
            if (a.g === 'ohm' || a.g === 'dca') setDanger(`ตั้งย่าน ${a.label} แล้วแตะไฟบ้าน 220 V`, 'กระแสไหลผ่านมิเตอร์มหาศาล ฟิวส์ขาด มิเตอร์อาจไหม้และเกิดประกายไฟใส่มือ ไฟบ้านต้องใช้ย่าน ACV 250 V');
            else if (a.g === 'acv' && a.r < 250) setDanger(`ตั้งย่าน ${a.label} ต่ำกว่า 220 V`, 'เข็มตีเลยสเกลอย่างแรง มิเตอร์เสียหายได้ ไฟบ้านต้องใช้ย่าน ACV 250 V');
        } else {
            const g = DITEM(S.sel.dmm)[3];
            if (['ohm', 'dca', 'a10', 'diode', 'hfe'].includes(g) || (leadIn('a10'))) setDanger('ตั้งมิเตอร์ดิจิทัลผิดย่านแล้วแตะไฟบ้าน', 'ย่านโอห์มและย่านกระแสทนไฟบ้านไม่ได้ ฟิวส์ขาดหรือมิเตอร์ไหม้ ไฟบ้านต้องใช้ V~ 750');
        }
    }
    function setDanger(title, msg) {
        S.danger = { title, msg };
        S.fuse.analog = S.meter === 'analog' ? false : S.fuse.analog;
        S.fuse.dmm = S.meter === 'dmm' ? false : S.fuse.dmm;
    }

    /* ---------- วาดโต๊ะ ---------- */
    const svg = $('#bench');
    let VB = { x: 0, y: 60, w: 2000, h: 1120 };
    svg.innerHTML = `<defs>
            <clipPath id="mirClip"><path clip-rule="evenodd" d="M19 660 a481 481 0 1 0 962 0 a481 481 0 1 0 -962 0 Z M41 660 a459 459 0 1 0 918 0 a459 459 0 1 0 -918 0 Z"/></clipPath>
            <pattern id="vlMat" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#dfe8dc"/><path d="M40 0 H0 V40" fill="none" stroke="#cfdacb" stroke-width="2"/></pattern>
        </defs>
        <rect x="-4000" y="-4000" width="10000" height="10000" fill="#c9d3c5"/>
        <rect x="0" y="60" width="2000" height="1120" rx="30" fill="url(#vlMat)"/>
        <g id="gFx"></g><g id="gTP"></g><g id="gMeter"></g><g id="gDyn"></g><g id="gLeads"></g>`;
    const gFx = $('#gFx'), gTP = $('#gTP'), gMeter = $('#gMeter'), gDyn = $('#gDyn'), gLeads = $('#gLeads');
    function setVB() { svg.setAttribute('viewBox', `${r1(VB.x)} ${r1(VB.y)} ${r1(VB.w)} ${r1(VB.h)}`); }
    function drawMeterStatic() {
        const t = MT[S.meter];
        gMeter.setAttribute('transform', `translate(${t.tx} ${t.ty}) scale(${t.s})`);
        gDyn.setAttribute('transform', `translate(${t.tx} ${t.ty}) scale(${t.s})`);
        gMeter.innerHTML = S.meter === 'analog' ? M.analogBody({}) : M.dmmBody({});
    }
    let needlePos = 0, needleVel = 0;
    function needleMarkup() {
        const a = M.ang(clamp(needlePos, -0.06, 1.06)), off = S.oblique ? 1.4 : 0;
        return `<g transform="${M.FACE_T}" data-part="3">
            <g clip-path="url(#mirClip)"><path id="ndlRef" d="M500 660 L500 110" stroke="#2b2b2b" stroke-width="4" opacity="${S.oblique ? 0.6 : 0}" transform="rotate(${a - off} 500 660)"/></g>
            <g id="ndlWrap" transform="rotate(${off} 500 660)">${M.needle(clamp(needlePos, -0.06, 1.06), { id: 'ndl' })}</g>
            <path id="ndlHit" d="M500 640 L500 130" stroke="transparent" stroke-width="40" transform="rotate(${a} 500 660)"/>
            ${M.PIVOT}</g>`;
    }
    function drawDyn() {
        if (S.meter === 'analog') {
            gDyn.innerHTML = M.analogScrew(S.screw) + M.analogAdj(S.adjDeg) + M.analogKnob(S.sel.analog) + needleMarkup();
        } else {
            gDyn.innerHTML = M.dmmLCD(OUT.disp) + M.dmmKnob(S.sel.dmm);
        }
        // เน้นแถวสเกล + ไฟ LED
        const cls = [];
        if (S.meter === 'analog' && S.helper) { const u = aRule(S.sel.analog); if (u) cls.push('hl-' + u.row); }
        if (OUT.led) cls.push('led-on');
        gMeter.setAttribute('class', cls.join(' '));
    }
    function drawFx() {
        gFx.innerHTML = FX[S.fx].draw(OUT);
        gTP.innerHTML = FX[S.fx].tps.map(t => (t.mark === false ? '' : `<g><circle cx="${t.x}" cy="${t.y}" r="15" fill="#d5d9dc" stroke="#6d7378" stroke-width="3"/><path d="M${t.x - 8} ${t.y} H${t.x + 8} M${t.x} ${t.y - 8} V${t.y + 8}" stroke="#6d7378" stroke-width="3"/></g>`)).join('');
    }
    // หัววัด: ปลายแหลมอยู่ที่ (x, y) ตัวด้ามเอียงลงล่าง
    const PROBE_ANG = { red: -12, black: 12 };
    function probeEnd(c) { const L = S.leads[c], a = rad(PROBE_ANG[c]); return [L.tip[0] - 262 * Math.sin(a), L.tip[1] + 262 * Math.cos(a)]; }
    function plugPos(c) { const L = S.leads[c]; return L.jack ? toW(S.meter, JACKS[S.meter][L.jack]) : L.plug; }
    let hoverTP = null;
    function drawLeads() {
        let s = '';
        ['black', 'red'].forEach(c => {
            const L = S.leads[c], col = c === 'red' ? '#d32f2f' : '#222', dark = c === 'red' ? '#7f1010' : '#000';
            const [px, py] = plugPos(c), [ex, ey] = probeEnd(c);
            const sx = px, sy = py + 64;
            const a = rad(PROBE_ANG[c]);
            const d = `M${r1(sx)} ${r1(sy)} C${r1(sx)} ${r1(sy + 190)}, ${r1(ex - 170 * Math.sin(a))} ${r1(ey + 170 * Math.cos(a))}, ${r1(ex)} ${r1(ey)}`;
            s += `<path d="${d}" fill="none" stroke="${dark}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"/>`;
            // ปลั๊ก
            s += `<g data-drag="plug" data-lead="${c}" style="cursor:grab"><rect x="${r1(px - 17)}" y="${r1(py - 4)}" width="34" height="70" rx="9" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <circle cx="${r1(px)}" cy="${r1(py)}" r="${L.jack ? 18 : 15}" fill="${col}" stroke="${dark}" stroke-width="3"/><circle cx="${r1(px)}" cy="${r1(py)}" r="6" fill="${L.jack ? '#000' : '#c9ced3'}"/></g>`;
            // หัววัด
            const [tx, ty] = L.tip;
            s += `<g data-drag="tip" data-lead="${c}" style="cursor:grab" transform="translate(${r1(tx)} ${r1(ty)}) rotate(${PROBE_ANG[c]})">
                  <path d="M-3 0 L3 0 L4 46 L-4 46 Z" fill="#c9ced3" stroke="#7a8288" stroke-width="1.5"/>
                  <rect x="-22" y="44" width="44" height="16" rx="7" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <rect x="-15" y="58" width="30" height="176" rx="12" fill="${col}" stroke="${dark}" stroke-width="2"/>
                  <path d="M-15 90 H15 M-15 104 H15 M-15 118 H15" stroke="${dark}" stroke-width="2" opacity=".5"/>
                  <rect x="-8" y="232" width="16" height="32" rx="5" fill="${dark}"/>
                  <circle cx="0" cy="0" r="30" fill="transparent"/></g>`;
        });
        if (hoverTP) { const t = fxTP(hoverTP); if (t) s += `<circle cx="${t.x}" cy="${t.y}" r="30" fill="none" stroke="#00878f" stroke-width="5" stroke-dasharray="8 6"/>`; }
        gLeads.innerHTML = s;
    }

    /* ---------- เข็มเคลื่อนแบบสปริง ---------- */
    let lastT = 0;
    function tick(t) {
        const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
        if (S.meter === 'analog') {
            let target = clamp(OUT.frac, -0.06, 1.06);
            if (OUT.jitter) target += (Math.random() - 0.5) * 0.01;
            const acc = 160 * (target - needlePos) - 17 * needleVel;
            needleVel += acc * dt; needlePos += needleVel * dt;
            if (needlePos > 1.06) { needlePos = 1.06; needleVel = -Math.abs(needleVel) * 0.3; }
            if (needlePos < -0.06) { needlePos = -0.06; needleVel = Math.abs(needleVel) * 0.3; }
            const a = M.ang(needlePos), off = S.oblique ? 1.4 : 0;
            const n = document.getElementById('ndl');
            if (n) {
                n.setAttribute('transform', `rotate(${a.toFixed(3)} 500 660)`);
                const rf = document.getElementById('ndlRef'); if (rf) rf.setAttribute('transform', `rotate(${(a - off).toFixed(3)} 500 660)`);
                const h = document.getElementById('ndlHit'); if (h) h.setAttribute('transform', `rotate(${a.toFixed(3)} 500 660)`);
            }
        }
        requestAnimationFrame(tick);
    }

    /* ---------- อัปเดตทั้งหมดหลังสถานะเปลี่ยน ---------- */
    function update(opts) {
        opts = opts || {};
        compute();
        logMeas();
        if (opts.fx !== false) drawFx();
        drawDyn();
        drawLeads();
        renderStatus();
        renderAlerts();
        checkMission();
        if (opts.table !== false) refreshTable();
    }

    /* ---------- ซูม / เลื่อน ---------- */
    function clientToWorld(cx, cy) {
        const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
        return p.matrixTransform(svg.getScreenCTM().inverse());
    }
    function zoomAt(f, wx, wy) {
        const nw = clamp(VB.w / f, 180, 2600), k = nw / VB.w;
        VB.x = wx - (wx - VB.x) * k; VB.y = wy - (wy - VB.y) * k; VB.w = nw; VB.h = VB.h * k;
        setVB();
        if (VB.w < 1100) S.zoomed = true;
        checkMission();
    }
    function fit() { VB = { x: WORLD.x, y: WORLD.y, w: WORLD.w, h: WORLD.h }; setVB(); }
    function animateTo(target) {
        const from = { ...VB }, t0 = performance.now();
        const step = now => {
            const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
            ['x', 'y', 'w', 'h'].forEach(p => { VB[p] = from[p] + (target[p] - from[p]) * e; });
            setVB();
            if (k < 1) requestAnimationFrame(step); else { S.zoomed = true; checkMission(); }
        };
        requestAnimationFrame(step);
    }
    function zoomFace() {
        const t = MT[S.meter];
        const r = S.meter === 'analog' ? [132, 46, 536, 372] : [150, 40, 460, 190];
        const x = t.tx + t.s * r[0], y = t.ty + t.s * r[1], w = t.s * r[2], h = t.s * r[3];
        const box = svg.getBoundingClientRect(), asp = box.width / box.height;
        let W = w * 1.06, H = h * 1.06;
        if (W / H < asp) W = H * asp; else H = W / asp;
        animateTo({ x: x + w / 2 - W / 2, y: y + h / 2 - H / 2, w: W, h: H });
    }

    /* ---------- เมาส์ / นิ้ว ---------- */
    const ptrs = new Map();
    let drag = null, pinch = null;
    const angAt = (cx, cy, w) => (Math.atan2(w.x - cx, cy - w.y) * 180 / Math.PI + 360) % 360;
    const knobCenter = () => toW(S.meter, S.meter === 'analog' ? [M.AK.cx, M.AK.cy] : [M.DK.cx, M.DK.cy]);
    function nearestSel(deg) {
        const list = S.meter === 'analog' ? M.ASEL : M.DSEL;
        let best = list[0], bd = 999;
        list.forEach(it => { const d = Math.abs(((deg - it[1]) % 360 + 540) % 360 - 180); if (d < bd) { bd = d; best = it; } });
        return best[0];
    }
    function setSel(id) {
        if (S.sel[S.meter] === id) return;
        if (FX[S.fx].ac && S.breaker && onFixture('red') && onFixture('black')) flash('ห้ามหมุนเปลี่ยนย่านขณะปลายสายแตะไฟบ้าน ให้ยกสายออกก่อน');
        S.sel[S.meter] = id;
        update({ fx: S.fx === 'lamp' || S.fx === 'psu' });
    }
    svg.addEventListener('pointerdown', e => {
        svg.setPointerCapture(e.pointerId);
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size === 2) {
            const [a, b] = [...ptrs.values()];
            pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), vb: { ...VB } };
            drag = null; return;
        }
        const w = clientToWorld(e.clientX, e.clientY);
        const t = e.target.closest('[data-drag],[data-click],[data-sel],[data-part],[data-jack]');
        drag = { kind: 'pan', x0: e.clientX, y0: e.clientY, w0: w, vb: { ...VB }, moved: false, el: t };
        if (t && t.dataset.drag) {
            drag.kind = t.dataset.drag; drag.lead = t.dataset.lead;
            if (drag.kind === 'knob') { const [cx, cy] = knobCenter(); drag.c = [cx, cy]; }
            if (drag.kind === 'screw') { drag.c = toW('analog', M.AK.screw); drag.a0 = angAt(...drag.c, w); drag.v0 = S.screw; }
            if (drag.kind === 'adj') { drag.c = toW('analog', M.AK.adj); drag.a0 = angAt(...drag.c, w); drag.v0 = S.adjDeg; }
            if (drag.kind === 'psuknob') { drag.c = [1660, 520]; drag.a0 = angAt(...drag.c, w); drag.v0 = S.psuV; }
            if (drag.kind === 'tip') { const L = S.leads[drag.lead]; drag.off = [L.tip[0] - w.x, L.tip[1] - w.y]; }
            if (drag.kind === 'plug') { const p = plugPos(drag.lead); drag.off = [p[0] - w.x, p[1] - w.y]; }
        }
        e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && ptrs.size === 2) {
            const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
            const mid = clientToWorld((a.x + b.x) / 2, (a.y + b.y) / 2);
            zoomAt(d / pinch.d, mid.x, mid.y); pinch.d = d; return;
        }
        if (!drag) return;
        if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 4) drag.moved = true;
        if (!drag.moved) return;
        const w = clientToWorld(e.clientX, e.clientY);
        const dang = (c, a0) => { let d = angAt(c[0], c[1], w) - a0; if (d > 180) d -= 360; if (d < -180) d += 360; return d; };
        switch (drag.kind) {
            case 'pan': {
                const box = svg.getBoundingClientRect(), k = Math.max(drag.vb.w / box.width, drag.vb.h / box.height);
                VB.x = drag.vb.x - (e.clientX - drag.x0) * k; VB.y = drag.vb.y - (e.clientY - drag.y0) * k; setVB(); break;
            }
            case 'knob': setSel(nearestSel(angAt(drag.c[0], drag.c[1], w))); break;
            case 'screw': { let d = dang(drag.c, drag.a0); S.screw = clamp(drag.v0 + d, -100, 100); if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.screw; } update({ fx: false, table: false }); break; }
            case 'adj': { let d = dang(drag.c, drag.a0); S.adjDeg = clamp(drag.v0 + d, -90, 120); if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.adjDeg; } update({ fx: false, table: false }); break; }
            case 'psuknob': { let d = dang(drag.c, drag.a0); S.psuV = Math.round(clamp(drag.v0 + d / 10, 0, 30) * 10) / 10; if (Math.abs(d) > 150) { drag.a0 = angAt(...drag.c, w); drag.v0 = S.psuV; } update(); break; }
            case 'tip': {
                const L = S.leads[drag.lead];
                L.tip = [w.x + drag.off[0], w.y + drag.off[1]];
                const near = FX[S.fx].tps.map(t => [t, Math.hypot(t.x - L.tip[0], t.y - L.tip[1])]).filter(x => x[1] < 46).sort((a, b) => a[1] - b[1])[0];
                L.tp = near ? near[0].id : null; hoverTP = L.tp;
                update({ fx: S.fx === 'lamp' || S.fx === 'psu', table: false }); break;
            }
            case 'plug': {
                const L = S.leads[drag.lead];
                L.jack = null; L.plug = [w.x + drag.off[0], w.y + drag.off[1]];
                update({ fx: false, table: false }); break;
            }
        }
    });
    function endPtr(e) {
        if (!ptrs.has(e.pointerId)) return;
        ptrs.delete(e.pointerId);
        if (pinch) { if (ptrs.size < 2) pinch = null; return; }
        if (!drag) return;
        const d = drag; drag = null; hoverTP = null;
        if (!d.moved) { onClick(d.el); return; }
        if (d.kind === 'tip') {
            const L = S.leads[d.lead];
            if (L.tp) { const t = fxTP(L.tp); L.tip = [t.x, t.y]; }
            else {
                const o = S.leads[d.lead === 'red' ? 'black' : 'red'];
                if (!o.tp && Math.hypot(o.tip[0] - L.tip[0], o.tip[1] - L.tip[1]) < 60) L.tip = [o.tip[0] + 8, o.tip[1] + 4];
            }
            update();
        }
        if (d.kind === 'plug') {
            const L = S.leads[d.lead], J = JACKS[S.meter];
            const other = S.leads[d.lead === 'red' ? 'black' : 'red'].jack;
            const near = Object.keys(J).filter(j => j !== other).map(j => [j, Math.hypot(toW(S.meter, J[j])[0] - L.plug[0], toW(S.meter, J[j])[1] - L.plug[1])]).filter(x => x[1] < 60).sort((a, b) => a[1] - b[1])[0];
            if (near) L.jack = near[0];
            update();
        }
        if (d.kind === 'knob' || d.kind === 'screw' || d.kind === 'adj') update();
    }
    svg.addEventListener('pointerup', endPtr);
    svg.addEventListener('pointercancel', endPtr);
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        const w = clientToWorld(e.clientX, e.clientY);
        zoomAt(Math.pow(1.0015, -e.deltaY), w.x, w.y);
    }, { passive: false });
    svg.addEventListener('keydown', e => {
        const list = S.meter === 'analog' ? M.ASEL : M.DSEL;
        const i = list.findIndex(x => x[0] === S.sel[S.meter]);
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setSel(list[(i + 1) % list.length][0]); e.preventDefault(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setSel(list[(i - 1 + list.length) % list.length][0]); e.preventDefault(); }
        if (e.key === '+' || e.key === '=') zoomAt(1.25, VB.x + VB.w / 2, VB.y + VB.h / 2);
        if (e.key === '-') zoomAt(0.8, VB.x + VB.w / 2, VB.y + VB.h / 2);
    });
    function onClick(el) {
        if (!el) return;
        if (el.dataset.sel) { setSel(el.dataset.sel); return; }
        const c = el.dataset.click;
        if (!c) return;
        if (c.startsWith('pick')) { S.cur = +c.slice(4); S.sock = null; S.flip = false; }
        if (c === 'sockN' || c === 'sockP') {
            S.sock = c === 'sockN' ? 'npn' : 'pnp';
            ['red', 'black'].forEach(k => { const L = S.leads[k]; if (L.tp) { L.tp = null; L.tip = REST[k].tip.slice(); } });
        }
        if (c === 'flip') S.flip = !S.flip;
        if (c === 'unsock') { S.sock = null; S.flip = false; }
        if (c === 'reveal') { const show = !S.bank.some(t => t.show === 'all' && t.show0 !== 'all'); S.bank.forEach(t => { t.show = show ? 'all' : t.show0; }); }
        update();
    }

    /* ---------- ข้อความบอกสถานะใต้โต๊ะ ---------- */
    function leadText(c) {
        const L = S.leads[c], nm = c === 'red' ? 'สายแดง' : 'สายดำ';
        if (!L.jack) return `${nm}: ยังไม่ได้เสียบที่มิเตอร์`;
        let where = 'ปลายสายลอยอยู่';
        if (L.tp) where = 'แตะ' + fxTP(L.tp).lab;
        else if (tipsTouch()) where = 'แตะกับปลายสายอีกเส้น';
        return `${nm} (ขั้ว ${JNAME[L.jack]}): ${where}`;
    }
    function rangeText() {
        if (S.meter === 'analog') return 'ย่าน ' + aRange(S.sel.analog).label;
        const it = DITEM(S.sel.dmm), g = it[3];
        const G = { off: 'OFF', dcv: 'V⎓ (DCV)', acv: 'V~ (ACV)', dca: 'A⎓ (DCA)', a10: '10A', hfe: 'hFE', diode: 'ไดโอด', ohm: 'Ω' };
        return `ย่าน ${G[g]} ${g === 'off' ? '' : it[2]}`;
    }
    function renderStatus() {
        $('#status').innerHTML = `<b>${S.meter === 'analog' ? 'มิเตอร์เข็ม' : 'มิเตอร์ดิจิทัล'}</b> · ${rangeText()}<br>${leadText('red')}<br>${leadText('black')}`;
        $('#howto').innerHTML = S.helper ? (S.meter === 'analog' ? ruleText(S.sel.analog) : dmmRule()) : '';
        $('#howto').hidden = !S.helper;
        $('#fuseBtn').hidden = S.fuse.analog && S.fuse.dmm;
        $('#btnHelp').classList.toggle('on', S.helper);
        $('#btnObl').classList.toggle('on', S.oblique);
        $('#btnObl').hidden = S.meter !== 'analog';
        const dz = $('#danger');
        dz.hidden = !S.danger;
        if (S.danger) { dz.querySelector('h3').textContent = S.danger.title; dz.querySelector('p').textContent = S.danger.msg; }
    }
    function dmmRule() {
        const id = S.sel.dmm, f = DF[id];
        if (!f) return 'อ่านตัวเลขบนจอได้ทันที';
        const top = { 0: '1999', 1: '199.9', 2: '19.99' }[f[1]];
        return `ย่าน ${DITEM(id)[2]} อ่านตัวเลขบนจอได้ทันที หน่วย <b>${f[2]}</b> (ค่าสูงสุด ${f[3] || top}) ถ้าจอขึ้น 1 ทางซ้าย = เกินย่าน`;
    }
    let flashMsg = '', flashT = 0;
    function flash(m) { flashMsg = m; flashT = Date.now(); }
    function renderAlerts() {
        const box = $('#alerts');
        const list = OUT.warns.slice();
        if (flashMsg && Date.now() - flashT < 15000) list.unshift({ t: flashMsg, cls: 'bad' });
        if (S.oblique && S.meter === 'analog') list.push({ t: 'มองเฉียง: เห็นเข็มกับเงาในกระจกแยกกัน ค่าที่อ่านจะคลาด ให้ขยับตาจนเงาหายไปหลังเข็ม (กดปุ่ม "มองเฉียง" อีกครั้ง)', cls: 'warn' });
        const seen = new Set();
        box.innerHTML = list.filter(w => !seen.has(w.t) && seen.add(w.t)).map(w => `<p class="al ${w.cls}">${w.t}</p>`).join('');
    }

    /* ---------- ภารกิจ ---------- */
    const plugOK = (m) => (m === 'dmm' ? S.leads.red.jack === 'vma' && S.leads.black.jack === 'com' : S.leads.red.jack === 'pos' && S.leads.black.jack === 'com');
    const on = (c, ids) => [].concat(ids).includes(S.leads[c].tp);
    const both = (a, b) => (on('red', a) && on('black', b)) || (on('red', b) && on('black', a));
    const AN = S2 => S2.meter === 'analog';
    /* ---------- ชุดทรานซิสเตอร์ ---------- */
    const ORDERS = ['EBC', 'CBE', 'ECB', 'BCE'];
    const rnd = a => a[Math.floor(Math.random() * a.length)];
    const rndHfe = () => 120 + Math.floor(Math.random() * 20) * 10;
    const mk = (name, type, order, state, show) => ({ name, type, order, state: state || 'good', hfe: rndHfe(), show: show || 'none', show0: show || 'none' });
    const OHM_LOW = ['x1', 'x10', 'x100', 'x1k', 'x10k'];
    const AFTER_ZERO = () => tipsTouch() && Math.abs(OUT.frac - 1) < 0.006;
    const zeroStep = r => ({ t: `แตะปลายสายสองเส้นเข้าหากัน แล้วหมุนปุ่ม 0Ω ADJ จนเข็มชี้ 0 Ω พอดี (ย่าน ${r} ต้องปรับใหม่ทุกครั้ง)`, ok: AFTER_ZERO });
    const legOpts = () => ['ขา 1', 'ขา 2', 'ขา 3'];
    const baseHint = 'วางสายเส้นหนึ่งค้างที่ขาหนึ่ง แล้วใช้อีกเส้นแตะอีกสองขาทีละขา ถ้าเข็มขึ้นทั้งสองครั้ง ขาที่ค้างไว้คือเบส ถ้าไม่ใช่ ให้ย้ายขาหรือสลับสีสาย';
    // วัดหาเบสครบ: วัดรอยต่อทั้งสองแบบไบแอสตรงแล้ว (มิเตอร์เข็ม สายดำ = บวก)
    const foundBase = () => {
        const t = cur();
        return t.type === 'npn' ? measured(t, OHM_LOW, 'E', 'B') && measured(t, OHM_LOW, 'C', 'B')
            : measured(t, OHM_LOW, 'B', 'E') && measured(t, OHM_LOW, 'B', 'C');
    };
    const baseWhy = () => {
        const t = cur(), b = legOf(t, 'B');
        return t.type === 'npn'
            ? `ขา ${b} เป็นเบส: สายดำ (บวกของถ่านในมิเตอร์) แตะขา ${b} แล้วสายแดงแตะอีกสองขา เข็มขึ้นทั้งสองครั้ง เบสเป็นสาร P จึงเป็นชนิด NPN`
            : `ขา ${b} เป็นเบส: สายแดง (ลบของถ่านในมิเตอร์) แตะขา ${b} แล้วสายดำแตะอีกสองขา เข็มขึ้นทั้งสองครั้ง เบสเป็นสาร N จึงเป็นชนิด PNP`;
    };
    const ecWhy = () => {
        const t = cur(), e = legOf(t, 'E');
        return t.type === 'npn'
            ? `ขา ${e} เป็นอิมิตเตอร์: ครั้งที่เข็มขยับขึ้นเล็กน้อย สายดำ (บวก) อยู่ที่ขา E รอยต่อ BE ถูกไบแอสกลับจนพังทลายที่ราว 7 V ส่วนรอยต่อ BC ทนแรงดันได้สูงกว่ามาก เข็มจึงไม่ขยับเมื่อสลับสาย`
            : `ขา ${e} เป็นอิมิตเตอร์: ครั้งที่เข็มขยับขึ้นเล็กน้อย สายแดง (ลบ) อยู่ที่ขา E รอยต่อ BE ถูกไบแอสกลับจนพังทลายที่ราว 7 V ส่วนรอยต่อ BC ทนแรงดันได้สูงกว่ามาก`;
    };
    const STATE_OPTS = ['ดี', 'ขาด', 'ช็อต'];
    const STATE_IDX = { good: 0, open: 1, short: 2 };
    const stateWhy = i => () => {
        const t = S.bank[i];
        return { good: `${t.name} ดี: รอยต่อ BE และ BC นำกระแสทางเดียวทั้งคู่ และ C–E ไม่ต่อถึงกัน`, open: `${t.name} ขาด: วัด B–E แล้วเข็มไม่ขึ้นทั้งสองทาง (รอยต่อ BE ขาด)`, short: `${t.name} ช็อต: วัด C–E แล้วเข็มขึ้นเต็มสเกลทั้งสองทาง` }[t.state];
    };

    const MISSIONS = [
        {
            id: 0, title: 'ทดลองอิสระ', page: '', meter: 'analog', fx: 'tr', free: true,
            setup: () => { S.bank = [mk('ตัวที่ 1', rnd(['npn', 'pnp']), rnd(ORDERS)), mk('ตัวที่ 2', rnd(['npn', 'pnp']), rnd(ORDERS)), mk('ตัวที่ 3', rnd(['npn', 'pnp']), rnd(ORDERS), rnd(['good', 'open', 'short'])), mk('ตัวที่ 4', rnd(['npn', 'pnp']), rnd(ORDERS))]; },
            goal: 'ทรานซิสเตอร์ 4 ตัว สุ่มชนิดและลำดับขา บางตัวอาจเสีย ลองหาขา ชนิด และสภาพ แล้วกด "เฉลยชื่อขา" ที่มุมโต๊ะเพื่อตรวจ'
        },
        {
            id: 1, title: 'มิเตอร์เข็ม: สายไหนเป็นบวก', page: 'หน้า 42', meter: 'analog', fx: 'diode',
            goal: 'ย่านโอห์มของมิเตอร์เข็มใช้ถ่านในเครื่อง ขั้วบวกของถ่านออกที่ขั้ว −COM (สายดำ) ลองกับไดโอดดูว่าเข็มขึ้นเมื่อไร',
            steps: [
                { t: 'ลากปลั๊กสายดำไปเสียบขั้ว −COM และสายแดงเสียบขั้ว +', ok: () => plugOK('analog') },
                { t: 'หมุนปุ่มเลือกย่านไปที่ Ω ×10', ok: () => S.sel.analog === 'x10' },
                zeroStep('×10'),
                { t: 'สายดำแตะขา A สายแดงแตะขา K', ok: () => on('black', 'a') && on('red', 'k') },
                { choose: { q: 'เข็มเป็นอย่างไร', opts: ['เข็มขึ้นมาก (ความต้านทานต่ำ)', 'เข็มไม่ขึ้น (ความต้านทานสูงมาก)'], ans: 0, why: 'สายดำเป็นบวก แตะขา A ไดโอดได้ไบแอสตรง จึงนำกระแส' } },
                { t: 'สลับสาย: สายแดงแตะขา A สายดำแตะขา K', ok: () => on('red', 'a') && on('black', 'k') },
                { choose: { q: 'คราวนี้เข็มเป็นอย่างไร', opts: ['เข็มขึ้นมาก (ความต้านทานต่ำ)', 'เข็มไม่ขึ้น (ความต้านทานสูงมาก)'], ans: 1, why: 'ไดโอดได้ไบแอสกลับ จึงไม่นำกระแส' } },
                { choose: { q: 'สรุป: ย่านโอห์มของมิเตอร์เข็ม ไฟบวกออกที่สายสีอะไร', opts: ['สายแดง', 'สายดำ'], ans: 1, why: 'จำไว้: มิเตอร์เข็ม สายดำ = บวก · มิเตอร์ดิจิทัล สายแดง = บวก' } }
            ]
        },
        {
            id: 2, title: 'หาขาเบสและชนิด ตัวที่ 1', page: 'หน้า 42–43', meter: 'analog', fx: 'tr',
            setup: () => { S.bank = [mk('Q1', 'npn', rnd(ORDERS))]; },
            goal: 'ขั้นที่ 1 ในหนังสือ (รูปที่ 4.6) ใช้ย่าน R×10 หาว่าขาไหนเป็นเบส และเป็นชนิด NPN หรือ PNP',
            steps: [
                { t: 'เสียบสายดำที่ −COM สายแดงที่ + แล้วหมุนไปที่ Ω ×10', ok: () => plugOK('analog') && S.sel.analog === 'x10' },
                zeroStep('×10'),
                { t: baseHint, ok: foundBase },
                { choose: { q: 'ขาไหนเป็นขาเบส', opts: legOpts, ans: () => legOf(cur(), 'B') - 1, why: baseWhy } },
                { choose: { q: 'ทรานซิสเตอร์ตัวนี้ชนิดอะไร', opts: ['NPN', 'PNP'], ans: () => (cur().type === 'npn' ? 0 : 1), why: baseWhy } }
            ]
        },
        {
            id: 3, title: 'หาขาเบสและชนิด ตัวที่ 2', page: 'หน้า 42–43', meter: 'analog', fx: 'tr',
            setup: () => { S.bank = [mk('Q2', 'pnp', rnd(ORDERS))]; },
            goal: 'ทำแบบเดิมกับอีกตัว ระวัง: ตัวนี้อาจไม่ใช่ชนิดเดียวกับตัวที่แล้ว',
            steps: [
                { t: 'เสียบสายให้ถูกขั้ว หมุนไปที่ Ω ×10', ok: () => plugOK('analog') && S.sel.analog === 'x10' },
                zeroStep('×10'),
                { t: baseHint, ok: foundBase },
                { choose: { q: 'ขาไหนเป็นขาเบส', opts: legOpts, ans: () => legOf(cur(), 'B') - 1, why: baseWhy } },
                { choose: { q: 'ทรานซิสเตอร์ตัวนี้ชนิดอะไร', opts: ['NPN', 'PNP'], ans: () => (cur().type === 'npn' ? 0 : 1), why: baseWhy } }
            ]
        },
        {
            id: 4, title: 'หาขาอิมิตเตอร์และคอลเลกเตอร์', page: 'หน้า 43–44', meter: 'analog', fx: 'tr',
            setup: () => { const ty = rnd(['npn', 'pnp']); S.bank = [mk('Q3', ty, rnd(ORDERS), 'good', 'B')]; S.bank[0].show0 = 'B'; },
            goal: 'ขั้นที่ 2 ในหนังสือ (รูปที่ 4.7) รู้ขาเบสแล้ว ใช้ย่าน R×10k (ถ่าน 9 V) วัดสองขาที่เหลือ สลับสายแล้วเทียบกัน',
            steps: [
                { t: 'เสียบสายให้ถูกขั้ว หมุนไปที่ Ω ×10k', ok: () => plugOK('analog') && S.sel.analog === 'x10k' },
                zeroStep('×10k'),
                { t: 'ใช้ย่าน ×10 แตะขาเบสกับอีกขา ดูว่าเป็น NPN หรือ PNP (ทำแล้วกลับมาที่ ×10k) หรือข้ามได้ถ้ารู้แล้ว', ackBtn: 'รู้ชนิดแล้ว' },
                { t: 'แตะสองขาที่ไม่ใช่เบส แล้วสลับสายแตะอีกครั้ง ดูว่าครั้งไหนเข็มขยับ', ok: () => { const t = cur(); return measured(t, ['x10k'], 'E', 'C') && measured(t, ['x10k'], 'C', 'E'); } },
                { choose: { q: 'ขาไหนเป็นขาอิมิตเตอร์ (E)', opts: legOpts, ans: () => legOf(cur(), 'E') - 1, why: ecWhy } },
                { choose: { q: 'ทรานซิสเตอร์ตัวนี้ชนิดอะไร', opts: ['NPN', 'PNP'], ans: () => (cur().type === 'npn' ? 0 : 1), why: () => (cur().type === 'npn' ? 'สายดำแตะเบสแล้วเข็มขึ้น = NPN' : 'สายแดงแตะเบสแล้วเข็มขึ้น = PNP') } }
            ]
        },
        {
            id: 5, title: 'ตัวไหนดี ตัวไหนเสีย', page: 'หน้า 42–46', meter: 'analog', fx: 'tr',
            setup: () => {
                const st = ['good', 'open', 'short'].sort(() => Math.random() - 0.5);
                S.bank = st.map((s, i) => mk('ตัวที่ ' + (i + 1), rnd(['npn', 'pnp']), rnd(ORDERS), s, 'all'));
            },
            goal: 'ทรานซิสเตอร์ 3 ตัวรู้ชื่อขาแล้ว วัด B–E, B–C และ C–E ทั้งสองทาง แล้วบอกว่าแต่ละตัวดี ขาด หรือช็อต (คลิกชื่อตัวที่มุมบนของโต๊ะเพื่อสลับตัว)',
            steps: [
                { t: 'เสียบสายให้ถูกขั้ว หมุนไปที่ Ω ×10 แล้วปรับ 0 Ω', ok: () => plugOK('analog') && S.sel.analog === 'x10' && AFTER_ZERO() },
                { choose: { q: 'ตัวที่ 1 สภาพเป็นอย่างไร', opts: STATE_OPTS, ans: () => STATE_IDX[S.bank[0].state], why: stateWhy(0) } },
                { choose: { q: 'ตัวที่ 2 สภาพเป็นอย่างไร', opts: STATE_OPTS, ans: () => STATE_IDX[S.bank[1].state], why: stateWhy(1) } },
                { choose: { q: 'ตัวที่ 3 สภาพเป็นอย่างไร', opts: STATE_OPTS, ans: () => STATE_IDX[S.bank[2].state], why: stateWhy(2) } }
            ]
        },
        {
            id: 6, title: 'มิเตอร์ดิจิทัล: ย่านวัดไดโอด', page: 'ความรู้เสริม', meter: 'dmm', fx: 'tr',
            setup: () => { S.bank = [mk('Q4', 'npn', 'EBC', 'good', 'all')]; },
            goal: 'มิเตอร์ดิจิทัลสายแดงเป็นบวก ย่านไดโอด (→|) แสดงแรงดันตกคร่อมรอยต่อเป็น mV',
            steps: [
                { t: 'เสียบสายดำที่ COM สายแดงที่ VΩmA แล้วหมุนไปที่ →| (ไดโอด)', ok: () => plugOK('dmm') && S.sel.dmm === 'diode' },
                { t: 'สายแดงแตะขา B สายดำแตะขา E', ok: () => on('red', tpOf(cur(), 'B')) && on('black', tpOf(cur(), 'E')) },
                { ask: { q: 'จอแสดงกี่มิลลิโวลต์', unit: 'mV', ans: 675, tol: 3 } },
                { t: 'สายแดงยังอยู่ที่ขา B ย้ายสายดำไปแตะขา C', ok: () => on('red', tpOf(cur(), 'B')) && on('black', tpOf(cur(), 'C')) },
                { ask: { q: 'จอแสดงกี่มิลลิโวลต์', unit: 'mV', ans: 655, tol: 3 } },
                { t: 'สลับสาย: สายดำแตะขา B สายแดงแตะขา E', ok: () => on('black', tpOf(cur(), 'B')) && on('red', tpOf(cur(), 'E')) },
                { choose: { q: 'จอแสดงอะไร', opts: ['เลข 1 ทางซ้าย (ไม่นำกระแส)', 'ประมาณ 600–700 mV'], ans: 0, why: 'ไบแอสกลับ รอยต่อไม่นำกระแส จอจึงขึ้น 1 (เกินย่าน)' } },
                { choose: { q: 'เทียบ B–E กับ B–C', opts: ['B–E อ่านได้สูงกว่า B–C เล็กน้อย', 'B–C อ่านได้สูงกว่า B–E เล็กน้อย', 'เท่ากันพอดี'], ans: 0, why: 'ทรานซิสเตอร์ส่วนใหญ่ รอยต่อ B–E อ่านได้สูงกว่า B–C เล็กน้อย ใช้ช่วยแยกขา E กับ C ได้' } }
            ]
        },
        {
            id: 7, title: 'มิเตอร์ดิจิทัล: วัดค่า hFE (β)', page: 'ความรู้เสริม', meter: 'dmm', fx: 'tr',
            setup: () => { S.bank = [mk('Q5', 'npn', 'CBE', 'good', 'all')]; },
            goal: 'ช่อง hFE ของมิเตอร์ดิจิทัลวัดอัตราขยายกระแส β = IC ÷ IB ได้ ต้องเสียบให้ตรงชนิดและตรงขา E B C',
            steps: [
                { t: 'หมุนปุ่มไปที่ hFE', ok: () => S.sel.dmm === 'hfe' },
                { t: 'กด "เสียบ NPN" ที่ช่อง hFE ข้างโต๊ะ', ok: () => S.sock === 'npn' },
                { choose: { q: 'จอแสดงค่าต่ำมาก เพราะอะไร', opts: ['ขา E กับ C สลับกัน ต้องกลับด้าน', 'ทรานซิสเตอร์เสีย', 'เสียบผิดแถว ต้องเสียบแถว PNP'], ans: 0, why: 'ตัวนี้ขาเรียง C B E แต่ช่องเรียง E B C ต้องกลับด้าน' } },
                { t: 'กด "กลับด้าน" ให้ขา E B C ตรงกับช่อง', ok: () => S.sock === 'npn' && S.flip },
                { ask: { q: 'จอแสดงค่า hFE เท่าไร', unit: '', ans: () => cur().hfe, tol: 0 } },
                { ask: { q: 'ถ้ากระแสเบส IB = 20 µA กระแสคอลเลกเตอร์ IC = β × IB เท่ากับกี่มิลลิแอมแปร์', unit: 'mA', ans: () => cur().hfe * 0.02, tol: 0.05 } }
            ]
        }
    ];
    const LAST = MISSIONS.length - 1;
    let MI = null, prog = null;
    const save = store.get();
    const val = (x, ...a) => (typeof x === 'function' ? x(...a) : x);

    function startMission(id) {
        MI = MISSIONS.find(m => m.id === id) || MISSIONS[0];
        prog = { done: [], tries: 0, part: 0, cells: {} };
        Object.assign(S, { meter: MI.meter, screw: 0, zBase: 0, adjDeg: 0, oblique: false, danger: null, fx: MI.fx, psuV: 0, sw: true, link: true, breaker: false, lampBig: false, zoomed: false, cur: 0, sock: null, flip: false, log: new Set() });
        S.sel = { analog: 'off', dmm: 'off' };
        S.fuse = { analog: true, dmm: true };
        S.bank = [mk('Q', 'npn', 'EBC')];
        restLeads(); flashMsg = '';
        if (MI.setup) MI.setup();
        needlePos = clamp(zoff(), -0.06, 1.06); needleVel = 0;
        drawMeterStatic(); fit();
        document.querySelectorAll('[data-meter-pick]').forEach(x => x.classList.toggle('on', x.dataset.meterPick === S.meter));
        renderMission();
        update();
        try { history.replaceState(null, '', `?m=${id}${EMBED ? '&embed=1' : ''}`); } catch (e) { /* file:// */ }
    }
    function markDone() {
        if (!save.done.includes(MI.id)) { save.done.push(MI.id); store.set(save); fillSelect(); }
        $('#mDone').hidden = false;
    }
    function fillSelect() {
        const sel = $('#mSel');
        sel.innerHTML = MISSIONS.filter(m => m.id).concat(MISSIONS[0]).map(m => `<option value="${m.id}">${m.id ? m.id + '. ' : ''}${m.title}${save.done.includes(m.id) ? '  ✓' : ''}</option>`).join('');
        if (MI) sel.value = MI.id;
    }
    function renderMission() {
        $('#mSel').value = MI.id;
        $('#mTitle').textContent = MI.title;
        $('#mPage').textContent = MI.page ? (/^หน้า/.test(MI.page) ? 'หนังสือ' + MI.page : MI.page) : '';
        $('#mPage').hidden = !MI.page;
        $('#mGoal').textContent = MI.goal;
        $('#mDone').hidden = true;
        $('#freeBox').hidden = !MI.free;
        $('#nextBtn').hidden = !MI.id || MI.id === LAST;
        const ol = $('#mSteps'); ol.innerHTML = '';
        (MI.steps || []).forEach((st, i) => {
            const li = document.createElement('li');
            if (st.ask) {
                li.className = 'ask';
                li.innerHTML = `<span>${st.ask.q}</span><span class="in"><input type="text" inputmode="decimal" autocomplete="off" aria-label="${st.ask.q}"> <b>${st.ask.unit}</b> <button type="button" class="btn small">ตรวจ</button></span><span class="fb"></span>`;
                const inp = li.querySelector('input'), go = () => checkAsk(i, li);
                li.querySelector('button').addEventListener('click', go);
                inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
            } else if (st.choose) {
                li.className = 'ask choose';
                li.innerHTML = `<span>${st.choose.q}</span><span class="opts">${val(st.choose.opts).map((o, k) => `<button type="button" class="pick" data-k="${k}">${o}</button>`).join('')}</span><span class="fb"></span>`;
                li.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => checkChoose(i, li, +b.dataset.k, b)));
            } else {
                li.innerHTML = `<span>${st.t}</span>`;
                if (st.ackBtn) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small'; b.textContent = st.ackBtn; b.addEventListener('click', () => { if (current() === i) { prog.done[i] = true; checkMission(); } }); li.appendChild(b); }
            }
            ol.appendChild(li);
        });
        paintSteps();
    }
    const current = () => { if (!MI.steps) return -1; for (let i = 0; i < MI.steps.length; i++) if (!prog.done[i]) return i; return MI.steps.length; };
    function paintSteps() {
        const c = current();
        [...$('#mSteps').children].forEach((li, i) => {
            li.classList.toggle('done', !!prog.done[i]);
            li.classList.toggle('now', i === c);
            li.querySelectorAll('input, button').forEach(x => { x.disabled = i !== c; });
        });
    }
    function checkMission() {
        if (!MI || !MI.steps || !prog) return;
        let ch = false;
        for (let i = 0; i < MI.steps.length; i++) {
            if (prog.done[i]) continue;
            const st = MI.steps[i];
            if (st.ask || st.choose || !st.ok) break;
            if (st.ok()) { prog.done[i] = true; ch = true; continue; }
            break;
        }
        paintSteps();
        if (current() === MI.steps.length) markDone();
        return ch;
    }
    function explain(ans) {
        if (S.meter === 'dmm') return `อ่านตัวเลขบนจอได้เลย: ${OUT.disp.trim()} ${S.sel.dmm === 'hfe' ? '' : (DF[S.sel.dmm] ? DF[S.sel.dmm][2] : '')}`;
        return '';
    }
    function checkAsk(i, li) {
        if (current() !== i) return;
        const ask = MI.steps[i].ask, ans = val(ask.ans), inp = li.querySelector('input'), fb = li.querySelector('.fb');
        const v = parseFloat(String(inp.value).replace(/,/g, '').replace('−', '-'));
        if (isNaN(v)) { fb.className = 'fb bad'; fb.textContent = 'พิมพ์ตัวเลข'; return; }
        if (Math.abs(v - ans) <= ask.tol + 1e-9) {
            fb.className = 'fb ok'; fb.textContent = 'ถูกต้อง' + (ask.unit === 'mA' && MI.id === 7 ? ` · IC = ${cur().hfe} × 0.02 mA = ${num(ans)} mA` : ' · ' + explain(ans));
            prog.done[i] = true; prog.tries = 0; checkMission();
        } else {
            prog.tries++;
            fb.className = 'fb bad';
            fb.textContent = prog.tries < 2 ? 'ยังไม่ถูก ดูตัวเลขบนจออีกครั้ง' : (ask.unit === 'mA' ? `ใช้สูตร IC = β × IB = ${cur().hfe} × 0.02 mA` : 'ดูตัวเลขบนจอ: ' + OUT.disp.trim());
        }
    }
    function checkChoose(i, li, k, btn) {
        if (current() !== i) return;
        const c = MI.steps[i].choose, fb = li.querySelector('.fb');
        if (k === val(c.ans)) {
            li.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('on', b === btn));
            fb.className = 'fb ok'; fb.textContent = 'ถูกต้อง · ' + val(c.why);
            prog.done[i] = true; checkMission();
        } else {
            fb.className = 'fb bad';
            fb.textContent = 'ยังไม่ถูก ลองวัดอีกครั้งแล้วคิดดู' + (MI.id >= 2 && MI.id <= 4 ? ' · มิเตอร์เข็ม: สายดำ = บวก' : '');
        }
    }
    function refreshTable() { /* บทนี้ไม่มีตารางในแล็บ */ }

    /* ---------- ปุ่มต่าง ๆ ---------- */
    $('#zIn').addEventListener('click', () => zoomAt(1.3, VB.x + VB.w / 2, VB.y + VB.h / 2));
    $('#zOut').addEventListener('click', () => zoomAt(1 / 1.3, VB.x + VB.w / 2, VB.y + VB.h / 2));
    $('#zFit').addEventListener('click', fit);
    $('#zFace').addEventListener('click', zoomFace);
    $('#btnHelp').addEventListener('click', () => { S.helper = !S.helper; update({ fx: false }); });
    $('#btnObl').addEventListener('click', () => { S.oblique = !S.oblique; drawDyn(); renderStatus(); renderAlerts(); });
    $('#fuseBtn').addEventListener('click', () => { S.fuse = { analog: true, dmm: true }; flashMsg = ''; update(); });
    $('#dangerBtn').addEventListener('click', () => {
        S.danger = null; S.breaker = false; S.fuse = { analog: true, dmm: true }; flashMsg = '';
        ['red', 'black'].forEach(c => { const L = S.leads[c]; if (L.tp) { L.tp = null; L.tip = REST[c].tip.slice(); } });
        update();
    });
    $('#resetBtn').addEventListener('click', () => startMission(MI.id));
    $('#nextBtn').addEventListener('click', () => startMission(Math.min(LAST, MI.id + 1)));
    $('#mSel').addEventListener('change', e => startMission(+e.target.value));
    $('#newBank').addEventListener('click', () => startMission(0));
    document.querySelectorAll('[data-meter-pick]').forEach(b => b.addEventListener('click', () => {
        const m = b.dataset.meterPick; if (S.meter === m) return;
        S.meter = m; ['red', 'black'].forEach(c => { S.leads[c].jack = null; S.leads[c].plug = REST[c].plug.slice(); });
        drawMeterStatic(); update();
        document.querySelectorAll('[data-meter-pick]').forEach(x => x.classList.toggle('on', x.dataset.meterPick === S.meter));
    }));
    window.addEventListener('resize', () => { if (VB.w >= WORLD.w - 1) fit(); });

    if (EMBED) document.body.classList.add('embed');
    fillSelect();
    const m0 = parseInt(qs.get('m'), 10);
    startMission(isNaN(m0) ? 1 : clamp(m0, 0, LAST));
    requestAnimationFrame(tick);
    // ให้สคริปต์ทดสอบเรียกดูสถานะได้
    window.TLab = { S, OUT: () => OUT, compute, update, startMission, fmtD, solve, solveNL, FX, MISSIONS, prog: () => prog, VB: () => VB, cur, hfeVal };
})();
