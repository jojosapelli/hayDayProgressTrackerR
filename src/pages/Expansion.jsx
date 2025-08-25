import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

// Datos iniciales según tu planilla
const farmMaster = [
  { name: "Main Section",    total: 52 },
  { name: "Special Sections", total: 114 },
];

const townMaster = [
  { name: "Town", total: 18 },
];

const fishMaster = [
  { name: "Fishing Spots", total: 15 },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function pctFromItems(items) {
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a, r) => a + (+r.total || 0), 0);
  const curr  = items.reduce((a, r) => a + (+r.current || 0), 0);
  if (!total) return 0;
  return +((curr / total) * 100).toFixed(2);
}

function normalize(saved, master) {
  // Ajusta lo guardado a la lista maestra (nombres y máximos)
  if (!Array.isArray(saved) || !saved.length) {
    return master.map(m => ({ name: m.name, current: 0, total: m.total }));
  }
  const byName = new Map(saved.map(x => [String(x?.name ?? ""), x]));
  return master.map(m => {
    const r = byName.get(m.name);
    const total = +m.total || 0;
    const current = clamp(+r?.current || 0, 0, total);
    return { name: m.name, current, total };
  });
}

export default function Expansion() {
  // Carga inicial
  const load = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    const farm = normalize(all?.expansion?.farm, farmMaster);
    const town = normalize(all?.expansion?.town, townMaster);
    const fish = normalize(all?.expansion?.fish, fishMaster);

    return { farm, town, fish };
  }, []);

  const [{ farm, town, fish }, setState] = useState(load);

  // Guardado
  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    })();

    // also store a flat `items` so Home can read with calcCounterPct
    const items = [...farm, ...town, ...fish];

    all.expansion = {
      farm, town, fish, items,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [farm, town, fish]);

  // Acciones
  const incr = (which, i) => {
    setState(prev => {
      const next = { ...prev, [which]: prev[which].map((r, idx) =>
        idx === i ? { ...r, current: clamp(r.current + 1, 0, r.total) } : r
      )};
      return next;
    });
  };
  const decr = (which, i) => {
    setState(prev => {
      const next = { ...prev, [which]: prev[which].map((r, idx) =>
        idx === i ? { ...r, current: clamp(r.current - 1, 0, r.total) } : r
      )};
      return next;
    });
  };

  // Progresos
  const farmPct = pctFromItems(farm);
  const townPct = pctFromItems(town);
  const fishPct = pctFromItems(fish);
  const totalPct = pctFromItems([...farm, ...town, ...fish]);

  const SectionTable = ({ title, which, rows, pct }) => (
    <section className="card" style={{ marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <div className="progress" style={{ marginBottom: 12 }}>
        <div className="done" style={{ width: `${pct}%` }} />
        <div className="todo" style={{ width: `${(100 - pct)}%` }} />
      </div>
      <div className="progress-note">{pct.toFixed(2)}% completed</div>

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table className="hd-table" aria-label={title}>
          <thead>
            <tr>
              <th style={{ width: "60%" }}>{title === "Farm" ? "Farm" : title}</th>
              <th className="center">Current</th>
              <th className="center">Total</th>
              <th className="center">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name + i}>
                <td className="name-cell">{r.name}</td>
                <td className="center">{r.current}</td>
                <td className="center">{r.total}</td>
                <td className="center">
                  <div className="counter">
                    <button className="btn-small" onClick={() => decr(which, i)}>-</button>
                    <button className="btn-small" onClick={() => incr(which, i)}>+</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <main className="container">
      {/* Progreso total arriba */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Expansion — Overall progress</h2>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${totalPct}%` }} />
          <div className="todo" style={{ width: `${(100 - totalPct)}%` }} />
        </div>
        <div className="progress-note">{totalPct.toFixed(2)}% completed</div>
      </section>

      {/* Tres contenedores */}
      <SectionTable title="Farm" which="farm" rows={farm} pct={farmPct} />
      <SectionTable title="Town" which="town" rows={town} pct={townPct} />
      <SectionTable title="Fishable Areas" which="fish" rows={fish} pct={fishPct} />
    </main>
  );
}
