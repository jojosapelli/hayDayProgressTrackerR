import { useEffect, useMemo, useState } from "react";
import StarToggle from "../components/StarToggle";

const STORAGE_KEY = "hayday-progress-v1";

/* ====== Datos base ====== */
const mainMaster = [
  { name: "Town Hall", total: 12 },
  { name: "Train Station", total: 12 },
  { name: "Personal Train", total: 19 },
];

// Service Buildings (ya los tenías en porcentaje/step de 5%)
const serviceMaster = [
  { name: "Grocery Store",        slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Cinema",               slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Diner",                slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Bed and Breakfast",    slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Spa",                  slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Gift Shop",            slots: 6, coins: 12, xp: 12, time: 8 },
  { name: "Beach Café",           slots: 6, coins: 12, xp: 12, time: 8 },
];

const sanctuaryAnimals = [
  "Elephants","Hippos","Giraffes","Zebras","Gorillas","Reindeers",
  "Cheetah","Artic Fox","Walrus","Meerkat","Penguins","Ostrich","Capybara",
];

/* ====== Helpers ====== */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function pctFromCounters(items) {
  if (!Array.isArray(items) || !items.length) return 0;
  const total = items.reduce((a,r)=>a+(+r.total||0),0);
  const curr  = items.reduce((a,r)=>a+(+r.current||0),0);
  if (!total) return 0;
  return +((curr/total)*100).toFixed(2);
}
function pctFromService(rows) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  let num=0, den=0;
  rows.forEach(r=>{
    num += (+r.vals.slots||0)+(+r.vals.coins||0)+(+r.vals.xp||0)+(+r.vals.time||0);
    den += (+r.max.slots||0)+(+r.max.coins||0)+(+r.max.xp||0)+(+r.max.time||0);
  });
  if (!den) return 0;
  return +((num/den)*100).toFixed(2);
}
function pctFromLevels(rows, levelsPerRow=4) {
  if (!Array.isArray(rows) || !rows.length) return 0;
  const done = rows.reduce((a,r)=>a+(Array.isArray(r.levels)?r.levels.reduce((x,y)=>x+(y?1:0),0):0),0);
  const total = rows.length*levelsPerRow;
  if (!total) return 0;
  return +((done/total)*100).toFixed(2);
}

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

