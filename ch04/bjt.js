/* ===========================================
   BJT — ภาพและตัวจำลองของบทที่ 4 ทรานซิสเตอร์แบบ BJT (วาดใหม่ทั้งหมด ไม่ใช้ภาพจากหนังสือ)
   ใช้ได้ทั้งสไลด์ แบบฝึกหัด แบบทดสอบ และเฉลย

   ภาพนิ่ง
   <span data-bjt="sym" data-type="npn|pnp" data-lbl="1"></span>        สัญลักษณ์ (lbl=0 ไม่เขียน B C E)
   <span data-bjt="block" data-type="npn|pnp"></span>                   ก้อนโครงสร้าง (รูปที่ 4.1 ก, ค)
   <span data-bjt="pkg" data-pkg="to92|to220|to3"></span>               ตัวถังจริง
   <span data-bjt="curves" data-pt="6,20"></span>                       กราฟ IC–VCE หลายเส้น (รูปที่ 4.2) pt = จุดทำงาน VCE,IB(µA)
   <span data-bjt="regions" data-pt="5"></span>                         กราฟช่วงการทำงาน (รูปที่ 4.5) pt = VCE ของจุดที่ให้ทาย
   <span data-bjt="biasfig" data-type="npn|pnp"></span>                 การไบแอส (รูปที่ 4.3, 4.4)
   <span data-bjt="mtest" data-type="npn" data-order="EBC" data-red="E" data-black="B" data-range="x10" data-state="good"
         data-legs="EBC|123" data-no="1"></span>                        การวัดด้วยมิเตอร์เข็ม (รูปที่ 4.6, 4.7) เข็มคำนวณจากเครื่องจริง (สายดำ = บวก)
   ตัวจำลอง (กดได้ในสไลด์)
   <div data-bjt="family"></div>        ปรับ IB และ VCE ดู IC, β และช่วงการทำงาน
   <div data-bjt="bias"></div>          ไบแอส NPN/PNP สลับขั้วแหล่งจ่าย ดูกระแสไหล
   <div data-bjt="beta"></div>          คำนวณ β, IC, IB, IE ทีละขั้น
   <div data-bjt="rquiz"></div>         ทายช่วงการทำงานจากจุดบนกราฟ
   =========================================== */
