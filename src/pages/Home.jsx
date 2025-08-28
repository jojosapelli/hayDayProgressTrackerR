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
  { key: "trees-bushes", label: "Trees And Bushes",     route: "/trees-bushes", img: "trees-bushes.png" },
];

// % para secciones { rows: [{ levels:[0/1,...] }, ...] }
function calcSectionPct(sectionObj) {
  if (!sectionObj?.rows?.length) return 0;
  const perRow = sectionObj.rows
    .map(r => {
      const lv = Array.isArray(r.levels) ? r.levels : [];
      if (!lv.length) return null;
      const done = lv.reduce((a, b) => a + (b ? 1 : 0), 0);
      return done / lv.length;
    })
    .filter(v => v !== null);
  if (!perRow.length) return 0;
  const avg = perRow.reduce((a, b) => a + b, 0) / perRow.length;
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

// % especial para Fishing Area (suma prodRows + fishRows)
function calcFishingAreaPct(sectionObj) {
  if (!sectionObj) return 0;
  const sumRows = (rows) => {
    if (!Array.isArray(rows) || !rows.length) return { done: 0, total: 0 };
    return rows.reduce((acc, r) => {
      const lv = Array.isArray(r?.levels) ? r.levels : [];
      const done = lv.reduce((a, b) => a + (b ? 1 : 0), 0);
      return { done: acc.done + done, total: acc.total + lv.length };
    }, { done: 0, total: 0 });
  };

  const tProd = sumRows(sectionObj.prodRows);
  const tFish = sumRows(sectionObj.fishRows);
  const done = tProd.done + tFish.done;
  const total = tProd.total + tFish.total;
  return total ? +((done / total) * 100).toFixed(2) : 0;
}

export default function Home() {
  const base = import.meta.env.BASE_URL;

  const loadProgress = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // Progreso combinado de Animals (Animals + Specials + Pets),
    // lo guarda Animals.jsx como animalsSummary.combinedPct
    const animalsCombined = all?.animalsSummary?.combinedPct ?? 0;

    const map = {};
    sections.forEach(s => {
      if (s.key === "animals") {
        map[s.key] = animalsCombined;
      } else if (s.key === "animal-homes") {
        map[s.key] = calcCounterPct(all["animal-homes"]);
      } else if (s.key === "fishing-area") {
        map[s.key] = calcFishingAreaPct(all["fishing-area"]);
      } else if (s.key === "expansion") {
        map[s.key] = calcCounterPct(all["expansion"]);
      } else if (s.key === "town") {
        // 👈 leer el porcentaje total que guarda Town.jsx
        map[s.key] = +(all?.townSummary?.totalPct ?? 0);
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

      {/* Grid de tarjetas con mini barra */}
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

      {/* Resumen debajo (opcional) */}
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
