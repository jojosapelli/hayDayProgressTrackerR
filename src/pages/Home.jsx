// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

const sections = [
  { key: "production",   label: "Production Buildings", route: "/production",   img: "production.png" },
  { key: "products",     label: "Products",             route: "/products",     img: "products.png" },
  { key: "animals",      label: "Animals",              route: "/animals",      img: "animals.png" },
  { key: "animal-homes", label: "Animal Homes",         route: "/animal-homes", img: "animal-homes.png" },
  { key: "crops",        label: "Crops",                route: "/crops",        img: "crops.png" },
  { key: "expansion",    label: "Expansion",            route: "/expansion",    img: "expansion.png" },
  { key: "fishing-area", label: "Fishing Area",         route: "/fishing-area", img: "fishing-area.png" },
  { key: "town",         label: "Town",                 route: "/town",         img: "town.png" },
  { key: "achievements", label: "Achievements",         route: "/achievements", img: "achievements.png" },
  { key: "trees-bushes", label: "Trees & Bushes",       route: "/trees-bushes", img: "trees-bushes.png" },
];

/* ================= Helpers comunes ================= */
function calcSectionPct(sectionObj) {
  const rows = sectionObj?.rows;
  if (!Array.isArray(rows) || !rows.length) return 0;
  const perRow = rows
    .map(r => {
      const arr = Array.isArray(r.levels) ? r.levels : [];
      if (!arr.length) return null;
      const done = arr.reduce((a, b) => a + (b ? 1 : 0), 0);
      return done / arr.length;
    })
    .filter(v => v !== null);
  if (!perRow.length) return 0;
  const avg = perRow.reduce((a,b)=>a+b,0) / perRow.length;
  return +(avg * 100).toFixed(2);
}
function calcCounterPct(sectionObj) {
  const items = sectionObj?.items || sectionObj;
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a,r)=>a+(+r.total||0),0);
  const curr  = items.reduce((a,r)=>a+(+r.current||0),0);
  if (!total) return 0;
  return +((curr/total)*100).toFixed(2);
}

// Fishing Area total a partir de {prodRows, fishRows}
function totalsFromRows(rows){
  if (!Array.isArray(rows) || !rows.length) return {done:0,total:0};
  return rows.reduce((acc,r)=>{
    const lv = Array.isArray(r.levels) ? r.levels : [];
    const done = lv.reduce((a,b)=>a+(b?1:0),0);
    return { done: acc.done + done, total: acc.total + lv.length };
  }, {done:0,total:0});
}
function calcFishingAreaPctFA(obj){
  if (!obj) return 0;
  const t1 = totalsFromRows(obj.prodRows);
  const t2 = totalsFromRows(obj.fishRows);
  const done = t1.done + t2.done;
  const total = t1.total + t2.total;
  if (!total) return 0;
  return +((done/total)*100).toFixed(2);
}

