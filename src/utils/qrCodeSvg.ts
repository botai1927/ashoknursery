import type { BrahmyamanPlant } from '../types/nursery';

/**
 * Pure TypeScript ISO/IEC 18004 QR Code Matrix & SVG Generator (Byte Mode, ECC Level L, Versions 1..10).
 * Zero external dependencies, works 100% offline in browser, server, and print popups.
 */

const NURSERY_PHONE_DISPLAY = '+91 86094 17672';

const VERSION_L_SPECS: ReadonlyArray<{
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocks: number;
  alignmentCenters: number[];
}> = [
  { totalCodewords: 0, ecCodewordsPerBlock: 0, numBlocks: 0, alignmentCenters: [] },
  { totalCodewords: 26, ecCodewordsPerBlock: 7, numBlocks: 1, alignmentCenters: [] },
  { totalCodewords: 44, ecCodewordsPerBlock: 10, numBlocks: 1, alignmentCenters: [6, 18] },
  { totalCodewords: 70, ecCodewordsPerBlock: 15, numBlocks: 1, alignmentCenters: [6, 22] },
  { totalCodewords: 100, ecCodewordsPerBlock: 20, numBlocks: 1, alignmentCenters: [6, 26] },
  { totalCodewords: 134, ecCodewordsPerBlock: 26, numBlocks: 1, alignmentCenters: [6, 30] },
  { totalCodewords: 172, ecCodewordsPerBlock: 18, numBlocks: 2, alignmentCenters: [6, 34] },
  { totalCodewords: 196, ecCodewordsPerBlock: 20, numBlocks: 2, alignmentCenters: [6, 22, 38] },
  { totalCodewords: 242, ecCodewordsPerBlock: 24, numBlocks: 2, alignmentCenters: [6, 24, 42] },
  { totalCodewords: 292, ecCodewordsPerBlock: 30, numBlocks: 2, alignmentCenters: [6, 26, 46] },
  { totalCodewords: 346, ecCodewordsPerBlock: 18, numBlocks: 4, alignmentCenters: [6, 28, 50] },
];

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function computeReedSolomonGenerator(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomonRemainder(data: Uint8Array, degree: number): Uint8Array {
  const gen = computeReedSolomonGenerator(degree);
  const rem = new Uint8Array(degree);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < degree - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    rem[degree - 1] = gfMul(gen[degree], factor);
  }
  return rem;
}

function encodeUtf8Bytes(text: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  return new Uint8Array(Buffer.from(text, 'utf8'));
}

