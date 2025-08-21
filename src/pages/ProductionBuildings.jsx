import React, { useEffect, useMemo, useState } from 'react';
import StarToggle from "../components/StarToggle";

const masterRows = [
  "Bakery","Feed mill","Feed mill","Dairy","Sugar mill","Sugar mill","Popcorn pot","BBQ grill",
  "Pie oven","Loom","Sewing machine","Cake oven","Smelter","Smelter","Smelter","Smelter","Smelter",
  "Juice press","Ice cream maker","Jam maker","Jeweler","Honey extractor","Coffee kiosk","Soup kitchen",
  "Candle maker","Flower shop","Candy machine","Sauce maker","Sushi bar","Salad bar","Sandwich bar",
  "Smoothie mixer","Pasta maker","Essential oils lab","Wok kitchen","Hat maker","Pasta kitchen",
  "Hot dog stand","Donut maker","Taco kitchen","Omelet Station","Tea stand","Fondue pot","Bath kiosk",
  "Deep fryer","Preservation station","Pottery Studio","Fudge shop","Yogurt maker","Stew pot",
  "Cupcake maker","Perfumerie","Waffle Maker","Porridge Bar","Milkshake Bar"
];

const STORAGE_KEY = "hayday-progress-v1";

export default function ProductionBuildings() {
  const base = import.meta.env.BASE_URL;

  // Cargar estado inicial (storage o master)
  const initial = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const saved = all.production;
      if (saved?.rows?.length === masterRows.length && saved?.rows?.[0]?.levels?.length === 4) {
        return saved;
      }
    } catch {}
    return {
      rows: masterRows.map(name => ({ name, levels: [0,0,0,0] })),
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
    all.production = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [data]);

  // Toggle de checkbox
  const toggle = (rowIdx, colIdx) => {
    setData(prev => {
      const copy = { ...prev, rows: prev.rows.map(r => ({...r, levels: [...r.levels]})) };
      copy.rows[rowIdx].levels[colIdx] = copy.rows[rowIdx].levels[colIdx] ? 0 : 1;
      return copy;
    });
  };

  // % completado promedio
  const pct = useMemo(() => {
    if (!data.rows.length) return 0;
    const vals = data.rows
      .map(r => {
        const t = r.levels.length || 0;
        if (!t) return null;
        const sum = r.levels.reduce((a,b)=> a + (b ? 1 : 0), 0);
        return sum / t;
      })
      .filter(v => v !== null);
    if (!vals.length) return 0;
    return (vals.reduce((a,b)=>a+b,0) / vals.length) * 100;
  }, [data.rows]);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Production Buildings</h2>

        {/* === Barra de progreso dentro del mismo contenedor === */}
        <div className="progress" style={{ margin: "12px 0" }}>
          <div className="done" style={{ width: `${pct.toFixed(2)}%` }} />
          <div className="todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        {/* === Tabla === */}
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Production Buildings Progress">
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
              {data.rows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((val, j) => (
                    <td className="center" key={j}>
                      {j === 0 ? (
                        // 1ª columna → imágenes personalizadas (unlocked/locked)
                        <StarToggle
                          checked={!!val}
                          onChange={() => toggle(i, j)}
                          label={`${r.name} – Level ${j + 1}`}
                          imgOn={`${base}assets/unlocked.png`}
                          imgOff={`${base}assets/locked.png`}
                        />
                      ) : (
                        // Otras columnas → estrellas por defecto (no paso imágenes)
                        <StarToggle
                          checked={!!val}
                          onChange={() => toggle(i, j)}
                          label={`${r.name} – Level ${j + 1}`}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
