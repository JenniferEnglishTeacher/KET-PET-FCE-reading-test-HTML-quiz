// KET / PET listening study guide in the same 4-section layout as the FCE guides.
// Usage: node build_docx.js content.json OUT.docx repo_dir   (repo_dir is used to find question images)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, AlignmentType, Header, Footer, PageNumber, PageBreak, VerticalAlign, ImageRun,
} = require('docx');

const C = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const REPO = process.argv[4] || '.';
const N = C.TEST_NO, LV = C.LEVEL;
const CEFR = { KET: 'A1/A2', PET: 'A2/B1' }[LV] || 'B1/B2';
const FONT = 'Arial', ZH = 'Microsoft JhengHei';
const BLUE = '2F5496', DARK = '1E1E1E', GREY = '404040', LINE = 'B0C4DE', PALE = 'E8EEF5', TINT = 'F8FAFC';
const W = 10800;
const zhNum = ['一', '二', '三', '四', '五', '六'];

const run = (text, o = {}) => new TextRun({ text, font: { ascii: FONT, hAnsi: FONT, eastAsia: ZH }, size: o.size || 19, bold: o.bold, italics: o.italics, color: o.color || DARK });
const para = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [runs], spacing: { before: o.before ?? 0, after: o.after ?? 60, line: o.line || 264 }, indent: o.indent ? { left: o.indent } : undefined, alignment: o.align, keepNext: o.keepNext, keepLines: true });
const sectionTitle = t => para(run(t, { size: 26, bold: true, color: BLUE }), { before: 0, after: 80, keepNext: true });
const partTitle = (t, color = DARK) => para(run(t, { size: 22, bold: true, color }), { before: 200, after: 40, keepNext: true });
const instr = t => para(run(t, { size: 18, italics: true, color: GREY }), { after: 120, keepNext: true });
const brk = () => new Paragraph({ children: [new PageBreak()] });
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };
const cell = (children, width, o = {}) => new TableCell({
  children: Array.isArray(children) ? children : [children], width: { size: width, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  margins: { top: 70, bottom: 70, left: 110, right: 110 }, verticalAlign: o.vAlign || VerticalAlign.TOP,
});
const table = (widths, rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, borders, rows });
const headRow = (labels, widths) => new TableRow({ tableHeader: true, cantSplit: true, children: labels.map((l, i) => cell(para(run(l, { size: 18, bold: true, color: 'FFFFFF' }), { align: AlignmentType.CENTER, after: 0 }), widths[i], { fill: BLUE, vAlign: VerticalAlign.CENTER })) });
const rng = p => `${p.questions[0].n}–${p.questions[p.questions.length - 1].n}`;

function image(rel) {
  const file = path.join(REPO, rel);
  const buf = fs.readFileSync(file);
  // read JPEG size from the SOF marker
  let w = 900, h = 300;
  for (let i = 2; i < buf.length;) {
    if (buf[i] !== 0xFF) break;
    const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
    if (m >= 0xC0 && m <= 0xC3) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break; }
    i += 2 + len;
  }
  const width = 560, height = Math.round(width * h / w);
  return new Paragraph({ children: [new ImageRun({ type: 'jpg', data: buf, transformation: { width, height } })], spacing: { after: 80 }, keepNext: true, keepLines: true });
}

// ---------------------------------------------------------------- SECTION 1: question paper
const s1 = [para(run(`${LV} Listening No. ${N} — Question Paper`, { size: 30, bold: true }), { after: 120 })];
C.PARTS.forEach((p, pi) => {
  s1.push(partTitle(`${p.title} (Questions ${rng(p)})`), instr(`Instructions: ${p.instr}`));
  if (p.heading) s1.push(para(run(p.heading, { bold: true, size: 21 }), { after: 120, keepNext: true }));
  if (p.mode === 'text') {
    p.questions.forEach(q => s1.push(para([run(`${q.pre} `), run(`(${q.n}) `, { bold: true }), run('____________________', { bold: true }), run(` ${q.post || ''}`)], { after: 160, line: 300 })));
  } else if (p.shared) {
    const optCell = [para(run('Options (A–H):', { bold: true, size: 18 }), { after: 60 }), ...Object.entries(p.shared).map(([k, v]) => para([run(`[${k}]  `, { bold: true, size: 18 }), run(v, { size: 18 })], { after: 40 }))];
    const qCell = [para(run('Your answers:', { bold: true, size: 18 }), { after: 60 }), ...p.questions.map(q => para(run(`${q.n}   ${q.q}:  [  ______  ]`, { bold: true, size: 18 }), { after: 110 }))];
    s1.push(table([5400, 5400], [new TableRow({ cantSplit: true, children: [cell(qCell, 5400, { fill: TINT }), cell(optCell, 5400, { fill: TINT })] })]));
  } else {
    p.questions.forEach(q => {
      s1.push(para([run(`${q.n}  `, { bold: true, size: 20 }), run(`${q.stem ? q.stem + ' ' : ''}${q.q}`, { bold: true, size: 20 })], { before: 140, after: 50, keepNext: true }));
      if (q.img) s1.push(image(q.img));
      Object.entries(q.opts).forEach(([k, v], i, a) => s1.push(para([run(`${k}  `, { bold: true }), run(v)], { indent: 360, after: 30, keepNext: i < a.length - 1 })));
    });
  }
});

