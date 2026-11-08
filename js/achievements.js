// Prestaties: van klein tot groot, zodat er altijd iets is om naartoe te werken.
// Ze worden steeds uit je voortgang AFGELEID, dus alles wat je al deed telt direct mee. Alleen een handvol "gebeurtenissen"
// (bijv. een leertimer afronden) wordt apart onthouden. Behaalde prestaties blijven behaald, ook als je score later zakt.
import * as store from './store.js';

/** Verzamelt de cijfers waarop de prestaties zijn gebaseerd. */
export function buildCtx({ chapters, chapterOf, theoryOf, expected }) {
  const recs = store.allRecords();
  const c = { answers: 0, correct: 0, seen: 0, stable: 0, box5: 0, recovered: 0, wrongEver: 0, byCh: {} };
  for (const ch of chapters) if (ch.count > 0) c.byCh[ch.n] = { total: ch.count, seen: 0, stable: 0, tried: 0 };
  for (const [id, r] of Object.entries(recs)) {
    if (!r || !(r.a > 0)) continue;
    c.answers += r.a; c.correct += r.ok; c.seen++;
    const b = store.boxOf(r);
    if (b >= 3) c.stable++;
    if (b >= 5) c.box5++;
    if (r.a > r.ok) { c.wrongEver++; if (r.l) c.recovered++; }
    const o = c.byCh[chapterOf(id)];
    if (o) { o.seen++; if (b >= 3) o.stable++; }
  }
  const chs = Object.values(c.byCh);
  c.bank = chs.reduce((a, o) => a + o.total, 0);
  c.chaptersAll = chs.filter(o => o.seen >= o.total).length;
  c.chaptersMaster = chs.filter(o => o.seen >= o.total && o.stable >= 0.8 * o.total).length;
  c.chaptersTried = chs.filter(o => o.seen > 0).length;
  c.chaptersN = chs.length;
  c.pondCleared = store.pondIds().length === 0 && c.wrongEver >= 10;
  const days = store.dayCounts();
  c.bestDay = Math.max(0, ...Object.values(days));
  c.daysActive = Object.values(days).filter(n => n > 0).length;
  c.streak = store.bestStreak(1);
  c.weekend = Object.keys(days).some(k => { const d = new Date(k + 'T12:00:00'); if (d.getDay() !== 6 || !days[k]) return false; const n = new Date(d); n.setDate(n.getDate() + 1); return days[store.dayKey(n.getTime())] > 0; });
  const ex = store.getExams().filter(e => e.total > 0 && Number.isFinite(e.score));
  const on50 = e => e.score / e.total * 50;
  c.exams = ex.length;
  c.examsPassed = ex.filter(e => e.pass).length;
  c.examBest = Math.max(0, ...ex.map(on50));
  c.examPerfect = ex.some(e => e.score >= e.total);
  c.examFast = ex.some(e => e.pass && e.secs > 0 && e.secs <= 45 * 60);
  let read = 0, chRead = 0;
  for (const ch of chapters.filter(x => x.theory)) {
    const t = theoryOf(ch.n); if (!t) continue;
    const secs = t.sections.filter(s => !t.groups.has(s.id) && !s.title.startsWith('Uitwerkingen'));
    const r = secs.filter(s => store.isRead(`hs${ch.n}:${s.id}`)).length;
    read += r; if (secs.length && r >= 0.8 * secs.length) chRead++;
  }
  c.read = read; c.chaptersRead = chRead; c.theoryChapters = chapters.filter(x => x.theory).length;
  const cards = Object.entries(store.allCards());
  c.cards = cards.filter(([k, r]) => !k.includes(':f:') && r.ok > 0).length;
  c.formula = cards.filter(([k, r]) => k.includes(':f:') && r.a > 0).length;
  c.flagged = store.flaggedIds().length;
  c.expected = expected;
  c.ev = store.achievements();
  return c;
}

