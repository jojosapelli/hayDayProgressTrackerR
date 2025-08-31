import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pctFromCounters = (items) => {
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a, r) => a + (+r.total || 0), 0);
  const curr  = items.reduce((a, r) => a + (+r.current || 0), 0);
  if (!total) return 0;
  return +((curr / total) * 100).toFixed(2);
};

/** Counter genérico */
const Counter = ({ value, max, onDecr, onIncr }) => {
  const isMin = value <= 0;
  const isMax = value >= max;
  const styleMin = isMin ? { opacity: .5, filter:"grayscale(1)", cursor:"not-allowed" } : undefined;
  const styleMax = isMax ? { opacity: .5, filter:"grayscale(1)", cursor:"not-allowed" } : undefined;

  return (
    <div className="counter">
      <button className="btn-small" disabled={isMin} style={styleMin} onClick={onDecr}>-</button>
      <span>{value}</span>
      <button className="btn-small" disabled={isMax} style={styleMax} onClick={onIncr}>+</button>
    </div>
  );
};

export default function Expansion() {
  // Estado inicial
  const load = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // Si ya tenías algo guardado, tratamos de respetarlo
    const saved = all?.expansion?.items;
    let farm = [
      { name: "Main Section",     current: 52, total: 52 },
      { name: "Special Sections", current: 73, total: 114 },
    ];
    let town = [
      { name: "Town", current: 18, total: 18 },
    ];
    let fishing = [
      { name: "Fishing Spots", current: 15, total: 15 },
    ];

    if (Array.isArray(saved) && saved.length) {
      // mapa por nombre
      const byName = new Map(saved.map(x => [String(x?.name ?? ""), x]));
      farm = farm.map(x => ({ ...x, current: clamp(+byName.get(x.name)?.current || x.current, 0, x.total) }));
      town = town.map(x => ({ ...x, current: clamp(+byName.get(x.name)?.current || x.current, 0, x.total) }));
      fishing = fishing.map(x => ({ ...x, current: clamp(+byName.get(x.name)?.current || x.current, 0, x.total) }));
    }

    return { farm, town, fishing };
  }, []);

  const [state, setState] = useState(load);

  // Progresos y persistencia
  const farmPct     = pctFromCounters(state.farm);
  const townPct     = pctFromCounters(state.town);
  const fishingPct  = pctFromCounters(state.fishing);
  const combinedPct = (() => {
    const items = [...state.farm, ...state.town, ...state.fishing];
    return pctFromCounters(items);
  })();

  useEffect(() => {
    const items = [...state.farm, ...state.town, ...state.fishing];
    const all = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }})();
    all.expansion = { items, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [state]);

  // Helpers de +/- por sección
  const decr = (section, i) => setState(prev => {
    const list = prev[section].map((r, idx) =>
      idx === i ? { ...r, current: clamp(r.current - 1, 0, r.total) } : r
    );
    return { ...prev, [section]: list };
  });
  const incr = (section, i) => setState(prev => {
    const list = prev[section].map((r, idx) =>
      idx === i ? { ...r, current: clamp(r.current + 1, 0, r.total) } : r
    );
    return { ...prev, [section]: list };
  });

  const Section = ({ title, rows, sectionKey, pct }) => (
    <section className="card" style={{ marginTop: 20 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="progress" style={{ marginBottom: 12 }}>
        <div className="done" style={{ width: `${pct}%` }} />
        <div className="todo" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="progress-note">{pct.toFixed(2)}% completed</div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="hd-table" aria-label={title}>
          <thead>
            <tr>
              <th>Name</th>
              <th className="center">Owned</th>
              <th className="center">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name + i}>
                <td className="name-cell">{r.name}</td>
                <td className="center">
                  <Counter
                    value={r.current}
                    max={r.total}
                    onDecr={() => decr(sectionKey, i)}
                    onIncr={() => incr(sectionKey, i)}
                  />
                </td>
                <td className="center">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <main className="container">
      {/* Progreso total */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Expansion — Overall Progress</h2>
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${combinedPct}%` }} />
          <div className="todo" style={{ width: `${100 - combinedPct}%` }} />
        </div>
        <div className="progress-note">{combinedPct.toFixed(2)}% completed</div>
      </section>

      <Section title="Farm"            rows={state.farm}     sectionKey="farm"     pct={farmPct} />
      <Section title="Town"            rows={state.town}     sectionKey="town"     pct={townPct} />
      <Section title="Fishable Areas"  rows={state.fishing}  sectionKey="fishing"  pct={fishingPct} />
    </main>
  );
}
