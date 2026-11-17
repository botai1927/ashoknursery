import type { AdminActivityLogItem, BrahmyamanPlant } from '../../types/nursery';
import { PUJA_IMAGE } from '../../data/brahmyamanCatalog';
import { getBengaliDateTime } from '../../utils/bengaliDateTime';
import { resolvePlantImageUrl } from '../../utils/imageUrl';
import {
  SPARK_DAILY_LIMITS,
  formatBytesReadable,
  type StoredMonitorState,
} from '../../utils/firestoreMonitor';
import type { DbHealthAlert, DbHealthMetrics, ServerDocCounts } from './adminTypes';

export function computeDbHealthMetrics(params: {
  plants: BrahmyamanPlant[];
  activityLogs: AdminActivityLogItem[];
  dbMonitorStats: StoredMonitorState;
  serverDocCounts: ServerDocCounts;
}): DbHealthMetrics {
  const { plants, activityLogs, dbMonitorStats, serverDocCounts } = params;

  let totalPlantBytes = 0;
  let largestPlantBytes = 0;
  let largestPlantName = '';
  let base64PhotoCount = 0;

  for (const plant of plants) {
    const bytes = new TextEncoder().encode(JSON.stringify(plant)).length;
    totalPlantBytes += bytes;
    if (bytes > largestPlantBytes) {
      largestPlantBytes = bytes;
      largestPlantName = plant.nameBn;
    }
    const hasBase64Slot = [plant.image, ...(Array.isArray(plant.images) ? plant.images : [])].some(
      (u) => typeof u === 'string' && u.startsWith('data:image')
    );
    if (hasBase64Slot) {
      base64PhotoCount += 1;
    }
  }

  const totalLogsBytes = new TextEncoder().encode(JSON.stringify(activityLogs)).length;
  const totalEstimatedBytes = totalPlantBytes + totalLogsBytes;
  const effectivePlantDocs = serverDocCounts.plants ?? plants.length;
  const effectiveLogsDocs = serverDocCounts.logs ?? activityLogs.length;
  const effectiveTotalDocs = serverDocCounts.total ?? effectivePlantDocs + effectiveLogsDocs + 1;

  const today = dbMonitorStats.today;
  const readsPct = Math.min(100, Math.round((today.serverReads / SPARK_DAILY_LIMITS.reads) * 100));
  const writesPct = Math.min(100, Math.round((today.writes / SPARK_DAILY_LIMITS.writes) * 100));
  const deletesPct = Math.min(100, Math.round((today.deletes / SPARK_DAILY_LIMITS.deletes) * 100));
  const storagePct = Math.min(
    100,
    Number(((totalEstimatedBytes / SPARK_DAILY_LIMITS.storageBytes) * 100).toFixed(2))
  );
  const largestDocPct = Math.min(
    100,
    Math.round((largestPlantBytes / SPARK_DAILY_LIMITS.maxDocBytes) * 100)
  );

  const readsPerFreshVisitor = Math.max(1, effectivePlantDocs + 1);
  const estimatedDailyVisitorCapacity = Math.floor(SPARK_DAILY_LIMITS.reads / readsPerFreshVisitor);

  const alerts: DbHealthAlert[] = [];

  if (today.serverReads >= SPARK_DAILY_LIMITS.reads * 0.85) {
    alerts.push({
      id: 'reads-critical',
      severity: 'critical',
      titleBn: `জরুরি: দৈনিক রিড ${readsPct}% পূর্ণ (${today.serverReads.toLocaleString()}/৫০,০০০)`,
      detailBn:
        'আজকের Spark ফ্রি দৈনিক রিড সীমা প্রায় শেষ। লিমিট পার হলে ভিজিটররা নতুন আপডেট দেখতে সমস্যায় পড়বেন।',
      actionBn: 'ক্যাটালগ ক্যাশিং চালু করুন অথবা Firebase Blaze প্ল্যানে বাজেট অ্যালার্ট সহ আপগ্রেড করুন।',
    });
  } else if (today.serverReads >= SPARK_DAILY_LIMITS.reads * 0.7) {
    alerts.push({
      id: 'reads-warning',
      severity: 'warning',
      titleBn: `সতর্কতা: দৈনিক রিড ${readsPct}% ছুঁয়েছে`,
      detailBn: `আজ ${today.serverReads.toLocaleString()} টি সার্ভার রিড হয়েছে (ফ্রি লিমিট ৫০,০০০/দিন)।`,
      actionBn: 'রিড অপ্টিমাইজেশন করলে একই ভিজিটরে ৫০ গুণ কম রিড খরচ হবে।',
    });
  }

  if (today.writes >= SPARK_DAILY_LIMITS.writes * 0.7) {
    alerts.push({
      id: 'writes-threshold',
      severity: today.writes >= SPARK_DAILY_LIMITS.writes * 0.85 ? 'critical' : 'warning',
      titleBn: `দৈনিক রাইট সীমা ${writesPct}% (${today.writes.toLocaleString()}/২০,০০০)`,
      detailBn: 'একই দিনে ঘনঘন ক্যাটালগ এডিট বা বেশি লগ লেখার কারণে রাইট সংখ্যা বাড়ছে।',
      actionBn: 'সব এডিট একসাথে সেরে সেভ করুন ও ব্যাকআপ রাখুন।',
    });
  }

  if (largestPlantBytes >= 750 * 1024) {
    alerts.push({
      id: 'doc-size-critical',
      severity: 'critical',
      titleBn: `১ MB ডকুমেন্ট সীমার কাছে: "${largestPlantName}" (${formatBytesReadable(largestPlantBytes)})`,
      detailBn: 'Firestore-এ একটি ডকুমেন্টের সর্বোচ্চ সীমা ১ MB। এর বেশি হলে সেই চারা সেভ হওয়া বন্ধ হয়ে যাবে।',
      actionBn: 'এই চারার ছবিটি ছোট করে আপলোড করুন বা Cloudinary লিংক ব্যবহার করুন।',
    });
  } else if (largestPlantBytes >= 500 * 1024) {
    alerts.push({
      id: 'doc-size-warning',
      severity: 'warning',
      titleBn: `বড় ডকুমেন্ট সাইজ: "${largestPlantName}" (${formatBytesReadable(largestPlantBytes)})`,
      detailBn: 'মোবাইল ছবির সাইজ ৫০০ KB পেরিয়েছে (১ MB সীমার কাছাকাছি)।',
      actionBn: 'ছবি কমপ্রেস করে সেভ করলে ডেটা ট্রান্সফার দ্রুত ও নিরাপদ থাকবে।',
    });
  }

  if (effectiveLogsDocs >= 400) {
    alerts.push({
      id: 'logs-critical',
      severity: 'critical',
      titleBn: `অ্যাক্টিভিটি লগ অনেক জমেছে (${effectiveLogsDocs} টি ডকুমেন্ট)`,
      detailBn: 'পুরনো অ্যাক্টিভিটি লগ জমতে থাকায় অযথা স্টোরেজ ও রিড খরচ বাড়ছে।',
      actionBn: 'পুরনো লগ অটো-ক্লিনআপ চালু করুন (সর্বশেষ ১০০টি রেখে)।',
    });
  } else if (effectiveLogsDocs >= 150) {
    alerts.push({
      id: 'logs-warning',
      severity: 'warning',
      titleBn: `পুরনো অ্যাক্টিভিটি লগ বাড়ছে (${effectiveLogsDocs} টি ডকুমেন্ট)`,
      detailBn: 'লগ সংখ্যা ১৫০ ছাড়িয়েছে; দীর্ঘমেয়াদে হালকা রাখতে পুরনো লগ পরিষ্কার রাখা ভালো।',
      actionBn: 'প্রয়োজনে পুরনো লগ ক্লিনআপ নীতি চালু করুন।',
    });
  }

  if (base64PhotoCount >= 35) {
    alerts.push({
      id: 'base64-growth',
      severity: 'warning',
      titleBn: `${base64PhotoCount}টি মোবাইল ছবি সরাসরি ডাটাবেসে সেভ আছে`,
      detailBn: 'বেশি মোবাইল ছবি Firestore-এ থাকলে প্রতি পেজ লোডে ব্যান্ডউইথ (১০ GiB/মাস) দ্রুত খরচ হয়।',
      actionBn: 'Cloudinary ট্যাবে গিয়ে ১-ক্লিকে সব Base64 ছবি মাইগ্রেট করুন।',
    });
  }

  if (estimatedDailyVisitorCapacity < 500) {
    alerts.push({
      id: 'visitor-headroom',
      severity: 'warning',
      titleBn: `দৈনিক ভিজিটর ক্যাপাসিটি কমছে (~${estimatedDailyVisitorCapacity} জন/দিন)`,
      detailBn: `মোট ${effectivePlantDocs}টি চারা থাকায় প্রতি নতুন ভিজিটরে ${readsPerFreshVisitor}টি রিড হচ্ছে।`,
      actionBn: 'রিড-সেভিং ক্যাশ চালু করলে এই সীমা কয়েক হাজার ভিজিটর পর্যন্ত বাড়বে।',
    });
  }

  const statusLevel: 'healthy' | 'warning' | 'critical' = alerts.some((a) => a.severity === 'critical')
    ? 'critical'
    : alerts.length > 0
    ? 'warning'
    : 'healthy';

  return {
    totalPlantBytes,
    totalLogsBytes,
    totalEstimatedBytes,
    largestPlantBytes,
    largestPlantName,
    largestDocPct,
    base64PhotoCount,
    effectivePlantDocs,
    effectiveLogsDocs,
    effectiveTotalDocs,
    readsPct,
    writesPct,
    deletesPct,
    storagePct,
    readsPerFreshVisitor,
    estimatedDailyVisitorCapacity,
    alerts,
    statusLevel,
  };
}

