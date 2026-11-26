// PortWatch VI -> ntfy: schickt eine Push, sobald sich die Overall-%-Zahl ändert.
import { readFile, writeFile } from 'node:fs/promises';

const SITE = process.env.SITE || 'https://portwatch-vi.xyz';
const TOPIC = process.env.NTFY_TOPIC || 'portwatch-vi';
const DRY_RUN = !!process.env.DRY_RUN; // zum Testen: nichts senden
const STATE = 'state.json';

const get = async (url) => {
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.text();
};

// Live-Scoring der Seite laden, damit die Zahl immer exakt der Webseite entspricht
const scoringSrc = process.env.SCORING_FILE
  ? await readFile(process.env.SCORING_FILE, 'utf8')
  : await get(`${SITE}/assets/js/scoring.js`);
const { overall } = await import('data:text/javascript;base64,' + Buffer.from(scoringSrc).toString('base64'));

const data = JSON.parse(process.env.DATA_FILE
  ? await readFile(process.env.DATA_FILE, 'utf8')
  : await get(`${SITE}/data/tracker.json?t=${Date.now()}`));

const ov = overall(data.efforts.filter((e) => !e.nuked));
const score = Math.round(ov.score * 10) / 10;
const leader = ov.leader?.effort?.name || '?';
console.log(`Aktuell: ${score}% (Leader: ${leader})`);

let prev = null;
try { prev = JSON.parse(await readFile(STATE, 'utf8')); } catch {}

if (prev && prev.score === score) { console.log('Keine Änderung.'); process.exit(0); }

if (prev) {
  const diff = Math.round((score - prev.score) * 10) / 10;
  const up = diff > 0;
  const body = `${prev.score}% → ${score}% (${up ? '+' : ''}${diff})\nLeader: ${leader}` +
    (prev.leader !== leader ? ` (vorher ${prev.leader})` : '');
  const headers = {
    Title: `PortWatch VI: jetzt ${score}%`,
    Tags: up ? 'chart_with_upwards_trend' : 'chart_with_downwards_trend',
    Priority: up ? 'high' : 'default',
    Click: SITE,
  };
  if (DRY_RUN) {
    console.log('[DRY_RUN] würde senden:', headers.Title, '|', body.replace(/\n/g, ' | '));
  } else {
    const r = await fetch(`https://ntfy.sh/${TOPIC}`, { method: 'POST', body, headers });
    console.log('ntfy:', r.status, body.replace(/\n/g, ' | '));
  }
} else {
  console.log('Erster Lauf: Startwert gespeichert, keine Push.');
}

await writeFile(STATE, JSON.stringify({ score, leader, at: new Date().toISOString() }, null, 2) + '\n');
