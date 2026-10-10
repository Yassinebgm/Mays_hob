/* =========================================================
   « Deux destins, un chemin vers la lune »
   Pour modifier le parcours : éditez uniquement STEPS et FINAL.
   ========================================================= */

const STEPS = [
  {
    kicker: "Une première question...",
    intro: "Pour commencer cette petite aventure, j'ai besoin de savoir quelque chose.",
    question: "Est-ce que tu aimes les chats, surtout les chatons ?",
    yes: "Oui, évidemment ♡",
    no: "Pas vraiment...",
    success: "Je m'en doutais ! Difficile de résister à ces petites boules de poils, n'est-ce pas ?",
    retry: "Oh... même avec leurs petites pattes de velours ? Les chatons aimeraient une seconde chance."
  },
  {
    question: "Et les fleurs, surtout les roses ?",
    yes: "Oui, j'adore ♡",
    no: "Pas vraiment...",
    success: "Les roses savent dire en silence ce que les mots n'osent pas toujours. Quelle jolie réponse.",
    retry: "Chacun ses fleurs, bien sûr. Mais les roses sont patientes : tu veux leur redonner une chance ?"
  },
  {
    question: "Et les couchers de soleil, les promenades, les petites découvertes à faire à deux ?",
    yes: "Oui, avec plaisir ♡",
    no: "Pas vraiment...",
    success: "Alors il y a sûrement de beaux horizons qui t'attendent.",
    retry: "On peut aussi avancer sans but précis. Veux-tu y réfléchir encore un peu ?"
  },
  {
    kicker: "Deux fils, une destination",
    question: "Et si deux fils, partis de deux endroits différents, pouvaient finir par se rejoindre ?",
    yes: "Ce serait une jolie histoire ♡",
    no: "On ne sait jamais…",
    success: "Les plus jolies histoires commencent souvent ainsi : deux chemins, et un peu de patience.",
    // Réponse « douce » : elle fait aussi avancer le chemin, sans pression
    altSuccess: "« On ne sait jamais » : c'est exactement ce qui laisse la place aux belles surprises."
  },
  {
    kicker: "Presque arrivés...",
    question: "À ton avis, qu'est-ce qui compte le plus : rencontrer la bonne personne par hasard, ou décider de lui donner une place dans sa vie ?",
    yes: "Le choix qu'on fait ♡",
    no: "Peut-être un peu des deux…",
    success: "Joli point de vue : le hasard ouvre la porte, mais c'est le choix qui dessine le chemin.",
    altSuccess: "Un peu des deux, oui. Le hasard sème, et le choix fait pousser."
  }
];

const FINAL_QUESTION = {
  kicker: "Maysam, j'aimerais te poser une dernière question…",
  intro: "Parmi toutes les personnes qu'on rencontre dans la vie, moi, c'est toi que j'ai envie de choisir.",
  question: "Et toi, est-ce que tu voudrais me choisir aussi ? ♡",
  yes: "Oui, je voudrais ♡",
  // Réponse libre et sans pression : les fils ne se rejoignent pas, rien n'est imposé
  soft: "J'ai besoin d'un peu de temps…",
  softMessage: "Merci d'avoir été sincère, Maysam. Les fils ont tout leur temps : rien ne presse. ♡"
};

const FINAL = {
  poem: "Certains chemins commencent séparément... et parfois, ils mènent vers le même horizon.",
  thanks: "Merci d'avoir parcouru ce petit chemin avec moi, Maysam. ♡"
};

/* ---------- Constantes de la scène (viewBox 100 × 300) ---------- */
const Y_START = 292;      // bas des fils (près des chats)
const Y_MOON = 47;        // pointe basse de la lune
const MOON_X = 60;        // doit correspondre à .destination { left: 60% }
const GAP = 24;           // demi-écart initial entre les fils
const TOTAL = STEPS.length + 1;   // étapes de progression : questions + étape finale
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Éléments ---------- */
const $ = (id) => document.getElementById(id);
const sky = $("sky"), card = $("card"), moon = $("moon");
const pathL = $("pathLeft"), pathR = $("pathRight");

/* ---------- État ---------- */
let stage = 0;            // 0 = départ ; TOTAL = arrivée
let busy = false;         // empêche les clics multiples pendant une transition
let scene = sceneAt(0);   // valeurs actuellement affichées

const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED ? 0 : ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

/* Valeurs de la scène pour une étape donnée */
function sceneAt(s) {
  const p = s / TOTAL;
  return { cam: p, head: 0.1 + 0.9 * p, merge: p, moonScale: 0.6 + 0.5 * p, halo: 0.25 + 0.75 * p };
}

/* ---------- Tracé des fils ----------
   u = hauteur relative (0 = bas, 1 = lune). side = -1 (fil gauche) / +1 (fil droit).
   Les fils se rapprochent quand `merge` augmente et se rejoignent à la lune. */
function threadPath(side, head, merge) {
  const N = 60, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = (head * i) / N;
    const y = lerp(Y_START, Y_MOON, u);
    const centre = lerp(50, MOON_X, u);
    const sway = 6 * (1 - u * merge) * Math.sin(u * 8 + (side < 0 ? 0 : 2.2));
    const half = GAP * (1 - u * (0.35 + 0.65 * merge));
    pts.push(`${(centre + side * half + sway).toFixed(2)} ${y.toFixed(2)}`);
  }
  return "M" + pts.join(" L");
}