export async function inlineImageAsDataUrl(rawSrc: string): Promise<string> {
  const resolved = resolvePlantImageUrl(rawSrc, PUJA_IMAGE);
  if (!resolved) return '';
  if (resolved.startsWith('data:image/')) return resolved;

  const canvasAttempt = (): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => resolve(null), 6000);
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const maxDim = 520;
          let w = img.naturalWidth || 400;
          let h = img.naturalHeight || 400;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.max(1, Math.round((h * maxDim) / w));
              w = maxDim;
            } else {
              w = Math.max(1, Math.round((w * maxDim) / h));
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const encoded = canvas.toDataURL('image/jpeg', 0.72);
          resolve(encoded && encoded.startsWith('data:image/') ? encoded : null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = resolved;
    });

  const viaCanvas = await canvasAttempt();
  if (viaCanvas) return viaCanvas;

  try {
    const res = await fetch(resolved, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (dataUrl.startsWith('data:image/')) return dataUrl;
    }
  } catch {}
  return resolved;
}

export async function buildPrintablePhotoCatalogHtml(activePlants: BrahmyamanPlant[]): Promise<string> {
  const esc = (s: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const plantsEmbedded = await Promise.all(
    activePlants.map(async (p) => ({
      ...p,
      embeddedImg: await inlineImageAsDataUrl(p.image),
    }))
  );

  const dt = getBengaliDateTime();
  const cardsHtml = plantsEmbedded
    .map((p) => {
      const optsHtml = (p.options || [])
        .map((o) => `<div class="price-row"><span>${esc(o.labelBn)}</span><strong>₹${o.price}</strong></div>`)
        .join('');
      return `<article class="card">
        <img src="${p.embeddedImg || ''}" alt="${esc(p.nameBn)}" />
        <div class="body">
          <div class="badges">
            <span class="cat">${esc(p.category)}</span>
            ${p.colorBn ? `<span class="clr">${esc(p.colorBn)}</span>` : ''}
            <span class="${p.inStock === false ? 'out' : 'in'}">${p.inStock === false ? 'স্টক শেষ' : 'স্টকে আছে'}</span>
          </div>
          <h2>${esc(p.nameBn)}</h2>
          <p class="en">${esc(p.nameEn)}${p.botanicalName ? ` · <em>${esc(p.botanicalName)}</em>` : ''}</p>
          <div class="prices">${optsHtml}</div>
          <p class="desc">${esc(p.descriptionBn)}</p>
          <div class="care">
            <div><strong>রোদ:</strong> ${esc(p.sunlightBn)}</div>
            <div><strong>জল:</strong> ${esc(p.wateringBn)}</div>
            <div><strong>মাটি:</strong> ${esc(p.soilTipBn)}</div>
          </div>
        </div>
      </article>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ভ্রাম্যমাণ নার্সারি - সম্পূর্ণ ফটো ও দাম ক্যাটালগ (${dt.dateBn})</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #FAF7F2; color: #142318; }
  .top { max-width: 1100px; margin: 0 auto 20px; background: #142318; color: #fff; padding: 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .top h1 { margin: 0 0 6px; font-size: 22px; }
  .top p { margin: 0; font-size: 13px; color: #CBE5D2; }
  .print-btn { background: #A3E635; color: #142318; border: 0; padding: 12px 18px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; }
  .grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
  .card { background: #fff; border: 1px solid #E8E1D5; border-radius: 16px; overflow: hidden; break-inside: avoid; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .card img { width: 100%; height: 210px; object-fit: cover; display: block; background: #EAE4D9; }
  .body { padding: 14px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; font-size: 12px; font-weight: 700; }
  .cat { background: #F5EFE6; color: #785942; padding: 3px 8px; border-radius: 99px; }
  .clr { background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 99px; }
  .in { background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 99px; }
  .out { background: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 99px; }
  h2 { margin: 0 0 4px; font-size: 18px; }
  .en { margin: 0 0 10px; font-size: 12px; color: #526356; }
  .prices { background: #FFFBF5; border: 1px solid #EADBCC; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }
  .price-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; border-bottom: 1px dashed #EFE5D8; }
  .price-row:last-child { border-bottom: 0; }
  .price-row strong { color: #B34728; font-size: 15px; }
  .desc { font-size: 12.5px; line-height: 1.5; color: #273B2E; margin: 0 0 10px; }
  .care { font-size: 12px; color: #526356; background: #F7F5F0; padding: 8px 10px; border-radius: 10px; line-height: 1.55; }
  @media print { body { background: #fff; padding: 0; } .print-btn { display: none; } .card { box-shadow: none; } }
</style>
</head>
<body>
  <header class="top">
    <div>
      <h1>ভ্রাম্যমাণ নার্সারি · অফলাইন ফটো ও দাম ক্যাটালগ</h1>
      <p>গ্রাম: কালশুলি, বাঁকুড়া, পিন ৭২২১৬০ · হোয়াটসঅ্যাপ/ফোন: +91 86094 17672 · মোট গাছ: ${plantsEmbedded.length} টি · তারিখ: ${esc(dt.dateBn)}</p>
    </div>
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF সেভ করুন</button>
  </header>
  <main class="grid">${cardsHtml}</main>
</body>
</html>`;
}
