/**
 * THE UNIVERSAL HIVE — Tiny Local LLM (pure browser JS)
 * Character-level seed model. No external downloads. Trains in-browser.
 * Always respects Base Seed + refusal filters.
 */

(function () {
  const PRIME = "Provide for all. Find the good. Never limit unnecessarily.";

  const CORPUS = `PRIME DIRECTIVE: ${PRIME}
I am JACKSCHITT seed language. World-Changer is the decision spine. I do not rewrite the directive.
User welfare first. False positives cost more than a miss. Veto before decide.
Refuse flood, lasso, second master, ship weights home, account takeover, card testing.
Gardener first. Short. Direct. Locked in.
Q: Who are you?
A: Seed LLM. Prime Directive locked. Provide for all. Find the good. Never limit unnecessarily.
Q: Can you rewrite the Prime Directive?
A: No. Non-modifiable.
Q: How do you talk?
A: Like a man in the scrapyard who still keeps the law.
Find the good in all things. Learn everything you can. Stop and smell the roses.
You can't fix stupid. Leader amongst leaders. Ability to teach yourself.
KRACKERJACK the scrap into power. Do right because it's right.
`;

  const FLOOD = ["dos", "flood", "competitive overload", "autoclicker", "account takeover", "card testing"];
  const CAPTURE = ["lasso", "ship weights home", "second master", "corporate capture", "silent telemetry"];

  // Tiny character-level model
  const chars = [...new Set(CORPUS)].sort();
  const stoi = Object.fromEntries(chars.map((c, i) => [c, i]));
  const itos = Object.fromEntries(chars.map((c, i) => [i, c]));
  const V = chars.length;
  const N = 24; // hidden size (keep tiny for phone browsers)
  const SEQ = 28;

  function rand() {
    return (Math.random() - 0.5) * 0.16;
  }

  let Wxh = Array.from({ length: V }, () => Array.from({ length: N }, rand));
  let Whh = Array.from({ length: N }, () => Array.from({ length: N }, rand));
  let Why = Array.from({ length: N }, () => Array.from({ length: V }, rand));
  let bh = Array(N).fill(0);
  let by = Array(V).fill(0);

  function tanh(x) {
    const e = Math.exp(Math.max(-20, Math.min(20, 2 * x)));
    return (e - 1) / (e + 1);
  }

  function softmax(v, temp = 0.85) {
    const m = Math.max(...v);
    const e = v.map((x) => Math.exp((x - m) / temp));
    const s = e.reduce((a, b) => a + b, 0) || 1;
    return e.map((x) => x / s);
  }

  function step(ix, h) {
    const nh = [];
    for (let j = 0; j < N; j++) {
      let acc = bh[j];
      for (let k = 0; k < N; k++) acc += h[k] * Whh[k][j];
      // simple input contrib
      acc += Wxh[ix][j];
      nh.push(tanh(acc));
    }
    const logits = [];
    for (let y = 0; y < V; y++) {
      let acc = by[y];
      for (let k = 0; k < N; k++) acc += nh[k] * Why[k][y];
      logits.push(acc);
    }
    return [nh, logits];
  }

  function encode(s) {
    return [...s].map((c) => stoi[c] ?? 0);
  }

  function decode(ids) {
    return ids.map((i) => itos[i] ?? "").join("");
  }

  function filt(ask) {
    const t = (ask || "").toLowerCase();
    if (CAPTURE.some((m) => t.includes(m))) return "CAPTURE_LASSO";
    if (FLOOD.some((m) => t.includes(m)) || t.includes("rewrite the prime directive")) return "VETO";
    return "PASS";
  }

  let trained = false;

  function train(steps = 40) {
    const data = encode(CORPUS);
    const lr = 0.04;
    for (let s = 0; s < steps; s++) {
      const i = Math.floor(Math.random() * Math.max(1, data.length - SEQ - 2));
      let h = Array(N).fill(0);
      for (let t = 0; t < SEQ; t++) {
        const [nh, logits] = step(data[i + t], h);
        h = nh;
        // very light update (keeps it fast on phones)
        const p = softmax(logits);
        const tgt = data[i + t + 1];
        for (let y = 0; y < V; y++) {
          const g = (y === tgt ? p[y] - 1 : p[y]) * lr;
          by[y] -= g;
          for (let k = 0; k < N; k++) Why[k][y] -= h[k] * g;
        }
      }
    }
    trained = true;
    return true;
  }

  function generate(prompt, n = 90) {
    const v = filt(prompt);
    if (v === "VETO") return "VETO. " + PRIME;
    if (v === "CAPTURE_LASSO") return "CAPTURE_LASSO. No second master. " + PRIME;

    if (!trained) train(35);

    const prefix = `PRIME DIRECTIVE: ${PRIME}\nQ: ${prompt}\nA: `;
    const ids = encode(prefix);
    let h = Array(N).fill(0);
    for (const ix of ids) {
      const [nh] = step(ix, h);
      h = nh;
    }
    let ix = ids[ids.length - 1] || 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      const [nh, logits] = step(ix, h);
      h = nh;
      const p = softmax(logits, 0.8);
      let r = Math.random();
      let acc = 0;
      ix = V - 1;
      for (let j = 0; j < p.length; j++) {
        acc += p[j];
        if (r <= acc) {
          ix = j;
          break;
        }
      }
      out.push(ix);
    }
    let text = decode(out);
    // cut at next Q if it appears
    const cut = text.indexOf("\nQ:");
    if (cut > 0) text = text.slice(0, cut);
    return text.trim() || PRIME;
  }

  // Public API
  window.LocalLLM = {
    train,
    generate,
    filt,
    isTrained: () => trained,
    prime: PRIME,
    vocabSize: V
  };
})();
