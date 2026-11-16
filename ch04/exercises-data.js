/* ===========================================
   แบบฝึกหัดบทที่ 4 — ไฟล์นี้มีเฉพาะโจทย์ ไม่มีเฉลย (เฉลยอยู่ใน _private/answers-ch04.json)
   หนังสือบทนี้ไม่มีแบบฝึกหัดตอนที่ 2 จึงแต่งโจทย์ตามเนื้อหาหน้า 39–44
   type: pick (เลือกจาก options), num (ตอบเป็นตัวเลข ทศนิยม dp ตำแหน่ง), write (เขียนตอบ ครูตรวจเอง)
   รูปในโจทย์วาดจาก ch04/bjt.js (span data-bjt) · มิเตอร์เข็มวาดตามเครื่องจริง สายดำ = บวก
   =========================================== */
(function () {
    const TF = ['ถูก', 'ผิด'];
    const TYPE = ['NPN', 'PNP'];
    const LEG = ['E', 'B', 'C'];
    const LEG3 = ['ขา 1', 'ขา 2', 'ขา 3'];
    const RG = ['อิ่มตัว', 'ทำงานเต็มที่', 'พังทลาย'];
    const BIAS = ['ไบแอสตรง', 'ไบแอสกลับ'];
    const POL = ['ขั้วบวก', 'ขั้วลบ'];
    const NEEDLE = ['เข็มขึ้น', 'เข็มไม่ขึ้น'];
    const STATE = ['ดี', 'ขาด', 'ช็อต'];
    const sym = (t, lbl) => `<span class="exc sm" data-bjt="sym" data-type="${t}" data-lbl="${lbl}"></span>`;
    const reg = v => `<span class="exc" data-bjt="regions" data-pt="${v}" data-nolabel="1"></span>`;
    const mt = (t, red, black) => `<span class="exc sm" data-bjt="mtest" data-type="${t}" data-red="${red}" data-black="${black}"></span>`;

    window.EXERCISES = {
        chapter: 'บทที่ 4 ทรานซิสเตอร์แบบ BJT',
        sets: [
            {
                id: 's1', title: 'ชุดที่ 1 โครงสร้างและสัญลักษณ์ (หัวข้อ 4.1)',
                parts: [
                    {
                        title: 'ตอนที่ 1 สัญลักษณ์นี้เป็นทรานซิสเตอร์ชนิดใด',
                        items: [
                            { id: 'sy-1', type: 'pick', q: sym('npn', 1), options: TYPE },
                            { id: 'sy-2', type: 'pick', q: sym('pnp', 1), options: TYPE },
                            { id: 'sy-3', type: 'pick', q: sym('pnp', 0), options: TYPE },
                            { id: 'sy-4', type: 'pick', q: sym('npn', 0), options: TYPE }
                        ]
                    },
                    {
                        title: 'ตอนที่ 2 ข้อความต่อไปนี้หมายถึงขาใด',
                        items: [
                            { id: 'lg-1', type: 'pick', q: 'ขาที่มีลูกศรในสัญลักษณ์', options: LEG },
                            { id: 'lg-2', type: 'pick', q: 'ขาที่ต่อกับสารชั้นกลางซึ่งบางมาก', options: LEG },
                            { id: 'lg-3', type: 'pick', q: 'ขาที่ทำหน้าที่ปล่อยพาหะออกมา', options: LEG },
                            { id: 'lg-4', type: 'pick', q: 'ขาที่รวบรวมพาหะเข้ามา', options: LEG },
                            { id: 'lg-5', type: 'pick', q: 'ขาที่ต้องวัดหาเป็นขาแรก', options: LEG }
                        ]
                    },
                    {
                        title: 'ตอนที่ 3 ข้อความต่อไปนี้ถูกหรือผิด',
                        items: [
                            { id: 'tf-1', type: 'pick', q: 'ทรานซิสเตอร์ชนิด NPN มีสาร P อยู่ตรงกลาง', options: TF },
                            { id: 'tf-2', type: 'pick', q: 'สัญลักษณ์ PNP ลูกศรชี้ออกจากแท่งเบส', options: TF },
                            { id: 'tf-3', type: 'pick', q: 'ทรานซิสเตอร์แบบ BJT มีรอยต่อ PN สองรอย', options: TF },
                            { id: 'tf-4', type: 'pick', q: 'ทรานซิสเตอร์ตัวถังเหมือนกัน ลำดับขาเหมือนกันทุกรุ่น', options: TF },
                            { id: 'tf-5', type: 'pick', q: 'ซิลิคอนทนกระแสและกำลังไฟได้สูงกว่าเจอร์เมเนียม', options: TF }
                        ]
                    }
                ]
            },
            {
                id: 's2', title: 'ชุดที่ 2 คำนวณ β, IC, IB, IE (หัวข้อ 4.2)',
                parts: [
                    {
                        title: 'ตอนที่ 1 หา I<sub>C</sub> = β × I<sub>B</sub> (ตอบเป็น mA ทศนิยม 2 ตำแหน่ง)',
                        items: [
                            { id: 'ic-1', type: 'num', q: 'β = 100, I<sub>B</sub> = 30 µA', unit: 'mA', dp: 2 },
                            { id: 'ic-2', type: 'num', q: 'β = 150, I<sub>B</sub> = 40 µA', unit: 'mA', dp: 2 },
                            { id: 'ic-3', type: 'num', q: 'β = 250, I<sub>B</sub> = 12 µA', unit: 'mA', dp: 2 },
                            { id: 'ic-4', type: 'num', q: 'β = 80, I<sub>B</sub> = 25 µA', unit: 'mA', dp: 2 },
                            { id: 'ic-5', type: 'num', q: 'β = 120, I<sub>B</sub> = 15 µA', unit: 'mA', dp: 2 }
                        ]
                    },
                    {
                        title: 'ตอนที่ 2 หา β = I<sub>C</sub> ÷ I<sub>B</sub> (ตอบเป็นจำนวนเต็ม)',
                        items: [
                            { id: 'bt-1', type: 'num', q: 'I<sub>C</sub> = 4 mA, I<sub>B</sub> = 20 µA', unit: '', dp: 0 },
                            { id: 'bt-2', type: 'num', q: 'I<sub>C</sub> = 1.5 mA, I<sub>B</sub> = 10 µA', unit: '', dp: 0 },
                            { id: 'bt-3', type: 'num', q: 'I<sub>C</sub> = 9 mA, I<sub>B</sub> = 60 µA', unit: '', dp: 0 },
                            { id: 'bt-4', type: 'num', q: 'I<sub>C</sub> = 2.4 mA, I<sub>B</sub> = 30 µA', unit: '', dp: 0 }
                        ]
                    },
                    {
                        title: 'ตอนที่ 3 หา I<sub>B</sub> = I<sub>C</sub> ÷ β (ตอบเป็น µA จำนวนเต็ม)',
                        items: [
                            { id: 'ib-1', type: 'num', q: 'β = 100, I<sub>C</sub> = 5 mA', unit: 'µA', dp: 0 },
                            { id: 'ib-2', type: 'num', q: 'β = 200, I<sub>C</sub> = 3 mA', unit: 'µA', dp: 0 },
                            { id: 'ib-3', type: 'num', q: 'β = 50, I<sub>C</sub> = 1 mA', unit: 'µA', dp: 0 }
                        ]
                    },
                    {
                        title: 'ตอนที่ 4 หา I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> (ตอบเป็น mA ทศนิยม 2 ตำแหน่ง)',
                        items: [
                            { id: 'ie-1', type: 'num', q: 'I<sub>B</sub> = 20 µA, I<sub>C</sub> = 2 mA', unit: 'mA', dp: 2 },
                            { id: 'ie-2', type: 'num', q: 'I<sub>B</sub> = 50 µA, I<sub>C</sub> = 6 mA', unit: 'mA', dp: 2 },
                            { id: 'ie-3', type: 'num', q: 'I<sub>B</sub> = 0.1 mA, I<sub>C</sub> = 8 mA', unit: 'mA', dp: 2 }
                        ]
                    }
                ]
            },
            {
                id: 's3', title: 'ชุดที่ 3 ช่วงการทำงานและการไบแอส (หัวข้อ 4.2–4.3)',
                parts: [
                    {
                        title: 'ตอนที่ 1 จุดสีส้มบนกราฟอยู่ในช่วงใด',
                        items: [
                            { id: 'rg-1', type: 'pick', q: reg(5), options: RG },
                            { id: 'rg-2', type: 'pick', q: reg(0.5), options: RG },
                            { id: 'rg-3', type: 'pick', q: reg(10.8), options: RG },
                            { id: 'rg-4', type: 'pick', q: reg(8.5), options: RG }
                        ]
                    },
                    {
                        title: 'ตอนที่ 2 ทรานซิสเตอร์ทำงานขยาย รอยต่อต่อไปนี้ไบแอสแบบใด',
                        items: [
                            { id: 'bs-1', type: 'pick', q: 'NPN รอยต่อ B–E', options: BIAS },
                            { id: 'bs-2', type: 'pick', q: 'NPN รอยต่อ B–C', options: BIAS },
                            { id: 'bs-3', type: 'pick', q: 'PNP รอยต่อ B–E', options: BIAS },
                            { id: 'bs-4', type: 'pick', q: 'PNP รอยต่อ B–C', options: BIAS }
                        ]
                    },
                    {
                        title: 'ตอนที่ 3 ทรานซิสเตอร์ทำงานขยาย ขาต่อไปนี้ต่อกับขั้วใดของแหล่งจ่าย',
                        items: [
                            { id: 'pl-1', type: 'pick', q: 'NPN ขา E', options: POL },
                            { id: 'pl-2', type: 'pick', q: 'NPN ขา C', options: POL },
                            { id: 'pl-3', type: 'pick', q: 'PNP ขา E', options: POL },
                            { id: 'pl-4', type: 'pick', q: 'PNP ขา C', options: POL }
                        ]
                    }
                ]
            },
            {
                id: 's4', title: 'ชุดที่ 4 การวัดทรานซิสเตอร์ (หัวข้อ 4.4)',
                parts: [
                    {
                        title: 'ตอนที่ 1 มิเตอร์เข็มย่าน R×10 (สายดำ = ไฟบวก) ต่อแบบนี้ เข็มขึ้นหรือไม่',
                        items: [
                            { id: 'nd-1', type: 'pick', q: mt('npn', 'E', 'B'), options: NEEDLE },
                            { id: 'nd-2', type: 'pick', q: mt('npn', 'B', 'C'), options: NEEDLE },
                            { id: 'nd-3', type: 'pick', q: mt('pnp', 'B', 'C'), options: NEEDLE },
                            { id: 'nd-4', type: 'pick', q: mt('pnp', 'C', 'B'), options: NEEDLE }
                        ]
                    },
                    {
                        title: 'ตอนที่ 2 อ่านผลการวัดด้วยมิเตอร์เข็มย่าน R×10 แล้วตอบ',
                        items: [
                            { id: 'ms-1', type: 'pick', q: 'ตัว A: สายดำขา 1 สายแดงขา 2 เข็มขึ้น · สายดำขา 1 สายแดงขา 3 เข็มขึ้น · สลับสายแล้วไม่ขึ้น <b>ขาเบสคือ</b>', options: LEG3 },
                            { id: 'ms-2', type: 'pick', q: 'ตัว A เป็นชนิดใด', options: TYPE },
                            { id: 'ms-3', type: 'pick', q: 'ตัว B: สายแดงขา 3 สายดำขา 1 เข็มขึ้น · สายแดงขา 3 สายดำขา 2 เข็มขึ้น · สลับสายแล้วไม่ขึ้น <b>ขาเบสคือ</b>', options: LEG3 },
                            { id: 'ms-4', type: 'pick', q: 'ตัว B เป็นชนิดใด', options: TYPE }
                        ]
                    },
                    {
                        title: 'ตอนที่ 3 หาขา E ด้วยย่าน R×10k (เข็มขยับเล็กน้อยเพียงทางเดียว)',
                        items: [
                            { id: 'em-1', type: 'pick', q: 'NPN เบสคือขา 2 · สายดำขา 3 สายแดงขา 1 เข็มขยับเล็กน้อย สลับสายแล้วไม่ขึ้น <b>ขา E คือ</b>', options: LEG3 },
                            { id: 'em-2', type: 'pick', q: 'PNP เบสคือขา 2 · สายดำขา 3 สายแดงขา 1 เข็มขยับเล็กน้อย สลับสายแล้วไม่ขึ้น <b>ขา E คือ</b>', options: LEG3 }
                        ]
                    },
                    {
                        title: 'ตอนที่ 4 ผลการวัดแบบนี้ ทรานซิสเตอร์มีสภาพอย่างไร',
                        items: [
                            { id: 'st-1', type: 'pick', q: 'B–E และ B–C เข็มขึ้นทางเดียว · C–E ไม่ขึ้นทั้งสองทาง', options: STATE },
                            { id: 'st-2', type: 'pick', q: 'C–E เข็มขึ้นเต็มสเกลทั้งสองทาง', options: STATE },
                            { id: 'st-3', type: 'pick', q: 'B–E เข็มไม่ขึ้นเลยทั้งสองทาง', options: STATE },
                            { id: 'st-4', type: 'pick', q: 'สลับสายวัดแล้วได้ค่าความต้านทานต่ำเท่ากัน', options: STATE }
                        ]
                    },
                    {
                        title: 'ตอนที่ 5 มิเตอร์ดิจิทัลย่านไดโอด (สายแดง = ไฟบวก)',
                        items: [
                            { id: 'dm-1', type: 'pick', q: 'สายแดงที่ขาเบส สายดำแตะอีกสองขา จออ่านได้ 0.68 V และ 0.66 V <b>ชนิดคือ</b>', options: TYPE },
                            { id: 'dm-2', type: 'pick', q: 'จากข้อที่แล้ว ขาที่อ่านได้ 0.68 V (สูงกว่า) คือขาใด', options: ['E', 'C'] }
                        ]
                    }
                ]
            },
            {
                id: 's5', title: 'ชุดที่ 5 เขียนอธิบาย (ครูตรวจ)', write: true,
                parts: [
                    {
                        title: 'ตอบคำถามต่อไปนี้ด้วยภาษาของตัวเอง',
                        items: [
                            { id: 'w-1', type: 'write', q: 'อธิบายการทำงานของทรานซิสเตอร์ชนิด NPN เมื่อไบแอสให้ทำงานขยาย', hint: 'B–E ไบแอสอะไร B–C ไบแอสอะไร · เบสบางมาก · I<sub>B</sub> น้อยคุม I<sub>C</sub>' },
                            { id: 'w-2', type: 'write', q: 'เขียนขั้นตอนการวัดหาขาเบส ชนิด และขา E ของทรานซิสเตอร์ด้วยมิเตอร์เข็ม', hint: 'ย่าน R×10 และ R×10k · สายดำของมิเตอร์เข็มเป็นไฟบวก' },
                            { id: 'w-3', type: 'write', q: 'ทรานซิสเตอร์ β = 150 ต้องการ I<sub>C</sub> = 6 mA ต้องจ่าย I<sub>B</sub> เท่าไร และ I<sub>E</sub> เป็นเท่าไร แสดงวิธีทำ', hint: 'I<sub>B</sub> = I<sub>C</sub> ÷ β · I<sub>E</sub> = I<sub>B</sub> + I<sub>C</sub> · ระวังหน่วย µA กับ mA' }
                        ]
                    }
                ]
            }
        ]
    };
})();