export function createQrMatrix(text: string): boolean[][] {
  const payload = encodeUtf8Bytes(text || 'https://brahmyaman.nursery');
  let version = 1;
  while (version <= 10) {
    const spec = VERSION_L_SPECS[version];
    const dataCapacityBytes = spec.totalCodewords - spec.ecCodewordsPerBlock * spec.numBlocks;
    const headerOverheadBytes = version <= 9 ? 2 : 3;
    if (payload.length + headerOverheadBytes <= dataCapacityBytes) {
      break;
    }
    version++;
  }
  if (version > 10) version = 10;

  const spec = VERSION_L_SPECS[version];
  const totalDataCodewords = spec.totalCodewords - spec.ecCodewordsPerBlock * spec.numBlocks;
  const maxPayloadLen = Math.min(payload.length, totalDataCodewords - (version <= 9 ? 2 : 3));
  const clampedPayload = payload.slice(0, maxPayloadLen);

  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  pushBits(clampedPayload.length, version <= 9 ? 8 : 16);
  for (let i = 0; i < clampedPayload.length; i++) {
    pushBits(clampedPayload[i], 8);
  }

  const maxDataBits = totalDataCodewords * 8;
  const terminatorLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, terminatorLen);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords = new Uint8Array(totalDataCodewords);
  for (let i = 0; i < bits.length / 8; i++) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bits[i * 8 + b];
    }
    dataCodewords[i] = byte;
  }
  const padBytes = [0xec, 0x11];
  for (let i = bits.length / 8, p = 0; i < totalDataCodewords; i++, p++) {
    dataCodewords[i] = padBytes[p % 2];
  }

  const blockDataSize = Math.floor(totalDataCodewords / spec.numBlocks);
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < spec.numBlocks; b++) {
    const block = dataCodewords.slice(offset, offset + blockDataSize);
    offset += blockDataSize;
    dataBlocks.push(block);
    ecBlocks.push(computeReedSolomonRemainder(block, spec.ecCodewordsPerBlock));
  }

  const finalCodewords: number[] = [];
  for (let i = 0; i < blockDataSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) {
      finalCodewords.push(ecBlocks[b][i]);
    }
  }

  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = dark;
    isFunction[r][c] = true;
  };

  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunctionModule(r, c, inOuter && (onBorder || inCore));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    setFunctionModule(6, i, i % 2 === 0);
    setFunctionModule(i, 6, i % 2 === 0);
  }

  const centers = spec.alignmentCenters;
  for (const r of centers) {
    for (const c of centers) {
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFunctionModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  for (let i = 0; i <= 8; i++) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false);
    if (!isFunction[i][8]) setFunctionModule(i, 8, false);
    if (i < 8) {
      if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false);
      if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false);
    }
  }
  setFunctionModule(size - 8, 8, true);

  let bitIdx = 0;
  const totalBits = finalCodewords.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            const byte = finalCodewords[bitIdx >>> 3];
            dark = ((byte >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          if ((r + c) % 2 === 0) {
            dark = !dark;
          }
          modules[r][c] = dark;
        }
      }
    }
    upward = !upward;
  }

  const formatBits = 0x77c4;
  const getFormatBit = (idx: number) => ((formatBits >>> idx) & 1) === 1;

  for (let i = 0; i <= 5; i++) setFunctionModule(8, i, getFormatBit(i));
  setFunctionModule(8, 7, getFormatBit(6));
  setFunctionModule(8, 8, getFormatBit(7));
  setFunctionModule(7, 8, getFormatBit(8));
  for (let i = 9; i < 15; i++) setFunctionModule(14 - i, 8, getFormatBit(i));

  for (let i = 0; i < 8; i++) setFunctionModule(8, size - 1 - i, getFormatBit(i));
  for (let i = 8; i < 15; i++) setFunctionModule(size - 15 + i, 8, getFormatBit(i));
  setFunctionModule(size - 8, 8, true);

  return modules;
}

export function generateQrCodeSvg(
  text: string,
  sizeOrOptions: number | { size?: number; sizePx?: number } = 140
): string {
  const pixelSize =
    typeof sizeOrOptions === 'number'
      ? sizeOrOptions
      : sizeOrOptions.sizePx || sizeOrOptions.size || 140;
  const matrix = createQrMatrix(text);
  const quietZone = 3;
  const n = matrix.length;
  const totalModules = n + quietZone * 2;
  let pathData = '';

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        pathData += `M${c + quietZone},${r + quietZone}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges" role="img" aria-label="Plant QR Code"><rect width="100%" height="100%" fill="#FFFFFF"/><path d="${pathData}" fill="#142318"/></svg>`;
}

