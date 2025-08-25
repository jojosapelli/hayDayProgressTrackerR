// src/pages/TreesAndBushes.jsx
import React, { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

const masterRows = [
  "Apple Tree",
  "Raspberry Bush",
  "Cherry Tree",
  "Blackberry Bush",
  "Blueberry Bush",
  "Cacao Tree",
  "Nectar Bush",
  "Coffee Bush",
  "Olive Tree",
  "Peanut Bush",
  "Lemon Tree",
  "Orange Tree",
  "Peach Tree",
  "Banana Tree",
  "Plum Tree",
  "Mango Tree",
  "Coconut Tree",
  "Guava Tree",
  "Pomegranate Tree",
];

export default function TreesAndBushes() {
  const base = import.meta.env.BASE_URL;

  // Estado inicial (storage o master) — ahora usamos levels:[0/1]
  const initial = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const saved = all["trees-bushes"];
      // Aceptamos tanto el formato nuevo (levels) como el viejo (unlocked) y normalizamos
      if (saved?.rows?.length) {
        const rows = saved.rows.map((r) => {
          if (Array.isArray(r?.levels)) return { name: r.name, levels: [r.levels[0] ? 1 : 0] };
          return { name: r.name, levels: [r.unlocked ? 1 : 0] }; // compatibilidad
        });
        return { rows, updatedAt: new Date().toISOString() };
      }
    } catch {}
    return {
      rows: masterRows.map((name) => ({ name, levels: [0] })),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const [data, setData] = useState(initial);

  // Guardar en localStorage con la clave que Home espera: "trees-bushes"
  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    })();
    all["trees-bushes"] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [data]);

  // Toggle (levels[0])
  const toggle = (rowIdx) => {
    setData((prev) => {
      const next = { ...prev, rows: prev.rows.map((r) => ({ ...r, levels: [...r.levels] })) };
      next.rows[rowIdx].levels[0] = next.rows[rowIdx].levels[0] ? 0 : 1;
      return next;
    });
  };

  // % completado (promedio de levels[0])
  const pct = useMemo(() => {
    if (!data.rows.length) return 0;
    const sum = data.rows.reduce((a, r) => a + (r.levels?.[0] ? 1 : 0), 0);
    return (sum / data.rows.length) * 100;
  }, [data.rows]);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Trees & Bushes</h2>

        {/* Barra de progreso dentro del contenedor */}
        <div className="progress" style={{ margin: "12px 0" }}>
          <div className="done" style={{ width: `${pct.toFixed(2)}%` }} />
          <div className="todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        {/* Tabla */}
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Trees and Bushes">
            <thead>
              <tr>
                <th style={{ width: "60%" }}>Tree / Bush</th>
                <th className="center">Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">
                    <StarToggle
                      checked={!!r.levels?.[0]}
                      onChange={() => toggle(i)}
                      label={`${r.name} completed`}
                      imgOn={`${base}assets/unlocked.png`}
                      imgOff={`${base}assets/locked.png`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
