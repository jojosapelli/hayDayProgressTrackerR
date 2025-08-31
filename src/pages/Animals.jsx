import { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

/** === Datos base === */

// Animals (3 niveles)
const animalsMaster = [
  "Chickens x6",
  "Cows x5",
  "Pigs x5",
  "Sheeps x5",
  "Goats x4",
];

// Specials (4 niveles)
const specialsMaster = [
  "Bees x3",
  "Squirrels x5",
];

// Pets con contador
const petsMaster = [
  { name: "Dogs",            total: 6 },
  { name: "Puppies",         total: 6 },
  { name: "Cats",            total: 6 },
  { name: "Kittens",         total: 6 },
  { name: "Bunnies",         total: 6 },
  { name: "Horses & Ponies", total: 13 },
  { name: "Donkeys",         total: 6 },
  { name: "Guinea Pigs",     total: 6 },
  { name: "Birds",           total: 21 },
];

/** === Helpers === */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function normalizeRows(savedRows, masterNames, levelsPerRow) {
  if (!Array.isArray(savedRows) || !savedRows.length) {
    return masterNames.map(name => ({
      name,
      levels: Array(levelsPerRow).fill(0),
    }));
  }
  const byName = new Map(savedRows.map(r => [String(r?.name ?? ""), r]));
  return masterNames.map(name => {
    const r = byName.get(name);
    let lv = Array.isArray(r?.levels) ? r.levels.slice(0, levelsPerRow) : [];
    while (lv.length < levelsPerRow) lv.push(0);
    return { name, levels: lv.map(x => (x ? 1 : 0)) };
  });
}

function calcLevelsProgress(rows) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  const perRow = rows
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

function calcPetsProgress(pets) {
  if (!Array.isArray(pets) || !pets.length) return 0;
  const total = pets.reduce((a, p) => a + (+p.total || 0), 0);
  const curr  = pets.reduce((a, p) => a + (+p.current || 0), 0);
  if (!total) return 0;
  return +((curr / total) * 100).toFixed(2);
}

/** ===== Counter común ([-] valor [+]) ===== */
const Counter = ({ value, max, onDecr, onIncr }) => {
  const isMin = value <= 0;
  const isMax = value >= max;
  const styleMin = isMin ? { opacity: 0.5, filter: "grayscale(1)", cursor: "not-allowed" } : undefined;
  const styleMax = isMax ? { opacity: 0.5, filter: "grayscale(1)", cursor: "not-allowed" } : undefined;

  return (
    <div className="counter">
      <button className="btn-small" disabled={isMin} style={styleMin} onClick={onDecr}>-</button>
      <span>{value}</span>
      <button className="btn-small" disabled={isMax} style={styleMax} onClick={onIncr}>+</button>
    </div>
  );
};

export default function Animals() {
  /** Carga inicial desde localStorage (y normaliza) */
  const load = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    const animalsRows  = normalizeRows(all?.animals?.rows,  animalsMaster, 3);
    const specialsRows = normalizeRows(all?.specials?.rows, specialsMaster, 4);

    let petsItems = all?.pets?.items;
    if (!Array.isArray(petsItems) || !petsItems.length) {
      petsItems = petsMaster.map(p => ({ name: p.name, current: 0, total: p.total }));
    } else {
      petsItems = petsItems.map(p => ({
        name: String(p?.name ?? ""),
        current: clamp(+p?.current || 0, 0, +p?.total || 0),
        total: +p?.total || 0,
      }));
    }

    return { animalsRows, specialsRows, petsItems };
  }, []);

  const [{ animalsRows, specialsRows, petsItems }, setState] = useState(load);

  /** Persistencia (+ resumen combinado para Home) */
  const animalsPct  = calcLevelsProgress(animalsRows);
  const specialsPct = calcLevelsProgress(specialsRows);
  const petsPct     = calcPetsProgress(petsItems);
  const combinedPct = +(((animalsPct + specialsPct + petsPct) / 3).toFixed(2));

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all.animals  = { rows: animalsRows,  updatedAt: new Date().toISOString() };
    all.specials = { rows: specialsRows, updatedAt: new Date().toISOString() };
    all.pets     = { items: petsItems,   updatedAt: new Date().toISOString() };
    all.animalsSummary = { animalsPct, specialsPct, petsPct, combinedPct };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [animalsRows, specialsRows, petsItems, animalsPct, specialsPct, petsPct, combinedPct]);

  /** Acciones */
  const toggleAnimal = (rowIdx, lvlIdx) => {
    setState(prev => {
      const rows = prev.animalsRows.map((r, i) => {
        if (i !== rowIdx) return r;
        const lv = [...r.levels];
        lv[lvlIdx] = lv[lvlIdx] ? 0 : 1;
        return { ...r, levels: lv };
      });
      return { ...prev, animalsRows: rows };
    });
  };

  const toggleSpecial = (rowIdx, lvlIdx) => {
    setState(prev => {
      const rows = prev.specialsRows.map((r, i) => {
        if (i !== rowIdx) return r;
        const lv = [...r.levels];
        lv[lvlIdx] = lv[lvlIdx] ? 0 : 1;
        return { ...r, levels: lv };
      });
      return { ...prev, specialsRows: rows };
    });
  };

  const incrPet = (i) => {
    setState(prev => {
      const items = prev.petsItems.map((p, idx) => {
        if (idx !== i) return p;
        return { ...p, current: clamp(p.current + 1, 0, p.total) };
      });
      return { ...prev, petsItems: items };
    });
  };
  const decrPet = (i) => {
    setState(prev => {
      const items = prev.petsItems.map((p, idx) => {
        if (idx !== i) return p;
        return { ...p, current: clamp(p.current - 1, 0, p.total) };
      });
      return { ...prev, petsItems: items };
    });
  };

  return (
    <main className="container">
      {/* ====== Animals (3 niveles) ====== */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Animals</h2>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${animalsPct}%` }} />
          <div className="todo" style={{ width: `${(100 - animalsPct)}%` }} />
        </div>
        <div className="progress-note">{animalsPct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Animals">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Animal</th>
                <th className="center">Level 1</th>
                <th className="center">Level 2</th>
                <th className="center">Level 3</th>
              </tr>
            </thead>
            <tbody>
              {animalsRows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((val, j) => (
                    <td key={j} className="center">
                      <StarToggle
                        checked={!!val}
                        onChange={() => toggleAnimal(i, j)}
                        label={`${r.name} – Level ${j + 1}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Specials (4 niveles) ====== */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Specials</h2>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${specialsPct}%` }} />
          <div className="todo" style={{ width: `${(100 - specialsPct)}%` }} />
        </div>
        <div className="progress-note">{specialsPct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Specials">
            <thead>
              <tr>
                <th style={{ width: "50%" }}>Animal</th>
                <th className="center">Level 1</th>
                <th className="center">Level 2</th>
                <th className="center">Level 3</th>
                <th className="center">Level 4</th>
              </tr>
            </thead>
            <tbody>
              {specialsRows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((val, j) => (
                    <td key={j} className="center">
                      <StarToggle
                        checked={!!val}
                        onChange={() => toggleSpecial(i, j)}
                        label={`${r.name} – Level ${j + 1}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Pets (contador, nuevo formato) ====== */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Pets</h2>

        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${petsPct}%` }} />
          <div className="todo" style={{ width: `${(100 - petsPct)}%` }} />
        </div>
        <div className="progress-note">{petsPct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Pets">
            <thead>
              <tr>
                <th>Pet</th>
                <th className="center">Owned</th>
                <th className="center">Total</th>
              </tr>
            </thead>
            <tbody>
              {petsItems.map((p, i) => (
                <tr key={p.name + i}>
                  <td className="name-cell">{p.name}</td>
                  <td className="center">
                    <Counter
                      value={p.current}
                      max={p.total}
                      onDecr={() => decrPet(i)}
                      onIncr={() => incrPet(i)}
                    />
                  </td>
                  <td className="center">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
