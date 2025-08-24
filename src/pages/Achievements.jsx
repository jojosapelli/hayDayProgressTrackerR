// src/pages/Achievements.jsx
import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hayday-progress-v1";

const masterRows = [
  "Beep Beep!", "Patronage", "Cha-Ching!", "Stevedore", "Egghead", "Got Milk?",
  "Baconator", "Sheep Shearer", "Goat Goader", "Hyper Harvester", "Turbo Trucker",
  "Hyper Herder", "Captain", "Citizen Kane", "Farm Tycoon", "Dream Farm",
  "Fruit Farmer", "Berry Picker", "Green Thumb", "Gold Miner", "Helter Smelter",
  "Best Friends", "Tasty Treats", "Co-op", "Land Owner", "High Roller",
  "Boat Score Hunter", "Sports Fisher", "Big Game Fisher", "Fish Farmer",
  "Fisherman's Friend", "Lobster Gourmand", "Pool Party", "Happy Town Visitors",
  "Master of Service", "Town Explorer", "Duck Coiffeur", "Beauty Salon",
  "Sweet Treat", "All Abuzz", "Diligent Neighbor", "Taskmaster", "Derby Champ",
  "Generous Neighbor", "Savannah Sanctuary", "Big Appetites", "Bingo Bonanza",
  "Savannah Babies", "Go Nuts!", "Furry Friends"
];

// progreso total
function calcPct(rows) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  const perRow = rows.map(r => {
    const lv = Array.isArray(r.levels) ? r.levels : [];
    if (!lv.length) return null;
    const done = lv.reduce((a, b) => a + (b ? 1 : 0), 0);
    return done / lv.length;
  }).filter(v => v !== null);
  if (!perRow.length) return 0;
  const avg = perRow.reduce((a, b) => a + b, 0) / perRow.length;
  return +(avg * 100).toFixed(2);
}

// devuelve el archivo correcto según el estado del nivel
function getImgForLevel(levelIdx, checked, baseUrl) {
  if (!checked) return `${baseUrl}assets/LockedPrize.png`;
  if (levelIdx === 0) return `${baseUrl}assets/Level1Prize.png`;
  if (levelIdx === 1) return `${baseUrl}assets/Level2Prize.png`;
  return `${baseUrl}assets/Level3Prize.png`;
}

export default function Achievements() {
  const base = import.meta.env.BASE_URL;

  // carga inicial
  const initial = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const saved = all.achievements;
      if (Array.isArray(saved?.rows) && saved.rows.length) {
        const byName = new Map(saved.rows.map(r => [String(r?.name ?? ""), r]));
        const rows = masterRows.map(name => {
          const r = byName.get(name);
          let lv = Array.isArray(r?.levels) ? r.levels.slice(0, 3) : [];
          while (lv.length < 3) lv.push(0);
          return { name, levels: lv.map(x => (x ? 1 : 0)) };
        });
        return { rows, updatedAt: new Date().toISOString() };
      }
    } catch {}
    return {
      rows: masterRows.map(name => ({ name, levels: [0, 0, 0] })),
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const [data, setData] = useState(initial);

  // persistencia
  useEffect(() => {
    const all = (() => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    })();
    all.achievements = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [data]);

  // toggle de nivel
  const toggle = (rowIdx, lvlIdx) => {
    setData(prev => {
      const copy = { ...prev, rows: prev.rows.map(r => ({ ...r, levels: [...r.levels] })) };
      copy.rows[rowIdx].levels[lvlIdx] = copy.rows[rowIdx].levels[lvlIdx] ? 0 : 1;
      return copy;
    });
  };

  const pct = useMemo(() => calcPct(data.rows), [data.rows]);

  return (
    <main className="container">
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Achievements</h2>

        {/* barra de progreso */}
        <div className="progress" style={{ margin: "12px 0" }}>
          <div className="done" style={{ width: `${pct.toFixed(2)}%` }} />
          <div className="todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        {/* tabla */}
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Achievements">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Achievement</th>
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
                      <button
                        type="button"
                        className="star-btn"
                        onClick={() => toggle(i, j)}
                        aria-pressed={val ? "true" : "false"}
                        aria-label={`${r.name} – Level ${j + 1}`}
                      >
                        <img
                          src={getImgForLevel(j, !!val, base)}
                          alt={val ? `Level ${j + 1} unlocked` : "Locked"}
                          style={{ width: 52, height: 52, objectFit: "contain" }}
                          draggable="false"
                        />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