export function generateQrCodeDataUrl(
  text: string,
  sizeOrOptions: number | { size?: number; sizePx?: number } = 140
): string {
  const svg = generateQrCodeSvg(text, sizeOrOptions);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildPlantPublicUrl(plantId: string, baseOrigin?: string): string {
  const origin =
    baseOrigin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://brahmyaman-nursery.app');
  return `${origin.replace(/\/$/, '')}/?plant=${encodeURIComponent(plantId)}`;
}

/**
 * Generates a print-ready HTML document for A4 Nursery Pot QR Tags.
 * Supports both `buildPrintableQrTagSheetHtml(plants, { layout, origin })`
 * and `buildPrintableQrTagSheetHtml({ plants, layoutMode, origin })`.
 */
export function buildPrintableQrTagSheetHtml(
  plantsOrParams:
    | BrahmyamanPlant[]
    | {
        plants: BrahmyamanPlant[];
        layoutMode?: 'compact_12' | 'large_6';
        layout?: 'compact_12' | 'large_6';
        origin?: string;
      },
  options?: {
    layout?: 'compact_12' | 'large_6';
    layoutMode?: 'compact_12' | 'large_6';
    origin?: string;
  }
): string {
  const plants = Array.isArray(plantsOrParams) ? plantsOrParams : plantsOrParams.plants;
  const layoutMode = Array.isArray(plantsOrParams)
    ? options?.layout || options?.layoutMode || 'compact_12'
    : plantsOrParams.layoutMode || plantsOrParams.layout || 'compact_12';
  const origin = Array.isArray(plantsOrParams) ? options?.origin : plantsOrParams.origin;

  const esc = (s?: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const cols = layoutMode === 'compact_12' ? 3 : 2;
  const qrSize = layoutMode === 'compact_12' ? 92 : 124;

  const cardsHtml = plants
    .map((p) => {
      const url = buildPlantPublicUrl(p.id, origin);
      const svgMarkup = generateQrCodeSvg(url, qrSize);
      const price = p.options?.[0]?.price || 50;
      const optLabel = p.options?.[0]?.labelBn || 'গ্রো ব্যাগ চারা';
      return `<article class="tag-card">
        <div class="tag-top">
          <span class="nursery-name">ভ্রাম্যমাণ নার্সারি · কালশুলি</span>
          <span class="nursery-phone">${esc(NURSERY_PHONE_DISPLAY)}</span>
        </div>
        <div class="tag-main">
          <div class="tag-info">
            <div class="tag-cat">${esc(p.category)}${p.colorBn ? ` · ${esc(p.colorBn)}` : ''}</div>
            <h2 class="tag-title">${esc(p.nameBn)}</h2>
            <div class="tag-sub">${esc(p.nameEn)}${p.botanicalName ? ` (${esc(p.botanicalName)})` : ''}</div>
            <div class="tag-price-box">
              <span class="tag-price">₹${price}</span>
              <span class="tag-opt">${esc(optLabel)}</span>
            </div>
            <div class="tag-care">
              <div>☀️ ${esc(p.sunlightBn)}</div>
              <div>💧 ${esc(p.wateringBn)}</div>
            </div>
          </div>
          <div class="tag-qr">
            ${svgMarkup}
            <span class="qr-caption">স্ক্যান করে ছবি ও যত্ন দেখুন</span>
          </div>
        </div>
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<title>ভ্রাম্যমাণ নার্সারি — প্রিন্টেবল QR প্ল্যান্ট ট্যাগ (${plants.length}টি চারা)</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Noto Sans Bengali', system-ui, -apple-system, sans-serif;
    margin: 0;
    padding: 16px;
    background: #F5F2EB;
    color: #142318;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #142318;
    color: #fff;
    padding: 12px 18px;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .toolbar button {
    background: #1B8354;
    color: #fff;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    font-size: 14px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    gap: 10px;
  }
  .tag-card {
    background: #FFFFFF;
    border: 2px dashed #1B8354;
    border-radius: 12px;
    padding: 10px 12px;
    page-break-inside: avoid;
    break-inside: avoid;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .tag-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #E2E8DD;
    padding-bottom: 4px;
    margin-bottom: 6px;
    font-size: 10px;
    font-weight: 700;
    color: #1B8354;
  }
  .nursery-phone { color: #785942; font-family: monospace; }
  .tag-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .tag-info { flex: 1; min-width: 0; }
  .tag-cat { font-size: 9px; color: #785942; font-weight: 600; margin-bottom: 2px; }
  .tag-title { font-size: ${layoutMode === 'compact_12' ? '14px' : '17px'}; margin: 0 0 2px 0; color: #142318; line-height: 1.25; }
  .tag-sub { font-size: 9px; color: #526356; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag-price-box {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    background: #F3F6F1;
    border: 1px solid #D5DFD1;
    padding: 2px 8px;
    border-radius: 6px;
    margin-bottom: 5px;
  }
  .tag-price { font-size: ${layoutMode === 'compact_12' ? '15px' : '18px'}; font-weight: 800; color: #B34728; font-family: monospace; }
  .tag-opt { font-size: 9px; color: #526356; font-weight: 600; }
  .tag-care { font-size: 9px; color: #3C5042; line-height: 1.35; }
  .tag-qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #E2E8DD;
    border-radius: 8px;
    padding: 4px;
    background: #fff;
  }
  .qr-caption { font-size: 8px; font-weight: 700; color: #142318; margin-top: 2px; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none !important; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>ভ্রাম্যমাণ নার্সারি — প্রিন্টেবল QR প্ল্যান্ট ট্যাগ (${plants.length}টি চারা)</strong>
      <div style="font-size:12px;opacity:0.85;">A4 কাগজে প্রিন্ট করে লেমিনেশন বা টবের গায়ে লাগিয়ে দিন</div>
    </div>
    <button onclick="window.print()">🖨️ এখনই প্রিন্ট / PDF সেভ করুন</button>
  </div>
  <div class="grid">
    ${cardsHtml}
  </div>
</body>
</html>`;
}