const S = (id, group, icon, title, desc, steps, value, unit = '') => ({ id, group, icon, title, desc, steps, value, unit });
// steps: [aantal, naam, (optioneel) eigen beschrijving]
export const SERIES = [
  S('answers', 'Oefenen', '✍️', 'Vragen beantwoord', n => `Beantwoord ${n} ${n === 1 ? 'vraag' : 'vragen'}`,
    [[1, 'Eerste stap'], [10, 'Warmgedraaid'], [50, 'Op dreef'], [100, 'Honderd!'], [250, 'Doorzetter'], [500, 'Vijfhonderd'], [1000, 'Duizend vragen'], [2500, 'Marathonloper'], [5000, 'Vragenmeester']], c => c.answers),
  S('correct', 'Oefenen', '🎯', 'Goede antwoorden', n => `Geef ${n} goede antwoorden`,
    [[50, 'Raak!'], [250, 'Scherpschutter'], [1000, 'Nauwkeurig'], [2500, 'Meesterschutter']], c => c.correct),
  S('seen', 'Oefenen', '🔭', 'Verschillende vragen gezien', n => `Zie ${n} verschillende examenvragen`,
    [[25, 'Verkenner'], [100, 'Ontdekker'], [250, 'Kaartlezer'], [500, 'Veelzijdig'], [1000, 'Bijna alles']], c => c.seen),
  S('seenall', 'Oefenen', '🌍', 'Alle vragen gezien', () => 'Zie elke vraag uit de vragenbank minstens één keer', [[1, 'Alles gezien']], c => (c.bank && c.seen >= c.bank ? 1 : 0)),
  S('tried', 'Oefenen', '🧭', 'Alle hoofdstukken', () => 'Beantwoord in elk hoofdstuk minstens één vraag', [[1, 'Wereldreiziger']], c => (c.chaptersN && c.chaptersTried >= c.chaptersN ? 1 : 0)),
  S('flag', 'Oefenen', '🔖', 'Markeren', n => (n === 1 ? 'Markeer je eerste vraag' : `Heb ${n} vragen tegelijk gemarkeerd`), [[1, 'Bladwijzer'], [10, 'Scherpe ogen']], c => c.flagged),

  S('streak', 'Dagelijks', '🔥', 'Dagen op rij', n => `Leer ${n} dagen achter elkaar`,
    [[3, 'Drie op rij'], [7, 'Een week vol'], [14, 'Twee weken'], [30, 'Een maand'], [60, 'Twee maanden'], [100, 'Honderd dagen']], c => c.streak),
  S('daysactive', 'Dagelijks', '📅', 'Dagen geleerd', n => `Leer op ${n} verschillende dagen`, [[5, 'Vaste klant'], [15, 'Regelmaat'], [30, 'Dertig dagen'], [60, 'Veteraan']], c => c.daysActive),
  S('bestday', 'Dagelijks', '⚡', 'Topdag', n => `Doe ${n} vragen of kaarten op één dag`, [[25, 'Goed bezig'], [50, 'Flinke dag'], [100, 'Honderd in één dag'], [200, 'Beresterk']], c => c.bestDay),
  S('weekend', 'Dagelijks', '🏖️', 'Weekend', () => 'Leer op zowel zaterdag als zondag van hetzelfde weekend', [[1, 'Weekendstudent']], c => (c.weekend ? 1 : 0)),
  S('timer1', 'Dagelijks', '⏱️', 'Leertimer', () => 'Rond een leertimer helemaal af', [[1, 'Tijd om!']], c => (c.ev.timer1 !== undefined ? 1 : 0)),

  S('exams', 'Examens', '📝', 'Proefexamens', n => `Maak ${n} ${n === 1 ? 'proefexamen' : 'proefexamens'}`, [[1, 'Eerste examen'], [3, 'Examenroutine'], [10, 'Examenveteraan']], c => c.exams),
  S('passed', 'Examens', '🎓', 'Geslaagd', n => `Slaag voor ${n} ${n === 1 ? 'proefexamen' : 'proefexamens'}`, [[1, 'Geslaagd!'], [3, 'Drie keer geslaagd'], [5, 'Slaaggarantie'], [10, 'Examenkampioen']], c => c.examsPassed),
  S('exam45', 'Examens', '🌟', 'Bijna perfect', () => 'Haal minstens 45 van 50 op een proefexamen', [[1, 'Bijna perfect']], c => (c.examBest >= 45 ? 1 : 0)),
  S('exam50', 'Examens', '💯', 'Foutloos examen', () => 'Haal alles goed op een proefexamen', [[1, 'Foutloos']], c => (c.examPerfect ? 1 : 0)),
  S('examfast', 'Examens', '🚀', 'Snelle denker', () => 'Slaag voor een proefexamen in 45 minuten of minder', [[1, 'Snelle denker']], c => (c.examFast ? 1 : 0)),
  S('expected', 'Examens', '📈', 'Verwachte score', n => `Haal een verwachte examenscore van ${n} van 50 (zie Voortgang)`, [[25, 'Op weg'], [35, 'Op slagingsgrens'], [42, 'Examenklaar'], [47, 'Topvorm']], c => c.expected),

  S('stable', 'Beheersing', '🧱', 'Stevige vragen', n => `Maak ${n} vragen stevig (meerdere keren goed, over dagen)`, [[10, 'Eerste fundament'], [50, 'Wortel geschoten'], [100, 'Stevig'], [250, 'Rotsvast'], [500, 'Granieten kennis'], [1000, 'Onverwoestbaar']], c => c.stable),
  S('box5', 'Beheersing', '🧠', 'Langetermijngeheugen', n => `Breng ${n} vragen naar de hoogste herhaalbox`, [[10, 'Blijvertje'], [50, 'Geheugenkunstenaar'], [200, 'Olifantengeheugen']], c => c.box5),
  S('recovered', 'Beheersing', '🪴', 'Van fout naar goed', n => `Beantwoord ${n} vragen goed die je eerder fout had`, [[10, 'Leren van fouten'], [50, 'Terugvechter'], [150, 'Feniks']], c => c.recovered),
  S('pond', 'Beheersing', '🌊', 'Foutenvijver leeg', () => 'Maak je foutenvijver helemaal leeg (na minstens 10 fouten)', [[1, 'Schoon schip']], c => (c.pondCleared ? 1 : 0)),
  S('chseen', 'Beheersing', '📘', 'Hoofdstuk compleet', n => (n === 99 ? 'Zie alle vragen van elk hoofdstuk' : `Zie alle vragen van ${n} ${n === 1 ? 'hoofdstuk' : 'hoofdstukken'}`), [[1, 'Eerste hoofdstuk'], [5, 'Vijf hoofdstukken'], [99, 'Alle hoofdstukken']], c => (c.chaptersN ? (c.chaptersAll >= c.chaptersN ? 99 : c.chaptersAll) : 0)),
  S('chmaster', 'Beheersing', '🏅', 'Hoofdstukmeester', n => (n === 99 ? 'Beheers elk hoofdstuk' : `Beheers ${n} ${n === 1 ? 'hoofdstuk' : 'hoofdstukken'} (alles gezien en 80% stevig)`), [[1, 'Hoofdstukmeester'], [3, 'Drie hoofdstukken'], [6, 'Zes hoofdstukken'], [10, 'Tien hoofdstukken'], [99, 'Alles beheerst']], c => (c.chaptersN ? (c.chaptersMaster >= c.chaptersN ? 99 : c.chaptersMaster) : 0)),

  S('read', 'Theorie', '📖', 'Theorie gelezen', n => `Lees ${n} theorieparagrafen`, [[1, 'Eerste paragraaf'], [10, 'Lezer'], [25, 'Boekenwurm'], [50, 'Studiehoofd'], [100, 'Bibliotheek'], [200, 'Theoriemeester']], c => c.read),
  S('chread', 'Theorie', '📚', 'Hoofdstukken uitgelezen', n => `Lees ${n} theoriehoofdstukken (80% van de paragrafen)`, [[1, 'Eerste hoofdstuk uit'], [3, 'Drie uit'], [6, 'Alles uit']], c => c.chaptersRead),
  S('cards', 'Theorie', '🗂️', 'Flashcards gekend', n => `Ken ${n} flashcards`, [[10, 'Kaartenstarter'], [50, 'Kaartenlegger'], [150, 'Kaartenmeester'], [300, 'Kaartenkoning']], c => c.cards),
  S('formula', 'Theorie', '🧮', 'Formulespel', n => `Oefen ${n} onderdelen in het formulespel`, [[5, 'Formulevoeler'], [15, 'Formulefan'], [30, 'Formulegoeroe']], c => c.formula),
];