function draw(s) {
  sky.style.transform = `translateY(${(s.cam * 66.6667).toFixed(3)}%)`;
  pathL.setAttribute("d", threadPath(-1, s.head, s.merge));
  pathR.setAttribute("d", threadPath(+1, s.head, s.merge));
  moon.style.transform = `scale(${s.moonScale.toFixed(3)})`;
  document.documentElement.style.setProperty("--halo", s.halo.toFixed(3));
}

/* Animation fluide d'une valeur de scène à une autre (une seule à la fois) */
function animateTo(target, duration) {
  const from = { ...scene };
  if (REDUCED || duration <= 0) { scene = { ...target }; draw(scene); return Promise.resolve(); }
  return new Promise((resolve) => {
    const t0 = performance.now();
    (function frame(now) {
      const k = ease(Math.min(1, (now - t0) / duration));
      for (const key in target) scene[key] = lerp(from[key], target[key], k);
      draw(scene);
      k < 1 ? requestAnimationFrame(frame) : resolve();
    })(t0);
  });
}

/* ---------- Carte : construction et transitions ---------- */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function button(label, kind, onClick) {
  const b = el("button", "answer " + kind, label);
  b.type = "button";
  b.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    onClick();
  });
  return b;
}

/* Remplace le contenu de la carte avec un fondu */
async function showCard(nodes, focusFirst = true) {
  card.classList.remove("fade-in");
  card.classList.add("fade-out");
  await sleep(450);
  card.replaceChildren(...nodes);
  card.scrollTop = 0;
  card.classList.remove("fade-out");
  void card.offsetWidth;                // relance l'animation d'entrée
  card.classList.add("fade-in");
  if (focusFirst) { const b = card.querySelector("button"); if (b) b.focus({ preventScroll: true }); }
  busy = false;
}

function buttons(...bs) {
  const wrap = el("div", "answer-buttons");
  wrap.append(...bs);
  return wrap;
}

/* ---------- Écrans ---------- */
function showIntro() {
  return showCard([
    el("h1", "", "Bonsoir, Maysam."),
    el("p", "", "J'ai préparé quelque chose pour toi... Une petite aventure, étape par étape."),
    el("p", "question", "Es-tu prête pour une petite aventure ?"),
    buttons(button("Je suis prête ♡", "yes", () => showQuestion(0)))
  ]);
}

function showQuestion(i) {
  const s = STEPS[i];
  const nodes = [];
  if (s.kicker) nodes.push(el("h2", "kicker", s.kicker));
  if (s.intro) nodes.push(el("p", "", s.intro));
  nodes.push(el("p", "question", s.question));
  nodes.push(buttons(
    button(s.yes, "yes", () => onYes(i)),
    button(s.no, "no", () => (s.altSuccess ? onYes(i, s.altSuccess) : onNo(i)))
  ));
  return showCard(nodes);
}

/* Réponse positive : message, montée de la caméra, puis bouton « Continuer » */
async function onYes(i, message) {
  const s = STEPS[i];
  stage = i + 1;
  const anim = animateTo(sceneAt(stage), 2600);
  await showCard([el("p", "reaction", message || s.success)], false);
  await anim;
  const last = i === STEPS.length - 1;
  const next = button("Continuer ♡", "yes", () => (last ? showFinalQuestion() : showQuestion(i + 1)));
  card.append(buttons(next));
  next.focus({ preventScroll: true });
  busy = false;
}

/* Réponse négative : aucune progression, réaction douce, nouvel essai possible */
async function onNo(i) {
  await showCard([
    el("p", "reaction", STEPS[i].retry),
    buttons(button("Revenir à la question", "yes", () => showQuestion(i)))
  ]);
}

/* Question finale : « oui » rejoint les fils ; l'autre réponse laisse du temps */
function showFinalQuestion() {
  const q = FINAL_QUESTION;
  return showCard([
    el("h2", "kicker", q.kicker),
    el("p", "", q.intro),
    el("p", "question", q.question),
    buttons(
      button(q.yes, "yes", () => showFinal()),
      button(q.soft, "no", () => showSoftEnd())
    )
  ]);
}

/* Fin douce : la scène reste où elle est, sans fusion */
function showSoftEnd() {
  return showCard([el("p", "reaction", FINAL_QUESTION.softMessage)], false);
}

/* Étape finale : les fils se rejoignent près de la lune */
async function showFinal() {
  stage = TOTAL;
  document.body.classList.add("is-final");   // fait apparaître l'invocation
  const anim = animateTo(sceneAt(TOTAL), 3600);
  await showCard([el("p", "reaction", FINAL.poem), el("p", "question", FINAL.thanks)], false);
  await anim;
}

/* ---------- Étoiles scintillantes ----------
   Positions pseudo-aléatoires mais stables (même ciel à chaque visite). */
function makeStars(count = 70) {
  const box = $("stars");
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const s = el("span", "star");
    const size = rnd() < 0.15 ? 3 : rnd() < 0.5 ? 2 : 1.5;
    s.style.cssText = `left:${(rnd() * 98 + 1).toFixed(1)}%;top:${(rnd() * 98).toFixed(1)}%;` +
      `width:${size}px;height:${size}px;--dur:${(3 + rnd() * 4).toFixed(1)}s;--delay:${(-rnd() * 6).toFixed(1)}s`;
    box.append(s);
  }
}

/* ---------- Démarrage ---------- */
makeStars();
draw(scene);
showIntro();