/* ===== Expansion: Town-only (búsqueda profunda y flexible) ===== */
function hasTownLabel(x) {
  const s = (x ?? "").toString();
  return /town/i.test(s);
}
function isCounterRow(x) {
  return x && typeof x === "object" && Number.isFinite(+x.current) && Number.isFinite(+x.total);
}
function pctFromCounterRow(row) {
  const curr = +row.current || 0;
  const total = +row.total || 0;
  if (!total) return 0;
  return +((curr/total)*100).toFixed(2);
}
function calcExpansionTownPctDeep(exp) {
  if (!exp) return 0;

  // 1) Accesos directos habituales
  if (typeof exp?.townSummaryPct === "number") return +exp.townSummaryPct;
  if (Array.isArray(exp?.town)) return calcCounterPct(exp.town);
  if (Array.isArray(exp?.Town)) return calcCounterPct(exp.Town);
  if (Array.isArray(exp?.town?.items)) return calcCounterPct(exp.town.items);
  if (Array.isArray(exp?.Town?.items)) return calcCounterPct(exp.Town.items);

  // 2) Búsqueda recursiva
  const seen = new Set();
  const dfs = (node, parentLabel = "") => {
    if (!node || typeof node !== "object") return null;
    if (seen.has(node)) return null;
    seen.add(node);

    // Si el nodo es un array:
    if (Array.isArray(node)) {
      // Caso A: un array que pertenece a un contenedor "Town"
      if (hasTownLabel(parentLabel)) {
        // Puede ser array de rows/ítems
        // a) filas sueltas current/total
        const rows = node.filter(isCounterRow);
        if (rows.length) return calcCounterPct(rows);
        // b) objetos que tengan items/rows dentro
        for (const it of node) {
          // fila llamada "Town"
          if (isCounterRow(it) && hasTownLabel(it.name || it.label || it.title)) {
            return pctFromCounterRow(it);
          }
          const pctChild =
            dfs(it.items, it.label || it.title || it.name) ??
            dfs(it.rows,  it.label || it.title || it.name) ??
            dfs(it,       it.label || it.title || it.name);
          if (typeof pctChild === "number") return pctChild;
        }
      } else {
        // Caso B: array general -> buscar un ítem llamado Town o un contenedor llamado Town
        // b1) fila suelta llamada Town
        for (const it of node) {
          if (isCounterRow(it) && hasTownLabel(it.name || it.label || it.title)) {
            return pctFromCounterRow(it);
          }
        }
        // b2) contenedores con label/title/name = Town
        for (const it of node) {
          const label = it?.label || it?.title || it?.name || "";
          if (hasTownLabel(label)) {
            // intentar items/rows
            if (Array.isArray(it?.items)) return calcCounterPct(it.items);
            if (Array.isArray(it?.rows))  return calcCounterPct(it.rows);
          }
          const pctChild =
            dfs(it?.items, label) ??
            dfs(it?.rows,  label) ??
            dfs(it,        label);
          if (typeof pctChild === "number") return pctChild;
        }
      }
      return null;
    }

    // Si el nodo es un objeto:
    const label = node.label || node.title || node.name || parentLabel || "";
    // c) objeto con clave town/Town como array
    if (Array.isArray(node.town)) return calcCounterPct(node.town);
    if (Array.isArray(node.Town)) return calcCounterPct(node.Town);
    if (Array.isArray(node.town?.items)) return calcCounterPct(node.town.items);
    if (Array.isArray(node.Town?.items)) return calcCounterPct(node.Town.items);

    // d) objeto contenedor llamado Town
    if (hasTownLabel(label)) {
      if (Array.isArray(node.items)) return calcCounterPct(node.items);
      if (Array.isArray(node.rows))  return calcCounterPct(node.rows);
    }

    // e) fila suelta llamada Town
    if (isCounterRow(node) && hasTownLabel(label)) return pctFromCounterRow(node);

    // f) seguir recursión por propiedades típicas
    const keysToScan = ["sections","groups","blocks","items","rows","data","list"];
    for (const k of keysToScan) {
      const child = node[k];
      if (child) {
        const pct = dfs(child, label);
        if (typeof pct === "number") return pct;
      }
    }
    // o por todas las props como último recurso
    for (const k of Object.keys(node)) {
      const pct = dfs(node[k], k);
      if (typeof pct === "number") return pct;
    }
    return null;
  };

  const found = dfs(exp, "");
  return typeof found === "number" ? found : 0;
}

/* ================== Componente ================== */
function CircleProgress({ pct = 0, size = 220, stroke = 22, trackColor = "var(--blue)", progColor = "var(--green)", label }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="ring-card card">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-svg" aria-label={label || "progress chart"}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeOpacity="0.25" strokeWidth={stroke}/>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={progColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="ring-text">
          {pct.toFixed(1)}%
        </text>
      </svg>
      {label ? <div className="ring-label">{label}</div> : null}
    </div>
  );
}

