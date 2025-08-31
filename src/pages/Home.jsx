import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

// Colores para el anillo/fila de Town
const TOWN_DONE  = "#f84360";
const TOWN_TODO  = "#c0374f";

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

/* ===== Helpers de progreso ===== */

// % promedio por fila a partir de levels:[0/1,...]
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

// % para contadores tipo {items:[{current,total},...]} o directamente [{current,total},...]
function calcCounterPct(sectionObj) {
  const items = sectionObj?.items || sectionObj;
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a,r)=>a+(+r.total||0),0);
  const curr  = items.reduce((a,r)=>a+(+r.current||0),0);
  if (!total) return 0;
  return +((curr/total)*100).toFixed(2);
}

// Fishing Area guardado como { prodRows, fishRows }
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

/* ===== Anillo SVG reutilizable ===== */
function Ring({ value, size = 240, stroke = 22, colorDone = "var(--green)", colorTodo = "var(--blue)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size/2}
        cy={size/2}
        r={r}
        stroke={colorTodo}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        opacity="0.35"
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={r}
        stroke={colorDone}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text
        x="50%" y="50%"
        dominantBaseline="middle" textAnchor="middle"
        fontWeight="700" fontSize={size * 0.20}
        fill="#fff"
        stroke="#000"
        strokeWidth="5"
        paintOrder="stroke"
      >
        {value.toFixed(2)}%
      </text>

    </svg>
  );
}

/* ===== Componente ===== */
export default function Home() {
  const base = import.meta.env.BASE_URL;

  // XP & Rep con persistencia
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

  // Cargar progresos de todas las secciones
  const loadProgress = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    const animalsCombined = all?.animalsSummary?.combinedPct ?? 0;
    const map = {};

    sections.forEach(s => {
      switch (s.key) {
        case "animals":
          map[s.key] = animalsCombined;
          break;
        case "animal-homes":
          map[s.key] = calcCounterPct(all["animal-homes"]);
          break;
        case "fishing-area":
          map[s.key] = calcFishingAreaPctFA(all["fishing-area"]);
          break;
        case "expansion":
          map[s.key] = calcCounterPct(all["expansion"]);
          break;
        case "town":
          map[s.key] = +(all?.townSummary?.totalPct ?? 0);
          break;
        case "trees-bushes":
          map[s.key] = calcSectionPct(all["trees-bushes"]);
          break;
        default:
          map[s.key] = calcSectionPct(all[s.key]);
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

  // Resúmenes para los anillos
  const overallAvg = useMemo(() => {
    const vals = sections.map(s => +(+progressMap[s.key] || 0));
    if (!vals.length) return 0;
    return +(vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(2);
  }, [progressMap]);

  const townPct = +(progressMap["town"] ?? 0);

  // Sanitizado para inputs (0..999, sin ceros a la izquierda)
  const sanitizeInt = (val) => {
    const only = String(val).replace(/\D+/g, "");
    const trimmed = only.replace(/^0+(?=\d)/, "");
    const n = trimmed === "" ? 0 : +trimmed;
    return Math.max(0, Math.min(999, n));
  };
  const onXpChange  = (e) => setXp(sanitizeInt(e.target.value));
  const onRepChange = (e) => setRep(sanitizeInt(e.target.value));
  const preventWheel = (e) => e.currentTarget.blur();

  return (
    <main className="container">
      <div className="home-layout">
        <h2 className="home-title">Welcome Farmer!</h2>

        {/* IZQUIERDA (2/3): XP/Rep + anillos + resumen */}
        <div className="home-left">
          {/* XP / Reputation */}
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

          {/* Anillos: Overall y Town (con colores pedidos) */}
          <div className="stats-row">
            <div className="card" style={{ display: "grid", placeItems: "center" }}>
              <Ring value={overallAvg} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Overall progress</div>
            </div>
            <div className="card" style={{ display: "grid", placeItems: "center" }}>
              <Ring value={townPct} colorDone={TOWN_DONE} colorTodo={TOWN_TODO} />
              <div style={{ marginTop: 8, fontWeight: 700 }}>Town progress</div>
            </div>
          </div>

          {/* Progress summary */}
          <section className="card">
            <h3 style={{ marginTop: 0 }}>Progress summary</h3>
            <div className="summary-rows">
              {sections.map(s => {
                const pct = progressMap[s.key] ?? 0;
                const isTown = s.key === "town";
                return (
                  <div key={s.key} className="summary-row">
                    <div className="summary-label">{s.label}</div>
                    <div className="mini-progress">
                      <div
                        className="mini-done"
                        style={{
                          width: `${pct.toFixed(2)}%`,
                          background: isTown ? TOWN_DONE : "var(--green)"
                        }}
                      />
                      <div
                        className="mini-todo"
                        style={{
                          width: `${(100 - pct).toFixed(2)}%`,
                          background: isTown ? TOWN_TODO : "var(--blue)"
                        }}
                      />
                    </div>
                    <div className="summary-value">{pct.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* DERECHA (1/3): mosaico de secciones */}
        <div className="home-right">
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

                  {/* Fuerzo colores aquí para que SIEMPRE se vea el celeste de avance */}
                  <div className="home-mini-row">
                    <div className="mini-progress">
                      <div
                        className="mini-done"
                        style={{ width: `${pct.toFixed(2)}%`, background: "var(--green)" }}
                      />
                      <div
                        className="mini-todo"
                        style={{ width: `${(100 - pct).toFixed(2)}%`, background: "var(--blue)" }}
                      />
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
