// Jam durumu: saat, faz, zaman kutuları, kontrol noktaları, eleştirmen zamanı ve açık görevler.
// Lider her döngü adımına bununla başlar: node scripts/durum.mjs
import { DEADLINE, FREEZE, THEME, jamStatus, trTime } from './jam-lib.mjs';

const s = jamStatus();
const until = (ms) => {
  const m = Math.max(0, Math.round((ms - s.t) / 60000));
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
};

console.log(
  [
    `Saat (UTC+3): ${trTime(s.t)}`,
    `Faz: ${s.phase}`,
    `Temaya: ${until(THEME)} · Kod dondurmaya: ${until(FREEZE)} · Son teslime: ${until(DEADLINE)}`,
    `Konsept seçildi mi: ${s.conceptChosen ? 'evet' : 'hayır'}`,
    `Kontrol 1 (konsept): ${s.checkpoints.k1} · Kontrol 2 (ara test): ${s.checkpoints.k2} · Kontrol 3 (teslim): ${s.checkpoints.k3}`,
    `Son eleştirmen: ${s.critic}`,
    `Açık görevler: ${s.open} (teknik ${s.counts.teknik}, takım ${s.counts.takim})`,
    ...s.todo.map((x) => `→ ${x}`),
  ].join('\n'),
);
