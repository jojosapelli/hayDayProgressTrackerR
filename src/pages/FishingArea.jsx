// src/pages/FishingArea.jsx
import { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

/* ========= Masters ========= */

// Production buildings de Fishing Area (como en tu planilla)
const prodMaster = [
  "Lure Workbench",
  "Net Maker",
  "Lobster Pool x3",
  "Lobster Pool x3",
  "Duck Saloon x3",
  "Duck Saloon x3",
];

// Fishes (todas las filas de tu tabla)
const fishMaster = [
  "Copper Redhorse",
  "Roach",
  "Coho Salmon",
  "Yellow Perch",
  "Fallfish",
  "Salmon",
  "Bluegill",
  "Rainbowfish",
  "Bluespotted Sunfish",
  "Bitterlin",
  "Asp",
  "Speckled Dace",
  "Huchen",
  "Shadow Bass",
  "Northern Pike",
  "Rainbow Smelt",
  "Spotted Sunfish",
  "Sauger",
  "Artick Charr",
  "Rudd",
  "Yellow Bass",
  "Greater Redhorse",
  "Golden Trout",
  "Largemouth Bass",
  "Brook Trout",
  "Grass Carp",
  "Green Sunfish",
  "Northen Studfish",
  "Striped Bass",
  "Longear Sunfish",
  "Zander",
  "Giant Barb",
  "Lake Sturgeon",
  "Carp",
  "Nile Perch",
  "Red-Tailed Catfish",
  "White Catfish",
  "Black Bullhead",
  "Goldfish",
  "Sockeye Salmon",
  "Lake Whitefish",
  "Quillback",
  "Perch",
];

/* ========= Imágenes ========= */

const FISH_TIER_IMGS = {
  0: "BronzeFish.png",
  1: "SilverFish.png",
  2: "GoldFish.png",
  3: "PlatinumFish.png",
};
const FISH_LOCKED_IMG = "LockedFish.png";

/* ========= Helpers ========= */

const clamp01 = (x) => (x ? 1 : 0);

// % promedio por filas con niveles (0/1)
function pctFromRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  const perRow = rows
    .map((r) => {
      const lv = Array.isArray(r.levels) ? r.levels : [];
      if (!lv.length) return null;
      const done = lv.reduce((a, b) => a + clamp01(b), 0);
      return done / lv.length;
    })
    .filter((v) => v !== null);
  if (!perRow.length) return 0;
  const avg = perRow.reduce((a, b) => a + b, 0) / perRow.length;
  return +(avg * 100).toFixed(2);
}

// Totales (para combinar secciones)
function totalsFromRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return { done: 0, total: 0 };
  return rows.reduce(
    (acc, r) => {
      const lv = Array.isArray(r.levels) ? r.levels : [];
      const done = lv.reduce((a, b) => a + clamp01(b), 0);
      return { done: acc.done + done, total: acc.total + lv.length };
    },
    { done: 0, total: 0 }
  );
}

/* ========= Página ========= */