/** Alle prestaties met voortgang. Een prestatie telt als behaald als hij ooit is vastgelegd OF nu voldaan is. */
export function evaluate(ctx) {
  const ac = store.achievements(), out = [];
  for (const s of SERIES) {
    const cur = s.value(ctx);
    s.steps.forEach(([n, name], i) => {
      const id = `${s.id}${s.steps.length > 1 || n > 1 ? '-' + n : ''}`;
      const sat = cur >= n, at = ac[id];
      out.push({
        id, group: s.group, icon: s.icon, series: s.title, name,
        desc: s.desc(n), cur: Math.min(cur, n), target: n, sat, done: sat || at !== undefined, at,
        tier: s.steps.length === 1 ? 1 : Math.min(2, Math.floor(i / Math.max(1, s.steps.length / 3))),
      });
    });
  }
  return out;
}

export const RANKS = [[0, 'Luisteramateur'], [0.1, 'Beginnend zendamateur'], [0.25, 'CQ-roeper'], [0.45, 'QSO-maker'], [0.65, 'Contester'], [0.85, 'DX’er'], [1, 'Radiogoeroe']];
export const rankFor = frac => RANKS.filter(r => frac >= r[0]).pop()[1];
export const GROUPS = ['Oefenen', 'Dagelijks', 'Examens', 'Beheersing', 'Theorie'];