/* ====== Componente ====== */
export default function Town() {
  // Carga inicial y normalización
  const load = useMemo(()=>()=> {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { all = {}; }

    // main
    let main = all?.town?.main;
    if (!Array.isArray(main) || !main.length) {
      main = mainMaster.map(m=>({name:m.name, current:0, total:m.total}));
    } else {
      const byName = new Map(main.map(x=>[String(x?.name??""), x]));
      main = mainMaster.map(m=>{
        const r = byName.get(m.name);
        const current = clamp(+r?.current||0, 0, +m.total||0);
        return { name:m.name, current, total:+m.total||0 };
      });
    }

    // services
    let services = all?.town?.services;
    if (!Array.isArray(services) || !services.length) {
      services = serviceMaster.map(s=>({
        name:s.name,
        vals:{ slots:0, coins:0, xp:0, time:0 },
        max: { slots:s.slots, coins:s.coins, xp:s.xp, time:s.time },
      }));
    } else {
      const byName = new Map(services.map(x=>[String(x?.name??""), x]));
      services = serviceMaster.map(s=>{
        const r = byName.get(s.name);
        const vals = {
          slots: clamp(+r?.vals?.slots||0, 0, s.slots),
          coins: clamp(+r?.vals?.coins||0, 0, s.coins),
          xp:    clamp(+r?.vals?.xp   ||0, 0, s.xp),
          time:  clamp(+r?.vals?.time ||0, 0, s.time),
        };
        return { name:s.name, vals, max:{slots:s.slots, coins:s.coins, xp:s.xp, time:s.time} };
      });
    }

    // sanctuary
    let sanctuary = all?.town?.sanctuary;
    if (!Array.isArray(sanctuary) || !sanctuary.length) {
      sanctuary = sanctuaryAnimals.map(n=>({ name:n, levels:[0,0,0,0] }));
    } else {
      const byName = new Map(sanctuary.map(x=>[String(x?.name??""), x]));
      sanctuary = sanctuaryAnimals.map(n=>{
        const r = byName.get(n);
        let lv = Array.isArray(r?.levels) ? r.levels.slice(0,4) : [];
        while (lv.length<4) lv.push(0);
        lv = lv.map(x=>x?1:0);
        return { name:n, levels: lv };
      });
    }

    return { main, services, sanctuary };
  },[]);

  const [state, setState] = useState(load);

  // Persistir (incluye resumen para Home)
  const mainPct      = pctFromCounters(state.main);
  const servicesPct  = pctFromService(state.services);
  const sanctuaryPct = pctFromLevels(state.sanctuary, 4);
  const totalPct     = +(((mainPct + servicesPct + sanctuaryPct)/3).toFixed(2));

  useEffect(()=>{
    const all = (()=>{ try {return JSON.parse(localStorage.getItem(STORAGE_KEY))||{};} catch{ return {}; }})();
    all.town = { ...state, updatedAt: new Date().toISOString() };
    all.townSummary = { totalPct };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, [state, totalPct]);

  /* === Acciones === */
  const decrMain = (i)=> setState(prev=>{
    const copy = { ...prev, main: prev.main.map(r=>({...r})) };
    copy.main[i].current = clamp(copy.main[i].current-1, 0, copy.main[i].total);
    return copy;
  });
  const incrMain = (i)=> setState(prev=>{
    const copy = { ...prev, main: prev.main.map(r=>({...r})) };
    copy.main[i].current = clamp(copy.main[i].current+1, 0, copy.main[i].total);
    return copy;
  });

  const decrService = (i, key)=> setState(prev=>{
    const copy = { ...prev, services: prev.services.map(r=>({ name:r.name, vals:{...r.vals}, max:{...r.max} })) };
    copy.services[i].vals[key] = clamp(copy.services[i].vals[key]-1, 0, copy.services[i].max[key]);
    return copy;
  });
  const incrService = (i, key)=> setState(prev=>{
    const copy = { ...prev, services: prev.services.map(r=>({ name:r.name, vals:{...r.vals}, max:{...r.max} })) };
    copy.services[i].vals[key] = clamp(copy.services[i].vals[key]+1, 0, copy.services[i].max[key]);
    return copy;
  });

  const toggleSanctuary = (i, j)=> setState(prev=>{
    const copy = { ...prev, sanctuary: prev.sanctuary.map(r=>({ name:r.name, levels:[...r.levels] })) };
    copy.sanctuary[i].levels[j] = copy.sanctuary[i].levels[j] ? 0 : 1;
    return copy;
  });

  /* === Render helpers === */
  const SectionProgress = ({ title, pct }) => (
    <>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div className="progress" style={{ marginBottom: 12 }}>
        <div className="done" style={{ width: `${pct}%` }} />
        <div className="todo" style={{ width: `${100 - pct}%` }} />
      </div>
      <div className="progress-note">{pct.toFixed(2)}% completed</div>
    </>
  );

  return (
    <main className="container">
      {/* ===== Sección 1: Progreso total ===== */}
      <section className="card">
        <SectionProgress title="Town — Overall Progress" pct={totalPct} />
      </section>

      {/* ===== Sección 2: Main Buildings (NUEVO FORMATO) ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Main Buildings" pct={mainPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Main Buildings">
            <thead>
              <tr>
                <th>Building</th>
                <th className="center">Current</th>
                <th className="center">Total</th>
              </tr>
            </thead>
            <tbody>
              {state.main.map((r,i)=>(
                <tr key={r.name+i}>
                  <td className="name-cell">{r.name}</td>
                  <td className="center">
                    <Counter
                      value={r.current}
                      max={r.total}
                      onDecr={()=>decrMain(i)}
                      onIncr={()=>incrMain(i)}
                    />
                  </td>
                  <td className="center">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Sección 3: Service Buildings (sin cambios de estructura) ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Service Buildings" pct={servicesPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Service Buildings">
            <thead>
              <tr>
                <th>Building</th>
                <th className="center">Slots</th>
                <th className="center">Coins</th>
                <th className="center">XP & Rep</th>
                <th className="center">Time</th>
                <th className="center">Level</th>
              </tr>
            </thead>
            <tbody>
              {state.services.map((r,i)=>{
                const lvl = (+r.vals.slots||0)+(+r.vals.coins||0)+(+r.vals.xp||0)+(+r.vals.time||0);
                const Btn = ({k}) => {
                  const v = r.vals[k];
                  const max = r.max[k];
                  const isMin = v<=0, isMax = v>=max;
                  const sMin = isMin ? { opacity:.5, filter:"grayscale(1)", cursor:"not-allowed" } : undefined;
                  const sMax = isMax ? { opacity:.5, filter:"grayscale(1)", cursor:"not-allowed" } : undefined;
                  const label = (k==="slots") ? `${v}` : `${v*5}%`; // ya tenías % de 5 en 5

                  return (
                    <div className="svc-counter">
                      <button className="btn-small" disabled={isMin} style={sMin} onClick={()=>decrService(i,k)}>-</button>
                      <span>{label}</span>
                      <button className="btn-small" disabled={isMax} style={sMax} onClick={()=>incrService(i,k)}>+</button>
                    </div>
                  );
                };

                return (
                  <tr key={r.name+i}>
                    <td className="name-cell">{r.name}</td>
                    <td className="center"><Btn k="slots" /></td>
                    <td className="center"><Btn k="coins" /></td>
                    <td className="center"><Btn k="xp" /></td>
                    <td className="center"><Btn k="time" /></td>
                    <td className="center"><strong>{lvl}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Sección 4: Sanctuary Animals ===== */}
      <section className="card" style={{ marginTop: 20 }}>
        <SectionProgress title="Sanctuary Animals" pct={sanctuaryPct} />

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="hd-table" aria-label="Sanctuary Animals">
            <thead>
              <tr>
                <th style={{width:"40%"}}>Animal</th>
                <th className="center">Adult 1</th>
                <th className="center">Adult 2</th>
                <th className="center">Baby 1</th>
                <th className="center">Baby 2</th>
              </tr>
            </thead>
            <tbody>
              {state.sanctuary.map((r,i)=>(
                <tr key={r.name+i}>
                  <td className="name-cell">{r.name}</td>
                  {r.levels.map((v,j)=>(
                    <td key={j} className="center">
                      <StarToggle
                        checked={!!v}
                        onChange={()=>toggleSanctuary(i,j)}
                        label={`${r.name} – Level ${j+1}`}
                      />
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
