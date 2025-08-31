import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

// Lista base con máximos
const homesMaster = [
  { name: "Chickens",         total: 3 },
  { name: "Cows",             total: 3 },
  { name: "Pigs",             total: 3 },
  { name: "Sheeps",           total: 3 },
  { name: "Goats",            total: 3 },
  { name: "Beehive",          total: 1 },
  { name: "Squirrel Tree",    total: 1 },
  { name: "Dogs",             total: 2 },
  { name: "Puppies",          total: 2 },
  { name: "Cat",              total: 2 },
  { name: "Kittens",          total: 2 },
  { name: "Bunnies",          total: 2 },
  { name: "Horses & Ponies",  total: 5 },
  { name: "Donkeys",          total: 2 },
  { name: "Guinea Pigs",      total: 2 },
  { name: "Birds",            total: 1 },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pct = (items) => {
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

export default function AnimalHomes() {
  const load = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    let items = all?.animalHomes?.items;
    if (!Array.isArray(items) || !items.length) {
      items = homesMaster.map(h => ({ name: h.name, current: 0, total: h.total }));
    } else {
      const byName = new Map(items.map(x => [String(x?.name ?? ""), x]));
      items = homesMaster.map(h => {
        const r = byName.get(h.name);
        const current = clamp(+r?.current || 0, 0, +h.total || 0);
        return { name: h.name, current, total: +h.total || 0 };
      });
    }
    return { items };
  }, []);

  const [{ items }, setState] = useState(load);
  const progress = pct(items);

  useEffect(() => {
    const all = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }})();
    all.animalHomes = { items, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [items]);

  const incr = (i) => setState(prev => {
    const next = prev.items.map((r, idx) =>
      idx === i ? { ...r, current: clamp(r.current + 1, 0, r.total) } : r
    );
    return { items: next };
  });
  const decr = (i) => setState(prev => {
    const next = prev.items.map((r, idx) =>
      idx === i ? { ...r, current: clamp(r.current - 1, 0, r.total) } : r
    );
    return { items: next };
  });

  return (
    <main className="container">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Animal Homes</h2>

        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${progress}%` }} />
          <div className="todo" style={{ width: `${100 - progress}%` }} />
        </div>
        <div className="progress-note">{progress.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Animal Homes">
            <thead>
              <tr>
                <th>Animal House</th>
                <th className="center">Owned</th>
                <th className="center">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">
                    <Counter
                      value={r.current}
                      max={r.total}
                      onDecr={() => decr(i)}
                      onIncr={() => incr(i)}
                    />
                  </td>
                  <td className="center">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
