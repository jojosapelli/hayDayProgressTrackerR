// src/pages/Crops.jsx
import React, { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

const cropsMaster = [
  "Wheat","Corn","Soybean","Sugarcane","Carrot","Indigo","Pumpkin","Cotton",
  "Chili Pepper","Tomato","Strawberry","Potato","Chamomile","Asparagus","Sesame",
  "Pineapple","Lily","Rice","Lettuce","Garlic","Sunflower","Cabbage","Onion",
  "Cucumber","Beetroot","Bell Pepper","Ginger","Tea Leaf","Peony","Broccoli",
  "Grapes","Mint","Passion Fruit","Mushroom","Eggplant","Watermelon","Clay",
  "Chickpea","Oats",
];

export default function Crops() {
  const base = import.meta.env.BASE_URL;

  // Inicialización: intenta cargar "crops" del storage; si no, crea desde master
  const initial = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const saved = all["crops"];
      const ok =
        Array.isArray(saved?.rows) &&
        saved.rows.length === cropsMaster.length &&
        Array.isArray(saved.rows[0]?.levels) &&
        saved.rows[0].levels.length === 1;
      if (ok) return saved;
    } catch {}
    return {
      rows: cropsMaster.map((name) => ({ name, levels: [0] })), // 1 sola casilla (Unlocked)
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const [data, setData] = useState(initial);

  // Persistencia
  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    })();
    all["crops"] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [data]);

  // Toggle (única columna)
  const toggle = (rowIdx) => {
    setData((prev) => {
      const copy = {
        ...prev,
        rows: prev.rows.map((r) => ({ ...r, levels: [...r.levels] })),
      };
      copy.rows[rowIdx].levels[0] = copy.rows[rowIdx].levels[0] ? 0 : 1;
      return copy;
    });
  };

  // % completado
  const pct = useMemo(() => {
    if (!data.rows.length) return 0;
    const vals = data.rows
      .map((r) => {
        const t = r.levels.length || 0; // 1
        if (!t) return null;
        const sum = r.levels.reduce((a, b) => a + (b ? 1 : 0), 0);
        return sum / t; // 0 ó 1
      })
      .filter((v) => v !== null);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
  }, [data.rows]);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Crops</h2>

        {/* Progress bar dentro del contenedor */}
        <div className="progress" style={{ margin: "12px 0" }}>
          <div className="done" style={{ width: `${pct.toFixed(2)}%` }} />
          <div className="todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        {/* Tabla */}
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Crops">
            <thead>
              <tr>
                <th style={{ width: "70%" }}>Crops</th>
                <th className="center">Unlocked</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">
                    <StarToggle
                      checked={!!r.levels[0]}
                      onChange={() => toggle(i)}
                      label={`${r.name} – Unlocked`}
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
