// src/pages/AnimalHomes.jsx
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

// Lista base con máximos (según tu planilla)
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

function calcPercent(items) {
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a, r) => a + (+r.total || 0), 0);
  const curr  = items.reduce((a, r) => a + (+r.current || 0), 0);
  if (!total) return 0;
  return +((curr / total) * 100).toFixed(2);
}

export default function AnimalHomes() {
  // Carga inicial (y normalización)
  const load = useMemo(() => () => {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // 🔁 CAMBIO: leemos desde la clave con guion "animal-homes"
    let items = all?.["animal-homes"]?.items;
    if (!Array.isArray(items) || !items.length) {
      // Si no hay nada guardado, inicializamos con current: 0
      items = homesMaster.map(h => ({ name: h.name, current: 0, total: h.total }));
    } else {
      // Normaliza nombres/valores a la lista master
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

  // Persistencia
  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    })();

    // 💾 CAMBIO: guardamos en "animal-homes" (con guion) para que Home lo lea
    all["animal-homes"] = { items, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [items]);

  // Acciones
  const incr = (i) => {
    setState(prev => {
      const next = prev.items.map((r, idx) =>
        idx === i ? { ...r, current: clamp(r.current + 1, 0, r.total) } : r
      );
      return { items: next };
    });
  };

  const decr = (i) => {
    setState(prev => {
      const next = prev.items.map((r, idx) =>
        idx === i ? { ...r, current: clamp(r.current - 1, 0, r.total) } : r
      );
      return { items: next };
    });
  };

  // Progreso total
  const pct = calcPercent(items);

  return (
    <main className="container">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Animal Homes</h2>

        {/* Barra de progreso arriba dentro del contenedor */}
        <div className="progress" style={{ marginBottom: 12 }}>
          <div className="done" style={{ width: `${pct}%` }} />
          <div className="todo" style={{ width: `${(100 - pct)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Animal Homes">
            <thead>
              <tr>
                <th>Animal House</th>
                <th className="center">Completed</th>
                <th className="center">Total</th>
                <th className="center">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">{r.current}</td>
                  <td className="center">{r.total}</td>
                  <td className="center">
                    <div className="counter">
                      <button className="btn-small" onClick={() => decr(i)}>-</button>
                      <button className="btn-small" onClick={() => incr(i)}>+</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
