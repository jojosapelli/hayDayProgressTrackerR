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
  { key: "trees-bushes", label: "Trees And Bushes",     route: "/trees-bushes", img: "trees-bushes.png" },
];

// % para secciones con { rows: [{ levels:[0/1,...] }, ...] }
function calcSectionPct(sectionObj) {
  if (!sectionObj?.rows?.length) return 0;
  const perRow = sectionObj.rows
    .map(r => {
      const t = Array.isArray(r.levels) ? r.levels.length : 0;
      if (!t) return null;
      const done = r.levels.reduce((a,b) => a + (b ? 1 : 0), 0);
      return done / t;
    })
    .filter(v => v !== null);
  if (!perRow.length) return 0;
  const avg = perRow.reduce((a,b) => a + b, 0) / perRow.length;
  return +(avg * 100).toFixed(2);
}

// % para secciones tipo contador { items: [{ current, total }, ...] }
function calcCounterPct(sectionObj) {
  if (!sectionObj?.items?.length) return 0;
  const total = sectionObj.items.reduce((a, r) => a + (+r.total || 0), 0);
  const curr  = sectionObj.items.reduce((a, r) => a + (+r.current || 0), 0);
  if (!total) return 0;
  return +((curr / total) * 100).toFixed(2);
}

// % para secciones con { rows: [{ unlocked: 0|1 }, ...] }  ➜ Trees & Bushes
function calcUnlockedPct(sectionObj) {
  if (!sectionObj?.rows?.length) return 0;
  const total = sectionObj.rows.length;
  const done  = sectionObj.rows.reduce((a, r) => a + (r?.unlocked ? 1 : 0), 0);
  return +((done / total) * 100).toFixed(2);
}

export default function Home() {
  const base = import.meta.env.BASE_URL;

  const loadProgress = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // Progreso combinado de Animals (Animals + Specials + Pets) guardado por Animals.jsx
    const animalsCombined = all?.animalsSummary?.combinedPct ?? 0;

    const map = {};
    sections.forEach(s => {
      if (s.key === "animals") {
        map[s.key] = animalsCombined;
      } else if (s.key === "animal-homes") {
        map[s.key] = calcCounterPct(all["animal-homes"]);
      } else if (s.key === "trees-bushes") {
        map[s.key] = calcUnlockedPct(all["trees-bushes"]);
      } else {
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

  return (
    <main className="container">
      <h2 style={{ marginBottom: "1rem" }}>Welcome</h2>

      {/* Contenedores (botón + imagen + mini barra) */}
      <div className="home-grid">
        {sections.map((t) => {
          const pct = +(progressMap?.[t.key] ?? 0); // 0..100
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

      {/* Resumen de progreso (debajo) */}
      <section className="card" style={{ marginTop: 24 }}>
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
    </main>
  );
}