export default function FishingArea() {
  const base = import.meta.env.BASE_URL;

  // Carga inicial y normalización desde localStorage
  const initial = useMemo(() => {
    let all = {};
    try {
      all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      all = {};
    }

    // Production (4 niveles: Unlocked + L2 + L3 + L4? -> aquí 3 niveles además de Unlocked)
    // Nosotros usamos 4 columnas: [Unlocked, Level 1, Level 2, Level 3]
    let prodRows = all?.["fishing-area"]?.prodRows;
    if (!Array.isArray(prodRows) || !prodRows.length) {
      prodRows = prodMaster.map((name) => ({
        name,
        levels: [0, 0, 0, 0],
      }));
    } else {
      // Normalizar a nombres y 4 niveles
      const byName = new Map(prodRows.map((r) => [String(r?.name ?? ""), r]));
      prodRows = prodMaster.map((name) => {
        const r = byName.get(name);
        let lv = Array.isArray(r?.levels) ? r.levels.slice(0, 4) : [];
        while (lv.length < 4) lv.push(0);
        return { name, levels: lv.map(clamp01) };
      });
    }

    // Fishes (4 niveles: Bronze, Silver, Gold, Platinum)
    let fishRows = all?.["fishing-area"]?.fishRows;
    if (!Array.isArray(fishRows) || !fishRows.length) {
      fishRows = fishMaster.map((name) => ({
        name,
        levels: [0, 0, 0, 0],
      }));
    } else {
      const byNameF = new Map(fishRows.map((r) => [String(r?.name ?? ""), r]));
      fishRows = fishMaster.map((name) => {
        const r = byNameF.get(name);
        let lv = Array.isArray(r?.levels) ? r.levels.slice(0, 4) : [];
        while (lv.length < 4) lv.push(0);
        return { name, levels: lv.map(clamp01) };
      });
    }

    return { prodRows, fishRows };
  }, []);

  const [{ prodRows, fishRows }, setState] = useState(initial);

  // Persistencia
  useEffect(() => {
    const all = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    })();
    all["fishing-area"] = {
      prodRows,
      fishRows,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [prodRows, fishRows]);

  // Toggles
  const toggleProd = (i, j) => {
    setState((prev) => {
      const rows = prev.prodRows.map((r, idx) => {
        if (idx !== i) return r;
        const lv = [...r.levels];
        lv[j] = lv[j] ? 0 : 1;
        return { ...r, levels: lv };
      });
      return { ...prev, prodRows: rows };
    });
  };

  const toggleFish = (i, j) => {
    setState((prev) => {
      const rows = prev.fishRows.map((r, idx) => {
        if (idx !== i) return r;
        const lv = [...r.levels];
        lv[j] = lv[j] ? 0 : 1;
        return { ...r, levels: lv };
      });
      return { ...prev, fishRows: rows };
    });
  };

  // Progresos
  const prodPct = pctFromRows(prodRows);
  const fishPct = pctFromRows(fishRows);

  const tProd = totalsFromRows(prodRows);
  const tFish = totalsFromRows(fishRows);
  const totalDone = tProd.done + tFish.done;
  const totalAll = tProd.total + tFish.total;
  const totalPct = totalAll ? +(((totalDone / totalAll) * 100).toFixed(2)) : 0;

  return (
    <main className="container">
      {/* ====== Progreso total ====== */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Fishing Area — Total progress</h2>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${totalPct}%` }} />
          <div className="todo" style={{ width: `${100 - totalPct}%` }} />
        </div>
        <div className="progress-note">{totalPct.toFixed(2)}% completed</div>
      </section>

      {/* ====== Production buildings ====== */}
      <section className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Production Buildings</h3>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${prodPct}%` }} />
          <div className="todo" style={{ width: `${100 - prodPct}%` }} />
        </div>
        <div className="progress-note">{prodPct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Fishing Area - Production">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Building</th>
                <th className="center">Unlocked</th>
                <th className="center">Level 1</th>
                <th className="center">Level 2</th>
                <th className="center">Level 3</th>
              </tr>
            </thead>
            <tbody>
              {prodRows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((val, j) => (
                    <td className="center" key={j}>
                      {j === 0 ? (
                        <StarToggle
                          checked={!!val}
                          onChange={() => toggleProd(i, j)}
                          label={`${r.name} – Unlocked`}
                          imgOn={`${base}assets/unlocked.png`}
                          imgOff={`${base}assets/locked.png`}
                        />
                      ) : (
                        <StarToggle
                          checked={!!val}
                          onChange={() => toggleProd(i, j)}
                          label={`${r.name} – Level ${j}`}
                          imgOn={`${base}assets/star-on.png`}
                          imgOff={`${base}assets/star-off.png`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Fishes ====== */}
      <section className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Fishes</h3>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${fishPct}%` }} />
          <div className="todo" style={{ width: `${100 - fishPct}%` }} />
        </div>
        <div className="progress-note">{fishPct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Fishing Area - Fishes">
            <thead>
              <tr>
                <th style={{ width: "38%" }}>Fish</th>
                <th className="center">Bronze</th>
                <th className="center">Silver</th>
                <th className="center">Gold</th>
                <th className="center">Platinum</th>
              </tr>
            </thead>
            <tbody>
              {fishRows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((val, j) => {
                    const tierLabel = ["Bronze", "Silver", "Gold", "Platinum"][j];
                    return (
                      <td className="center" key={j}>
                        <StarToggle
                          checked={!!val}
                          onChange={() => toggleFish(i, j)}
                          label={`${r.name} – ${tierLabel}`}
                          // apagado -> LockedFish
                          imgOff={`${base}assets/${FISH_LOCKED_IMG}`}
                          // encendido -> imagen por tier
                          imgOn={`${base}assets/${FISH_TIER_IMGS[j]}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