(function (g) {
    'use strict';
    const FT = 'font-family="Kanit, Sarabun, sans-serif"';
    const FM = 'font-family="Prompt, Kanit, sans-serif"';
    const r1 = n => Math.round(n * 10) / 10;
    const T = (x, y, t, size, c, anchor, wt, extra) => `<text x="${r1(x)}" y="${r1(y)}" font-size="${size || 24}" ${FT} font-weight="${wt || 500}" fill="${c || '#2b2930'}" text-anchor="${anchor || 'middle'}" dominant-baseline="middle" ${extra || ''}>${t}</text>`;
    const C = { ink: '#2b2930', soft: '#6b6573', teal: '#0d7a80', orange: '#e0702a', rose: '#d0435b', blue: '#2f6fd0', sun: '#e9b528', n: '#dbe8fb', p: '#fbdfe4', line: '#c9c3cf' };
    const svg = (vb, body, label, cls) => `<svg class="bj-svg ${cls || ''}" viewBox="${vb}" role="img" aria-label="${label || ''}">${body}</svg>`;
    const stop = el => {
        el.addEventListener('keydown', e => e.stopPropagation());
        el.addEventListener('click', e => { if (e.target.closest('button, input, select, label')) e.stopPropagation(); });
    };
    const blur = b => b && b.blur && b.blur();

    /* ---------- สัญลักษณ์ ---------- */
    function arrowHead(x1, y1, x2, y2, f, toward2, col) {
        const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f;
        let dx = x2 - x1, dy = y2 - y1; const L = Math.hypot(dx, dy); dx /= L; dy /= L;
        if (!toward2) { dx = -dx; dy = -dy; }
        const s = 22, w = 11;
        const bx = x - dx * s, by = y - dy * s;
        return `<path d="M${r1(x)} ${r1(y)} L${r1(bx - dy * w)} ${r1(by + dx * w)} L${r1(bx + dy * w)} ${r1(by - dx * w)} Z" fill="${col}"/>`;
    }
    function sym(o) {
        const npn = o.type !== 'pnp', col = o.col || C.ink, lbl = o.lbl !== '0';
        let s = `<circle cx="150" cy="130" r="82" fill="#fff" stroke="${col}" stroke-width="5"/>
            <path d="M20 130 H120 M120 82 V178 M120 106 L178 70 V8 M120 154 L178 190 V252" fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
            <circle cx="20" cy="130" r="7" fill="#fff" stroke="${col}" stroke-width="4"/><circle cx="178" cy="8" r="7" fill="#fff" stroke="${col}" stroke-width="4"/><circle cx="178" cy="252" r="7" fill="#fff" stroke="${col}" stroke-width="4"/>`;
        s += npn ? arrowHead(120, 154, 178, 190, 0.85, true, col) : arrowHead(120, 154, 178, 190, 0.2, false, col);
        if (lbl) s += T(40, 106, 'B', 34, col, 'middle', 600) + T(212, 22, 'C', 34, col, 'middle', 600) + T(212, 240, 'E', 34, col, 'middle', 600);
        return svg('0 0 260 262', s, 'สัญลักษณ์ทรานซิสเตอร์ชนิด ' + (npn ? 'NPN' : 'PNP'), 'bj-sym');
    }

    /* ---------- ก้อนโครงสร้าง (รูปที่ 4.1 ก, ค: C ซ้าย E ขวา B ล่าง) ---------- */
    function block(o) {
        const npn = o.type !== 'pnp', L = npn ? ['N', 'P', 'N'] : ['P', 'N', 'P'];
        let s = `<path d="M24 92 H110 M410 92 H496 M260 140 V222" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`;
        L.forEach((t, i) => { s += `<rect x="${110 + i * 100}" y="44" width="100" height="96" fill="${t === 'N' ? C.n : C.p}" stroke="${C.ink}" stroke-width="5"/>${T(160 + i * 100, 94, t, 42, t === 'N' ? C.blue : C.rose, 'middle', 700)}`; });
        s += T(40, 124, 'C', 34, C.ink, 'middle', 600) + T(480, 124, 'E', 34, C.ink, 'middle', 600) + T(290, 206, 'B', 34, C.ink, 'middle', 600);
        if (o.names) s += T(160, 20, 'คอลเลกเตอร์', 22, C.soft) + T(260, 20, 'เบส', 22, C.soft) + T(360, 20, 'อิมิตเตอร์', 22, C.soft);
        return svg('0 0 520 232', s, 'โครงสร้างทรานซิสเตอร์ชนิด ' + (npn ? 'NPN' : 'PNP'), 'bj-block');
    }

    /* ---------- ตัวถัง ---------- */
    function pkg(o) {
        const k = o.pkg || 'to92';
        let s = '';
        if (k === 'to92') {
            s = `<path d="M50 140 V70 Q50 30 100 30 Q150 30 150 70 V140 Z" fill="#26272b"/><path d="M60 64 Q62 40 100 38" stroke="#fff" stroke-opacity=".2" stroke-width="6" fill="none"/>
                <path d="M75 140 V240 M100 140 V240 M125 140 V240" stroke="#b9bec2" stroke-width="7" stroke-linecap="round"/>${T(100, 90, 'BC547', 18, '#ddd', 'middle', 600)}`;
        } else if (k === 'to220') {
            s = `<rect x="45" y="10" width="110" height="70" rx="6" fill="#c9ced3" stroke="#8c949b" stroke-width="3"/><circle cx="100" cy="42" r="15" fill="#fff" stroke="#8c949b" stroke-width="3"/>
                <rect x="45" y="70" width="110" height="90" rx="6" fill="#26272b"/>${T(100, 112, 'TIP41', 18, '#ddd', 'middle', 600)}
                <path d="M72 160 V245 M100 160 V245 M128 160 V245" stroke="#b9bec2" stroke-width="8" stroke-linecap="round"/>`;
        } else {
            s = `<path d="M10 120 Q10 80 60 72 L140 72 Q190 80 190 120 Q190 160 140 168 L60 168 Q10 160 10 120 Z" fill="#cfd3d6" stroke="#8c949b" stroke-width="3"/>
                <circle cx="32" cy="120" r="10" fill="#fff" stroke="#8c949b" stroke-width="3"/><circle cx="168" cy="120" r="10" fill="#fff" stroke="#8c949b" stroke-width="3"/>
                <circle cx="100" cy="120" r="46" fill="#e4e7ea" stroke="#8c949b" stroke-width="3"/>${T(100, 120, '2N3055', 17, '#555', 'middle', 600)}
                <path d="M86 168 V240 M114 168 V240" stroke="#b9bec2" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 0"/>`;
        }
        return svg('0 0 200 250', s, 'ตัวถังทรานซิสเตอร์ ' + k.toUpperCase(), 'bj-pkg');
    }

    /* ---------- กราฟคุณลักษณะ ----------
       แบบจำลองเพื่อสอน: β = 100, ช่วงอิ่มตัว VCE < Vk = 1 V, พังทลายเมื่อ VCE > 10 V (แกน 0–12 V) */
    const GX = 90, GY = 420, PXV = 50, PXMA = 70;
    const ic = (vce, ib) => {                             // ib µA → mA
        if (vce <= 0) return 0;
        const base = 100 * ib / 1000 * (1 + vce / 80) * (1 - Math.exp(-vce / 0.28));
        const m = vce < 11.15 ? 1 / (1 - Math.pow(vce / 11.2, 30)) : 30;
        return base * m + (vce > 10 ? Math.pow(vce - 10, 2) * 0.9 : 0);
    };
    const region = vce => (vce < 1 ? 'sat' : vce > 10 ? 'bd' : 'act');
    const RG = { sat: ['บริเวณอิ่มตัว (Saturation)', C.sun], act: ['บริเวณทำงานเต็มที่ (Forward Active)', C.teal], bd: ['บริเวณพังทลาย (Breakdown)', C.rose] };
    const fx = v => GX + v * PXV, fy = ma => GY - ma * PXMA;
    function curvePath(ib, vmax) {
        let d = '';
        for (let v = 0; v <= (vmax || 11.6); v += 0.05) { const y = Math.max(fy(ic(v, ib)), 40); d += (d ? ' L' : 'M') + r1(fx(v)) + ' ' + r1(y); if (y <= 40) break; }
        return d;
    }
    function axes(xl, yl, bands) {
        let s = '';
        if (bands) {
            s += `<rect x="${GX}" y="40" width="${PXV}" height="${GY - 40}" fill="#fdf3d2"/><rect x="${fx(1)}" y="40" width="${PXV * 9}" height="${GY - 40}" fill="#ddf1ef"/><rect x="${fx(10)}" y="40" width="${PXV * 2}" height="${GY - 40}" fill="#fbe1e5"/>
                <path d="M${fx(1)} 40 V${GY} M${fx(10)} 40 V${GY}" stroke="${C.soft}" stroke-width="2.5" stroke-dasharray="7 6"/>`;
        }
        s += `<path d="M${GX} ${GY} H${fx(12.6)} M${GX} ${GY} V24" stroke="${C.ink}" stroke-width="3.5"/>
            <path d="M${fx(12.6)} ${GY} l-14 -8 v16 z M${GX} 24 l-8 14 h16 z" fill="${C.ink}"/>`;
        for (let v = 0; v <= 12; v += 2) s += `<path d="M${fx(v)} ${GY} v8" stroke="${C.ink}" stroke-width="2.5"/>` + T(fx(v), GY + 24, v, 20, C.soft);
        for (let m = 1; m <= 5; m++) s += `<path d="M${GX} ${fy(m)} h-8" stroke="${C.ink}" stroke-width="2.5"/>` + T(GX - 22, fy(m), m, 20, C.soft);
        s += T(fx(12.6), GY + 52, xl || 'V<tspan font-size="15" dy="5">CE</tspan><tspan dy="-5"> (V)</tspan>', 24, C.ink, 'end', 600);
        s += T(GX + 12, 22, yl || 'I<tspan font-size="15" dy="5">C</tspan><tspan dy="-5"> (mA)</tspan>', 24, C.ink, 'start', 600);
        return s;
    }
    const IBS = [0, 10, 20, 30, 40];
    function curves(o) {
        let s = axes();
        IBS.forEach((ib, i) => {
            s += `<path d="${curvePath(ib, 9.6)}" fill="none" stroke="${C.teal}" stroke-width="4"/>`;
            s += T(fx(9.7), fy(ic(9.6, ib)) - 2, `I<tspan font-size="14" dy="5">B${i}</tspan><tspan dy="-5"> = ${ib} µA</tspan>`, 19, C.ink, 'start', 600);
        });
        if (o.pt) {
            const [v, ib] = o.pt.split(',').map(Number), y = fy(ic(v, ib));
            s += `<path d="M${fx(v)} ${GY} V${y} H${GX}" stroke="${C.orange}" stroke-width="3" stroke-dasharray="6 5" fill="none"/><circle cx="${fx(v)}" cy="${y}" r="10" fill="${C.orange}"/>`;
        }
        return svg('0 0 860 480', s, 'กราฟความสัมพันธ์ของกระแส IB กับกระแส IC', 'bj-graph');
    }
    function regions(o) {
        let s = axes(null, null, true);
        s += `<path d="${curvePath(30, 11.6)}" fill="none" stroke="${C.ink}" stroke-width="5"/>`;
        s += T(fx(0.5), 60, 'อิ่มตัว', 22, '#8a6300', 'middle', 700) + T(fx(5.5), 60, 'ทำงานเต็มที่', 24, C.teal, 'middle', 700) + T(fx(11), 60, 'พังทลาย', 22, C.rose, 'middle', 700);
        s += T(fx(1), GY + 52, 'V<tspan font-size="15" dy="5">k</tspan>', 24, C.ink, 'middle', 600);
        if (o.pt) { const v = +o.pt; s += `<circle cx="${fx(v)}" cy="${Math.max(fy(ic(v, 30)), 50)}" r="13" fill="${C.orange}" stroke="#fff" stroke-width="4"/>`; }
        if (o.nolabel) s = s.replace(/>อิ่มตัว<|>ทำงานเต็มที่<|>พังทลาย</g, '><');
        return svg('0 0 860 480', s, 'ช่วงการทำงานของทรานซิสเตอร์', 'bj-graph');
    }

    /* ---------- การไบแอส (รูปที่ 4.3, 4.4) ----------
       st: { type, vbe: 'f'|'r'|'0', vcb: 'r'|'f'|'0' } วาดก้อน E–B–C แบตเตอรี่ VBE (ซ้ายล่าง) VCB (ขวาล่าง) */
    function biasCalc(st) {
        if (st.vbe !== 'f') return { ie: 0, ib: 0, ic: 0, mode: 'off' };
        if (st.vcb === '0') return { ie: 1, ib: 1, ic: 0, mode: 'nocol' };
        if (st.vcb === 'f') return { ie: 1, ib: 0.6, ic: 0.4, mode: 'sat' };
        return { ie: 1, ib: 0.01, ic: 0.99, mode: 'act' };
    }
    function bat(x, y, plusLeft, on, lab) {
        if (!on) return `<path d="M${x - 40} ${y} H${x + 40}" stroke="${C.line}" stroke-width="5" stroke-dasharray="10 8"/>${T(x, y + 40, lab + ' ไม่ต่อ', 22, C.soft)}`;
        const xl = x - 9, xs = x + 9, longX = plusLeft ? xl : xs, shortX = plusLeft ? xs : xl;
        return `<rect x="${x - 26}" y="${y - 40}" width="52" height="80" fill="#f7f4ee"/>
            <path d="M${longX} ${y - 34} V${y + 34}" stroke="${C.ink}" stroke-width="6"/><path d="M${shortX} ${y - 18} V${y + 18}" stroke="${C.ink}" stroke-width="11"/>
            ${T(longX + (plusLeft ? -22 : 22), y - 46, '+', 30, C.rose, 'middle', 700)}${T(shortX + (plusLeft ? 22 : -22), y - 46, '−', 30, C.blue, 'middle', 700)}
            ${T(x, y + 58, lab, 24, C.ink, 'middle', 600)}`;
    }
    function biasFig(st, anim) {
        const npn = st.type !== 'pnp', L = npn ? ['n', 'p', 'n'] : ['p', 'n', 'p'];
        const r = biasCalc(st);
        let s = `<path d="M180 120 H120 V380 H321 M339 380 H441 M459 380 H660 V120 H600" fill="none" stroke="${C.ink}" stroke-width="4"/>
            <path d="M390 220 V380" stroke="${C.ink}" stroke-width="4"/>`;
        // ก้อนสารกึ่งตัวนำ: E | B (บาง) | C
        const W = [[180, 150], [330, 110], [440, 160]];
        L.forEach((t, i) => { const [x, w] = W[i]; s += `<rect x="${x}" y="60" width="${w}" height="160" fill="${t === 'n' ? C.n : C.p}" stroke="${C.ink}" stroke-width="3"/>${T(x + w / 2, 104, t, 36, t === 'n' ? C.blue : C.rose, 'middle', 700)}`; });
        s += `<path d="M180 60 V220 M600 60 V220" stroke="${C.ink}" stroke-width="10"/><path d="M335 220 H435" stroke="${C.ink}" stroke-width="10"/>`;
        s += T(150, 104, 'E', 30, C.ink, 'middle', 700) + T(630, 104, 'C', 30, C.ink, 'middle', 700) + T(412, 258, 'B', 30, C.ink, 'middle', 700);
        s += `<path d="M335 40 h110 M335 34 v12 M445 34 v12" stroke="${C.soft}" stroke-width="2.5"/>` + T(390, 20, 'ความกว้างเบส (บางมาก)', 20, C.soft);
        // แบตเตอรี่: VBE ระหว่าง E (ซ้าย) กับ B · VCB ระหว่าง B กับ C (ขวา)
        // NPN ไบแอสตรง BE: E ต่อขั้วลบ → ขั้วบวกอยู่ฝั่ง B (ขวา) · VCB กลับ: C ต่อขั้วบวก (ขวา)
        const vbePlusLeft = npn ? st.vbe === 'r' : st.vbe === 'f';
        const vcbPlusLeft = npn ? st.vcb === 'f' : st.vcb === 'r';
        s += bat(330, 380, vbePlusLeft, st.vbe !== '0', 'V<tspan font-size="16" dy="6">BE</tspan>');
        s += bat(450, 380, vcbPlusLeft, st.vcb !== '0', 'V<tspan font-size="16" dy="6">CB</tspan>');
        // การไหลของพาหะ (เส้นประเคลื่อนที่) ความหนาตามกระแส
        if (anim !== false && r.ie > 0) {
            const cls = npn ? 'bj-flow e' : 'bj-flow h';
            const w = v => r1(3 + v * 9);
            // NPN อิเล็กตรอนวิ่งจาก E ไป C (ทิศ E→B→C) · PNP โฮลวิ่งจาก E ไป C
            s += `<path class="${cls}" style="stroke-width:${w(r.ie)}px" d="M200 160 H340"/>`;
            if (r.ic > 0.05) s += `<path class="${cls}" style="stroke-width:${w(r.ic)}px" d="M340 160 H580"/>`;
            if (r.ib > 0.05) s += `<path class="${cls}" style="stroke-width:${w(r.ib)}px" d="M380 170 V210"/>`;
        }
        s += `<g class="bj-cur">${T(250, 250, `I<tspan font-size="15" dy="5">E</tspan><tspan dy="-5"> = ${r.ie.toFixed(2)} mA</tspan>`, 22, C.ink, 'middle', 600)}
            ${T(520, 250, `I<tspan font-size="15" dy="5">C</tspan><tspan dy="-5"> = ${r.ic.toFixed(2)} mA</tspan>`, 22, C.ink, 'middle', 600)}
            ${T(404, 296, `I<tspan font-size="15" dy="5">B</tspan><tspan dy="-5"> = ${r.ib < 0.05 && r.ib > 0 ? (r.ib * 1000).toFixed(0) + ' µA' : r.ib.toFixed(2) + ' mA'}</tspan>`, 22, C.ink, 'start', 600)}</g>`;
        return { svg: svg('0 0 780 470', s, 'การไบแอสทรานซิสเตอร์ ' + (npn ? 'NPN' : 'PNP'), 'bj-bias'), r };
    }

    /* ---------- การวัดด้วยมิเตอร์เข็ม (รูปที่ 4.6, 4.7) ----------
       ฟิสิกส์ของเครื่องจริง: ย่านโอห์ม ไฟบวกของถ่านออกที่ขั้ว −COM (สายดำ)
       ×10 (ถ่าน 3 V): รอยต่อไบแอสตรง เข็มขึ้นมาก · ×10k (ถ่าน 9 V): เพิ่มกรณี BE พังทลายย้อนกลับ เข็มขยับเล็กน้อย */
    function deflect(type, red, black, range, state) {
        state = state || 'good';
        const plus = black, minus = red;                  // ขั้วบวกจริงอยู่ที่สายดำ
        const pSide = type === 'npn' ? ['B'] : ['E', 'C'];
        if (state === 'short' && ((plus === 'C' && minus === 'E') || (plus === 'E' && minus === 'C'))) return 0.97;
        const fwd = (a, k) => (type === 'npn' ? a === 'B' && k !== 'B' : k === 'B' && a !== 'B');
        if (fwd(plus, minus)) {
            if (state === 'open' && (plus === 'E' || minus === 'E')) return 0;
            return range === 'x10k' ? 0.88 : 0.72;
        }
        if (range === 'x10k' && state !== 'open') {
            // ทาง C–E: รอยต่อ BC ไบแอสตรง + BE พังทลาย
            if (type === 'npn' && plus === 'E' && minus === 'C') return 0.15;
            if (type === 'pnp' && plus === 'C' && minus === 'E') return 0.15;
        }
        void pSide;
        return 0;
    }
    function mtest(o) {
        const type = o.type || 'npn', order = o.order || 'EBC', red = o.red, black = o.black, range = o.range || 'x10';
        const f = o.frac != null ? +o.frac : deflect(type, red, black, range, o.state);
        const legX = [128, 160, 192], legLab = (o.legs === '123' ? ['1', '2', '3'] : order.split(''));
        const xOf = role => legX[order.indexOf(role)];
        const a = (-40 + 80 * f) * Math.PI / 180, nx = 160 + 92 * Math.sin(a), ny = 150 - 92 * Math.cos(a);
        let s = `<rect x="40" y="20" width="240" height="210" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="4"/>
            <rect x="60" y="38" width="200" height="88" rx="4" fill="#fbf8ef" stroke="${C.ink}" stroke-width="2.5"/>
            <path d="M88 96 Q160 52 232 96" fill="none" stroke="${C.ink}" stroke-width="2.5"/>
            ${T(78, 70, '∞', 22, C.ink, 'middle', 600)}${T(244, 70, '0', 20, C.ink, 'middle', 600)}
            <path d="M160 150 L${r1(nx)} ${r1(ny)}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/><circle cx="160" cy="150" r="7" fill="${C.ink}"/>
            <circle cx="160" cy="176" r="26" fill="#eee" stroke="${C.ink}" stroke-width="3"/><path d="M146 186 L174 166" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
            ${T(232, 162, range === 'x10k' ? 'R×10k' : 'R×10', 18, C.ink, 'middle', 700)}
            <circle cx="72" cy="208" r="9" fill="#fff" stroke="${C.ink}" stroke-width="3"/><circle cx="248" cy="208" r="9" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
            ${T(72, 186, '−COM', 15, C.ink, 'middle', 700)}${T(248, 186, '+', 22, C.rose, 'middle', 700)}`;
        // ตัวทรานซิสเตอร์
        s += `<path d="M112 336 V292 Q112 264 160 264 Q208 264 208 292 V336 Z" fill="#fff" stroke="${C.ink}" stroke-width="3"/>${T(160, 290, o.legs === '123' && !o.showType ? '?' : type.toUpperCase(), 16, C.ink, 'middle', 700)}`;
        legX.forEach((x, i) => { s += `<path d="M${x} 336 V384" stroke="${C.ink}" stroke-width="4"/>${T(x, 320, legLab[i], 17, C.teal, 'middle', 700)}`; });
        // สาย: แดงจาก + (ขวา) ดำจาก −COM (ซ้าย)
        const rx = xOf(red), bx = xOf(black);
        s += `<path d="M248 217 V246 H300 V420 H${rx} V390" fill="none" stroke="${C.rose}" stroke-width="5" stroke-linejoin="round"/><path d="M${rx} 384 l-7 12 h14 z" fill="${C.rose}"/>`;
        s += `<path d="M72 217 V246 H20 V440 H${bx} V390" fill="none" stroke="#222" stroke-width="5" stroke-linejoin="round"/><path d="M${bx} 384 l-7 12 h14 z" fill="#222"/>`;
        if (o.no) s += T(26, 30, o.no, 26, C.soft, 'middle', 700);
        return svg('0 0 320 452', s, `มิเตอร์เข็มย่าน ${range} สายแดงที่ขา ${red} สายดำที่ขา ${black}`, 'bj-mtest');
    }

    /* ---------- ตัวจำลอง: กราฟ IC–VCE ---------- */
    function family(el) {
        let ib = 20, v = 6;
        el.classList.add('bj-sim');
        el.innerHTML = `<div class="bj-row"><div class="bj-fig"></div><div class="bj-side">
            <label><span>I<sub>B</sub> = <b class="mono ib"></b></span><input type="range" min="0" max="40" step="5" value="${ib}" data-k="ib"></label>
            <label><span>V<sub>CE</sub> = <b class="mono vc"></b></span><input type="range" min="0" max="11.6" step="0.1" value="${v}" data-k="v"></label>
            <div class="bj-out"></div></div></div>`;
        const fig = el.querySelector('.bj-fig'), out = el.querySelector('.bj-out');
        const draw = () => {
            let s = axes(null, null, true);
            IBS.forEach(b => { s += `<path d="${curvePath(b, 11.6)}" fill="none" stroke="${b === ib ? C.orange : '#9ccfcb'}" stroke-width="${b === ib ? 5 : 3}"/>`; });
            if (!IBS.includes(ib)) s += `<path d="${curvePath(ib, 11.6)}" fill="none" stroke="${C.orange}" stroke-width="5"/>`;
            const I = ic(v, ib), y = Math.max(fy(I), 40);
            s += `<path d="M${fx(v)} ${GY} V${y} H${GX}" stroke="${C.orange}" stroke-width="2.5" stroke-dasharray="6 5" fill="none"/><circle cx="${fx(v)}" cy="${y}" r="11" fill="${C.orange}" stroke="#fff" stroke-width="3"/>`;
            fig.innerHTML = svg('0 0 860 480', s, 'กราฟ IC กับ VCE', 'bj-graph');
            el.querySelector('.ib').textContent = ib + ' µA';
            el.querySelector('.vc').textContent = v.toFixed(1) + ' V';
            const rg = region(v), beta = ib > 0 ? I / (ib / 1000) : 0;
            out.innerHTML = `<p>I<sub>C</sub> ≈ <b class="mono">${I > 9 ? 'สูงมาก' : I.toFixed(2) + ' mA'}</b></p>
                <p>β = I<sub>C</sub> ÷ I<sub>B</sub> ≈ <b class="mono">${ib > 0 && rg === 'act' ? Math.round(beta) : '–'}</b></p>
                <p class="rg" style="border-color:${RG[rg][1]}"><b>${RG[rg][0]}</b><br>${rg === 'act' ? 'IC ขึ้นกับ IB เกือบคงที่ แม้ VCE เปลี่ยน' : rg === 'sat' ? 'VCE ต่ำกว่า Vk ทรานซิสเตอร์นำเต็มที่ IC ไม่ตาม β' : 'VCE สูงเกิน กระแสพุ่ง ทรานซิสเตอร์อาจเสีย'}</p>`;
        };
        el.addEventListener('input', e => { const k = e.target.dataset.k; if (k === 'ib') ib = +e.target.value; if (k === 'v') v = +e.target.value; draw(); });
        draw();
    }

    /* ---------- ตัวจำลอง: ไบแอส ---------- */
    function biasSim(el) {
        const st = { type: el.dataset.type || 'npn', vbe: 'f', vcb: 'r' };
        el.classList.add('bj-sim');
        el.innerHTML = `<div class="bj-row"><div class="bj-fig"></div><div class="bj-side">
            <div class="bj-ctl"><span>ชนิด</span><button type="button" data-s="type:npn">NPN</button><button type="button" data-s="type:pnp">PNP</button></div>
            <div class="bj-ctl"><span>V<sub>BE</sub></span><button type="button" data-s="vbe:f">ไบแอสตรง</button><button type="button" data-s="vbe:r">กลับขั้ว</button><button type="button" data-s="vbe:0">ไม่ต่อ</button></div>
            <div class="bj-ctl"><span>V<sub>CB</sub></span><button type="button" data-s="vcb:r">ไบแอสกลับ</button><button type="button" data-s="vcb:f">กลับขั้ว</button><button type="button" data-s="vcb:0">ไม่ต่อ</button></div>
            <div class="bj-out"></div></div></div>`;
        const fig = el.querySelector('.bj-fig'), out = el.querySelector('.bj-out');
        const draw = () => {
            const b = biasFig(st);
            fig.innerHTML = b.svg;
            const car = st.type === 'npn' ? 'อิเล็กตรอน' : 'โฮล';
            const msg = {
                off: `<b>ไม่มีกระแสไหล</b><br>รอยต่อ B–E ไม่ได้ไบแอสตรง ${car}ข้ามรอยต่อไม่ได้ ทรานซิสเตอร์ "ไม่ทำงาน"`,
                nocol: `<b>กระแสออกทางขาเบสหมด</b><br>ไม่มี V<sub>CB</sub> ดึง${car}ไปที่คอลเลกเตอร์ I<sub>C</sub> = 0`,
                sat: `<b>ทั้งสองรอยต่อไบแอสตรง</b><br>คอลเลกเตอร์ไม่ดึง${car} I<sub>C</sub> ไม่ถูกควบคุมด้วย I<sub>B</sub>`,
                act: `<b>ทำงานปกติ</b><br>${car}จาก E ข้ามเบสที่บางมากไปถึง C เกือบหมด (99%) ออกทางเบสนิดเดียว: I<sub>B</sub> น้อย คุม I<sub>C</sub> มาก`
            }[b.r.mode];
            out.innerHTML = `<p class="rg">${msg}</p><p class="small">เส้นประวิ่ง = ทิศที่${car}เคลื่อนที่ · ความหนา = ปริมาณกระแส</p>`;
            el.querySelectorAll('[data-s]').forEach(x => { const [k, v] = x.dataset.s.split(':'); x.classList.toggle('on', st[k] === v); });
        };
        el.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; const [k, v] = b.dataset.s.split(':'); st[k] = v; draw(); blur(b); });
        draw();
    }

    /* ---------- ตัวจำลอง: คำนวณ β ---------- */
    function beta(el) {
        let ib = 20, b = 100;
        el.classList.add('bj-sim', 'bj-beta');
        el.innerHTML = `<div class="bj-ctl"><span>β (h<sub>FE</sub>)</span>${[50, 100, 150, 200, 300].map(x => `<button type="button" data-b="${x}">${x}</button>`).join('')}</div>
            <label class="bj-sl"><span>I<sub>B</sub> = <b class="mono ib"></b></span><input type="range" min="5" max="100" step="5" value="${ib}"></label>
            <div class="bj-steps"></div>`;
        const draw = () => {
            const icv = b * ib / 1000, ie = icv + ib / 1000;
            el.querySelector('.ib').textContent = ib + ' µA';
            el.querySelector('.bj-steps').innerHTML = `<p>I<sub>C</sub> = β × I<sub>B</sub> = ${b} × ${ib} µA = ${b * ib} µA = <b class="mono">${icv.toFixed(2)} mA</b></p>
                <p>I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> = ${(ib / 1000).toFixed(3)} + ${icv.toFixed(2)} = <b class="mono">${ie.toFixed(3)} mA</b></p>`;
            el.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', +x.dataset.b === b));
        };
        el.addEventListener('click', e => { const x = e.target.closest('[data-b]'); if (x) { b = +x.dataset.b; draw(); blur(x); } });
        el.querySelector('input').addEventListener('input', e => { ib = +e.target.value; draw(); });
        draw();
    }

    /* ---------- ตัวจำลอง: ทายช่วง ---------- */
    function rquiz(el) {
        const PTS = [0.4, 0.7, 2.5, 4, 6, 8, 9.5, 10.6, 11.2];
        let i = 3, shown = false, n = 0, ok = 0;
        el.classList.add('bj-sim');
        el.innerHTML = `<div class="bj-row"><div class="bj-fig"></div><div class="bj-side">
            <p class="q">จุดสีส้มอยู่ในช่วงไหน</p>
            <div class="bj-ctl col"><button type="button" data-a="sat">อิ่มตัว</button><button type="button" data-a="act">ทำงานเต็มที่</button><button type="button" data-a="bd">พังทลาย</button></div>
            <div class="bj-out"></div><button type="button" class="nx" data-a="new">ข้อต่อไป →</button></div></div>`;
        const fig = el.querySelector('.bj-fig'), out = el.querySelector('.bj-out');
        const draw = () => { fig.innerHTML = regions({ pt: String(PTS[i]), nolabel: !shown }); };
        el.addEventListener('click', e => {
            const b = e.target.closest('[data-a]'); if (!b) return;
            if (b.dataset.a === 'new') { let j; do { j = Math.floor(Math.random() * PTS.length); } while (j === i); i = j; shown = false; out.innerHTML = ''; }
            else {
                const rg = region(PTS[i]), good = b.dataset.a === rg; n++; if (good) ok++;
                shown = true;
                out.innerHTML = `<p class="rg" style="border-color:${RG[rg][1]}">${good ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'} · V<sub>CE</sub> = ${PTS[i]} V อยู่ใน<b>${RG[rg][0]}</b></p><p class="small">ตอบถูก ${ok} จาก ${n} ครั้ง</p>`;
            }
            draw(); blur(b);
        });
        draw();
    }

    const STATIC = { sym, block, pkg, curves, regions, mtest, biasfig: o => biasFig({ type: o.type, vbe: 'f', vcb: 'r' }, false).svg };
    const SIM = { family, bias: biasSim, beta, rquiz };
    function render(root) {
        (root || document).querySelectorAll('[data-bjt]').forEach(el => {
            const k = el.dataset.bjt;
            if (STATIC[k]) { el.innerHTML = STATIC[k](Object.assign({}, el.dataset)); return; }
            if (SIM[k] && !el.dataset.done) { el.dataset.done = '1'; SIM[k](el); stop(el); }
        });
    }
    g.BJT = { render, sym, block, pkg, curves, regions, mtest, deflect, ic, region };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => render());
    else render();
})(window);