// ---------------------------------------------------------------- SECTION 2: bilingual script
const s2 = [brk(), sectionTitle('SECTION 2: BILINGUAL AUDIO SCRIPT (英漢對照聽力文本)'),
  instr('Complete English listening transcript (one playing) aligned side-by-side with Traditional Chinese (繁體中文) translation for self-learning.')];
const tw = [5400, 5400];
const rows = [];
C.PARTS.forEach((p, pi) => {
  rows.push(new TableRow({ cantSplit: true, children: [cell(para(run(`Part ${pi + 1}`, { bold: true, color: 'FFFFFF', size: 20 }), { after: 0 }), tw[0], { fill: BLUE }), cell(para(run(`第${zhNum[pi]}部分`, { bold: true, color: 'FFFFFF', size: 20 }), { after: 0 }), tw[1], { fill: BLUE })] }));
  p.script.forEach(([hEn, hZh, lines]) => {
    rows.push(new TableRow({ cantSplit: true, children: [cell(para(run(hEn, { bold: true, color: BLUE, size: 18 }), { after: 0 }), tw[0], { fill: PALE }), cell(para(run(hZh, { bold: true, color: BLUE, size: 18 }), { after: 0 }), tw[1], { fill: PALE })] }));
    rows.push(new TableRow({ children: [cell(lines.map(l => para(run(l[0], { size: 17 }), { after: 80 })), tw[0]), cell(lines.map(l => para(run(l[1], { size: 17 }), { after: 80 })), tw[1])] }));
  });
});
s2.push(table(tw, rows));

// ---------------------------------------------------------------- SECTION 3: vocabulary
const vw = [1750, 850, 1900, 1500, 2600, 2200];
const s3 = [brk(), sectionTitle(`SECTION 3: KEY VOCABULARY GUIDE (${C.VOCAB.length} 核心詞彙與短語)`),
  instr(`${C.VOCAB.length} useful CEFR ${CEFR} words and phrases from ${LV} Listening Test ${N}, with English definitions, Traditional Chinese meanings, fill-in-the-blank practice sentences and full sentence translations.`),
  table(vw, [headRow(['Word / Phrase', 'POS', 'English Definition', 'Chinese Definition', 'Fill-in-the-Blank Context Sentence', 'Complete Chinese Translation'], vw),
    ...C.VOCAB.map(([w, pos, en, zh, s, zs], i) => new TableRow({ cantSplit: true, children: [
      cell(para(run(w, { bold: true, size: 18 }), { after: 0 }), vw[0], { fill: i % 2 ? TINT : undefined }),
      cell(para(run(pos, { italics: true, size: 17, color: GREY }), { after: 0 }), vw[1], { fill: i % 2 ? TINT : undefined }),
      cell(para(run(en, { size: 17 }), { after: 0 }), vw[2], { fill: i % 2 ? TINT : undefined }),
      cell(para(run(zh, { size: 17 }), { after: 0 }), vw[3], { fill: i % 2 ? TINT : undefined }),
      cell(para(run(s, { size: 17 }), { after: 0 }), vw[4], { fill: i % 2 ? TINT : undefined }),
      cell(para(run(zs, { size: 17 }), { after: 0 }), vw[5], { fill: i % 2 ? TINT : undefined }),
    ] }))])];

// ---------------------------------------------------------------- SECTION 4: answer key
const kw = [2300, 3500, 5000];
const keyTable = items => table(kw, [headRow(['Question & Key', 'Target Answer / Option', 'Transcript Audio Clue'], kw),
  ...items.map(([k, target, ev], i) => new TableRow({ cantSplit: true, children: [
    cell(para(run(k, { bold: true, size: 18 }), { after: 0 }), kw[0], { fill: i % 2 ? TINT : undefined }),
    cell(para(run(target, { size: 18 }), { after: 0 }), kw[1], { fill: i % 2 ? TINT : undefined }),
    cell(para(run(`"${ev}"`, { italics: true, size: 17, color: GREY }), { after: 0 }), kw[2], { fill: i % 2 ? TINT : undefined }),
  ] }))]);
const total = C.PARTS.reduce((a, p) => a + p.questions.length, 0);
const s4 = [brk(), sectionTitle('SECTION 4: ANSWER KEY & AUDIO EVIDENCE'), instr(`Verified answer keys for all ${total} questions with the transcript evidence for each.`)];
C.PARTS.forEach(p => {
  s4.push(partTitle(`${p.title} (Questions ${rng(p)})`, BLUE));
  s4.push(keyTable(p.questions.map(q => {
    const key = q.key || (Array.isArray(q.ans) ? q.ans[0] : q.ans);
    const target = p.mode === 'text' ? key : p.shared ? `${q.q} — ${q.ans}: ${p.shared[q.ans]}` : q.opts[q.ans];
    return [`Q${q.n}: ${key}`, target, q.ev];
  })));
});

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 19 } } } },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 720, bottom: 720, left: 720, header: 288, footer: 288 } } },
    headers: { default: new Header({ children: [para(run(`${LV} Listening No. ${N} — Practice & Study Guide`, { size: 16, color: '808080' }), { align: AlignmentType.RIGHT })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      run(`${LV} Listening Test No. ${N}  |  Page `, { size: 17, color: '666666' }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 17, color: '666666' }),
      run(' of ', { size: 17, color: '666666' }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 17, color: '666666' }),
    ] })] }) },
    children: [...s1, ...s2, ...s3, ...s4],
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b); console.log('wrote', OUT, b.length); });
