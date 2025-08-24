// src/pages/Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

// Lista de productos (Lvl 100+)
const productsMaster = [
  "Chamomile Tea",
  "Mushroom Pasta",
  "Macaroon",
  "Plum Smoothie",
  "Dried Fruit",
  "Mint Fudge",
  "Coconut Ice Cream",
  "Samosa",
  "Plain Yogurt",
  "Mushroom Soup",
  "Chili Fudge",
  "Tropical Smoothie",
  "Guava Juice",
  "Guava Compote",
  "Strawberry Yogurt",
  "Veggie Bouquet",
  "Chickpea Stew",
  "Fruit Sorbet",
  "Pomegranate Tea",
  "Lemon Fudge",
  "Pomegranate Cake",
  "Hummus Wrap",
  "Tropical Yogurt",
  "Chili Stew",
  "Plain Cupcake",
  "Guava Cupcake",
  "Rice Ball",
  "Fresh Diffuser",
  "Peanut Fudge",
  "Winter Stew",
  "Tropical Cupcake",
  "Zesty Perfume",
  "Cookie Cupcake",
  "Plain Waffles",
  "Berry Waffles",
  "Calming Diffuser",
  "Orange Salad",
  "Chocolate Waffles",
  "Breakfast Waffles",
  "Breakfast Bowl",
  "Apple Porridge",
  "Pineapple Coconut Bars",
  "Sweet Porridge",
  "Rich Soap",
  "Fresh Porridge",
  "Vanilla Milkshake",
  "Mocha Milkshake",
  "Fruity Milkshake",
];

export default function Products() {
  const base = import.meta.env.BASE_URL;

  // Estado inicial: intenta cargar "products" del storage; si no, arma desde master
  const initial = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const saved = all["products"];
      const ok =
        Array.isArray(saved?.rows) &&
        saved.rows.length === productsMaster.length &&
        Array.isArray(saved.rows[0]?.levels) &&
        saved.rows[0].levels.length === 1;

      if (ok) return saved;
    } catch {
      /* ignore */
    }
    return {
      rows: productsMaster.map((name) => ({ name, levels: [0] })), // 1 sola “casilla”
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const [data, setData] = useState(initial);

  // Persistencia
  useEffect(() => {
    const all = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    })();
    all["products"] = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [data]);

  // Toggle (solo columna 0)
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

  // % completado (promedio de la única casilla por fila)
  const pct = useMemo(() => {
    if (!data.rows.length) return 0;
    const vals = data.rows
      .map((r) => {
        const t = r.levels.length || 0; // será 1
        if (!t) return null;
        const sum = r.levels.reduce((a, b) => a + (b ? 1 : 0), 0);
        return sum / t; // 0 o 1
      })
      .filter((v) => v !== null);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length) * 100;
  }, [data.rows]);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Products (Lvl 100+)</h2>

        {/* Progress bar dentro del contenedor */}
        <div className="progress" style={{ margin: "12px 0" }}>
          <div className="done" style={{ width: `${pct.toFixed(2)}%` }} />
          <div className="todo" style={{ width: `${(100 - pct).toFixed(2)}%` }} />
        </div>
        <div className="progress-note">{pct.toFixed(2)}% completed</div>

        {/* Tabla */}
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="hd-table" aria-label="Products 100+">
            <thead>
              <tr>
                <th style={{ width: "70%" }}>Product</th>
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