export default function Home() {
  const base = import.meta.env.BASE_URL;

  // XP & Rep
  const [xp, setXp] = useState(() => {
    try { return +(JSON.parse(localStorage.getItem(STORAGE_KEY))?.homeStats?.xp ?? 0) || 0; }
    catch { return 0; }
  });
  const [rep, setRep] = useState(() => {
    try { return +(JSON.parse(localStorage.getItem(STORAGE_KEY))?.homeStats?.rep ?? 0) || 0; }
    catch { return 0; }
  });
  useEffect(() => {
    const all = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }})();
    all.homeStats = { xp, rep };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [xp, rep]);

  // Progresos por sección
  const loadProgress = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    const animalsCombined = all?.animalsSummary?.combinedPct ?? 0;
    const map = {};
    sections.forEach(s => {
      switch (s.key) {
        case "animals":       map[s.key] = animalsCombined; break;
        case "animal-homes":  map[s.key] = calcCounterPct(all["animal-homes"]); break;
        case "fishing-area":  map[s.key] = calcFishingAreaPctFA(all["fishing-area"]); break;
        case "expansion":     map[s.key] = calcCounterPct(all["expansion"]); break;
        case "town":          map[s.key] = +(all?.townSummary?.totalPct ?? 0); break;
        case "trees-bushes":  map[s.key] = calcSectionPct(all["trees-bushes"]); break;
        default:              map[s.key] = calcSectionPct(all[s.key]);
      }
    });
    return map;
  }, []);
  const [progressMap, setProgressMap] = useState(loadProgress);
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY) setProgressMap(loadProgress()); };
    const onFocus = () => setProgressMap(loadProgress());
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadProgress]);

  // Expansion → Town-only pct (se recalcula cuando cambian progresos)
  const [expTownPct, setExpTownPct] = useState(0);
  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      setExpTownPct(calcExpansionTownPctDeep(all?.expansion));
    } catch {
      setExpTownPct(0);
    }
  }, [progressMap]);

  // Inputs 0..999 sin ceros a la izquierda
  const sanitizeInt = (val) => {
    const only = String(val).replace(/\D+/g, "");
    const trimmed = only.replace(/^0+(?=\d)/, "");
    const n = trimmed === "" ? 0 : +trimmed;
    return Math.max(0, Math.min(999, n));
  };
  const onXpChange  = (e) => setXp(sanitizeInt(e.target.value));
  const onRepChange = (e) => setRep(sanitizeInt(e.target.value));
  const preventWheel = (e) => e.currentTarget.blur();

  // Totales para anillos
  const overallPct = useMemo(() => {
    const vals = sections.map(s => +((progressMap?.[s.key]) ?? 0));
    if (!vals.length) return 0;
    return +((vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(2));
  }, [progressMap]);

  const townPagePct = +(progressMap?.["town"] ?? 0);
  const townCombinedPct = useMemo(() => {
    // Promedio entre Town.jsx y Town en Expansion
    if (Number.isFinite(townPagePct) && Number.isFinite(expTownPct)) {
      return +(((townPagePct + expTownPct) / 2).toFixed(2));
    }
    return townPagePct || 0;
  }, [townPagePct, expTownPct]);

  return (
    <main className="container">
      <div className="home-layout">
        <h2 className="home-title">Welcome</h2>

        {/* IZQUIERDA (2/3): Stats + Rings + Summary */}
        <div className="home-right">
          <div className="stats-row">
            <div className="card stat-card">
              <img src={`${base}assets/xp.png`} alt="XP Level" className="stat-img" draggable="false" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={xp}
                onChange={onXpChange}
                onWheel={preventWheel}
                className="stat-input"
                aria-label="XP level"
              />
            </div>

            <div className="card stat-card">
              <img src={`${base}assets/Reputation.png`} alt="Reputation Level" className="stat-img" draggable="false" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rep}
                onChange={onRepChange}
                onWheel={preventWheel}
                className="stat-input"
                aria-label="Reputation level"
              />
            </div>
          </div>

          <div className="rings-row">
            <CircleProgress pct={overallPct} label="Overall progress" />
            <CircleProgress pct={townCombinedPct} label="Town progress" />
          </div>

          <section className="card">
            <h3 style={{ marginTop: 0 }}>Progress summary</h3>
            <div className="summary-rows">
              {sections.map(s => {
                const pct = progressMap[s.key] ?? 0;
                return (
                  <div key={s.key} className="summary-row">
                    <div className="summary-label">{s.label}</div>
                    <div className="mini-progress">
                      <div className="mini-done" style={{ width: `${pct.toFixed(2)}%` }} />
                      <div className="mini-todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
                    </div>
                    <div className="summary-value">{pct.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* DERECHA (1/3): Grid de páginas */}
        <div className="home-left">
          <div className="home-grid">
            {sections.map((t) => {
              const pct = +(progressMap?.[t.key] ?? 0);
              return (
                <div key={t.route} className="home-card-wrap">
                  <Link to={t.route} className="home-card">
                    {t.label}
                  </Link>

                  <img
                    src={`${base}assets/home/${t.img}`}
                    alt={t.label}
                    className="home-card-img"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />

                  <div className="home-mini-row">
                    <div className="mini-progress">
                      <div className="mini-done" style={{ width: `${pct.toFixed(2)}%` }} />
                      <div className="mini-todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
                    </div>
                    <div className="mini-pct">{pct.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
